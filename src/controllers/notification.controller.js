const Notification = require('../models/notification.model');
const {
  getNotificationsByUser,
  createNotificationsForUsers,
} = require('../services/notification.service');
const { sendPushToUserTokens } = require('../utils/push.util');
const { emitDashboardStats } = require('../services/dashboard.service');

async function getNotifications(req, res) {
  try {
    const notifications = await getNotificationsByUser(req.user);

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

async function sendNotification(req, res) {
  try {
    const {
      title,
      message,
      category = 'General',
      type = 'info',
      userIds = [],
      sendToAll = false,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        ok: false,
        message: 'El título y el mensaje son obligatorios',
      });
    }

    const result = await createNotificationsForUsers({
      title,
      message,
      category,
      type,
      userIds,
      sendToAll,
      createdBy: req.user.id,
      createdByName: req.user.name,
    });

    const io = req.app.get('io') || global.io;
    const updatedNotifications = [];

    for (let i = 0; i < result.notifications.length; i++) {
      const notification = result.notifications[i];
      const user = result.users[i];

      try {
        await sendPushToUserTokens({
          user,
          title: notification.title,
          body: notification.message,
          data: {
            notificationId: notification._id.toString(),
            category: notification.category || 'General',
            type: notification.type || 'info',
          },
        });

        const updatedNotification = await Notification.findByIdAndUpdate(
          notification._id,
          {
            sendStatus: 'sent',
            sentAt: new Date(),
          },
          { new: true }
        );

        if (io && updatedNotification) {
          io.to(`user:${user._id.toString()}`).emit(
            'notification:new',
            updatedNotification
          );

          io.to('admins').emit(
            'notification:history-updated',
            updatedNotification
          );
        }

        updatedNotifications.push(updatedNotification);
      } catch (pushError) {
        console.error(
          `❌ Error enviando notificación ${notification._id} al usuario ${user._id}:`,
          pushError
        );

        const failedNotification = await Notification.findByIdAndUpdate(
          notification._id,
          {
            sendStatus: 'failed',
          },
          { new: true }
        );

        if (io && failedNotification) {
          io.to(`user:${user._id.toString()}`).emit(
            'notification:new',
            failedNotification
          );

          io.to('admins').emit(
            'notification:history-updated',
            failedNotification
          );
        }

        updatedNotifications.push(failedNotification);
      }
    }

    await emitDashboardStats(io);

    return res.status(201).json({
      ok: true,
      message: 'Proceso de envío finalizado',
      data: updatedNotifications,
    });
  } catch (error) {
    console.error('❌ sendNotification error', error);
    return res.status(400).json({
      ok: false,
      message: error.message || 'Error al enviar la notificación',
    });
  }
}

module.exports = {
  getNotifications,
  sendNotification,
};