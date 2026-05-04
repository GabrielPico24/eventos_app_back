const User = require('../models/user.model');
const Event = require('../models/event.model');

function parseEventDate(value) {
  if (!value) return null;

  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }

  const text = value.toString().trim();

  // Formato ISO o yyyy-MM-dd
  // Ejemplo: 2026-05-03
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const date = new Date(text);
    return isNaN(date.getTime()) ? null : date;
  }

  // Formato dd/MM/yyyy
  // Ejemplo: 03/05/2026
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [day, month, year] = text.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
  }

  const fallback = new Date(text);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function parseEventDateTime(dateValue, timeValue) {
  const date = parseEventDate(dateValue);

  if (!date) return null;

  const finalDate = new Date(date);
  finalDate.setHours(0, 0, 0, 0);

  if (!timeValue || typeof timeValue !== 'string') {
    return finalDate;
  }

  const timeText = timeValue.trim().toUpperCase();

  let hours = 0;
  let minutes = 0;

  // Formato 24 horas: 14:30
  const match24 = timeText.match(/^(\d{1,2}):(\d{2})$/);

  if (match24) {
    hours = Number(match24[1]);
    minutes = Number(match24[2]);
  } else {
    // Formato 12 horas: 10PM, 10 PM, 10:30PM, 10:30 PM
    const match12 = timeText.match(/^(\d{1,2})(?::(\d{2}))?\s?(AM|PM)$/);

    if (match12) {
      hours = Number(match12[1]);
      minutes = Number(match12[2] || 0);

      if (match12[3] === 'PM' && hours !== 12) {
        hours += 12;
      }

      if (match12[3] === 'AM' && hours === 12) {
        hours = 0;
      }
    }
  }

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return finalDate;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return finalDate;
  }

  finalDate.setHours(hours, minutes, 0, 0);

  return finalDate;
}

async function getAdminDashboardStatsService() {
  const now = new Date();

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalUsers = await User.countDocuments({
    role: 'user',
    isActive: true,
  });

  const activeEvents = await Event.find({
    isActive: true,
  }).select('date time notify24hBefore notify1hBefore notifyAtTime');

  const totalEvents = activeEvents.filter((event) => {
    const eventDate = parseEventDate(event.date);

    if (!eventDate) return false;

    return (
      eventDate.getMonth() === currentMonth &&
      eventDate.getFullYear() === currentYear
    );
  }).length;

  const pendingNotifications = activeEvents.filter((event) => {
    const eventDateTime = parseEventDateTime(event.date, event.time);

    if (!eventDateTime) return false;

    const hasNotificationEnabled =
      event.notify24hBefore === true ||
      event.notify1hBefore === true ||
      event.notifyAtTime === true;

    return eventDateTime >= now && hasNotificationEnabled;
  }).length;

  return {
    totalUsers,
    totalEvents,
    pendingNotifications,
  };
}

async function emitDashboardStats(io) {
  try {
    if (!io) {
      console.log('⚠️ emitDashboardStats: io no disponible');
      return;
    }

    const stats = await getAdminDashboardStatsService();

    console.log('📊 Emitiendo dashboard:stats-updated =>', stats);

    io.to('admins').emit('dashboard:stats-updated', stats);
  } catch (error) {
    console.error('❌ emitDashboardStats error', error);
  }
}

module.exports = {
  getAdminDashboardStatsService,
  emitDashboardStats,
};