const {
  getAdminDashboardStatsService,
} = require('../services/dashboard.service');

async function getAdminDashboardStats(req, res) {
  try {
    const stats = await getAdminDashboardStatsService();

    return res.status(200).json({
      ok: true,
      data: stats,
    });
  } catch (error) {
    console.error('❌ getAdminDashboardStats error', error);

    return res.status(500).json({
      ok: false,
      message: 'Error al obtener estadísticas del dashboard',
      error: error.message,
    });
  }
}

module.exports = {
  getAdminDashboardStats,
};