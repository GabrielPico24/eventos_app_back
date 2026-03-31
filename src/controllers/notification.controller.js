const Notification = require('../models/notification.model');

async function getNotifications(req, res) {
  try {
    const notifications = await Notification.find({
      $or: [
        { userId: null },
        { userId: req.user.id },
      ],
    }).sort({ createdAt: -1 });

    return res.json({
      ok: true,
      data: notifications,
    });
  } catch (error) {
    console.error('❌ getNotifications error', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al listar notificaciones',
    });
  }
}

module.exports = {
  getNotifications,
};