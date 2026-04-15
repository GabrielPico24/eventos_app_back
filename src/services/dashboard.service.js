const User = require('../models/user.model');
const Event = require('../models/event.model');
const Notification = require('../models/notification.model');

async function getAdminDashboardStatsService() {
  const totalUsers = await User.countDocuments();

  const totalEvents = await Event.countDocuments({
    isActive: true,
  });

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