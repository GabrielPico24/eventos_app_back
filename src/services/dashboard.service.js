const User = require('../models/user.model');
const Event = require('../models/event.model');
const Notification = require('../models/notification.model');

async function getAdminDashboardStatsService() {
  const now = new Date();

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Solo usuarios normales activos
  const totalUsers = await User.countDocuments({
    role: 'user',
    isActive: true,
  });

  // Eventos activos del mes actual
  // Ajusta "date" si en tu modelo se guarda como Date real o como String
  const totalEvents = await Event.countDocuments({
    isActive: true,
    date: {
      $gte: startOfMonth,
      $lt: endOfMonth,
    },
  });

  // Avisos pendientes
  const pendingNotifications = await Notification.countDocuments({
    sendStatus: 'pending',
  });

  return {
    totalUsers,
    totalEvents,
    pendingNotifications,
  };
}

async function emitDashboardStats(io) {
  try {
    if (!io) return;

    const stats = await getAdminDashboardStatsService();

    io.to('admins').emit('dashboard:stats-updated', stats);
  } catch (error) {
    console.error('❌ emitDashboardStats error', error);
  }
}

module.exports = {
  getAdminDashboardStatsService,
  emitDashboardStats,
};