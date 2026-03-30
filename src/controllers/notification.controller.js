const {
  getNotifications,
  createNotification,
} = require('../services/notification.service');

const listNotifications = async (req, res) => {
  try {
    const notifications = await getNotifications();

    return res.json({
      ok: true,
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
};

const createNewNotification = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      createdBy: req.user.id,
    };

    const notification = await createNotification(payload);

    return res.status(201).json({
      ok: true,
      message: 'Notificación creada correctamente',
      data: notification,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
};

module.exports = {
  listNotifications,
  createNewNotification,
};