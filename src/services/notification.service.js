const Notification = require('../models/notification.model');
const User = require('../models/user.model');

const getNotificationsByUser = async (user) => {
  if (user.role === 'admin') {
    return await Notification.find({
      createdBy: user.id,
    }).sort({ createdAt: -1 });
  }

  return await Notification.find({
    $or: [{ userId: null }, { userId: user.id }],
  }).sort({ createdAt: -1 });
};

const createNotificationsForUsers = async ({
  title,
  message,
  category = 'General',
  type = 'info',
  userIds = [],
  createdBy,
  createdByName,
  sendToAll = false,
}) => {
  let targetUsers = [];

  if (sendToAll) {
    targetUsers = await User.find({
      role: 'user',
      isActive: true,
    }).select('_id name email fcmTokens');
  } else {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('Debes seleccionar al menos un usuario');
    }

    targetUsers = await User.find({
      _id: { $in: userIds },
      role: 'user',
      isActive: true,
    }).select('_id name email fcmTokens');

    if (targetUsers.length !== userIds.length) {
      throw new Error(
        'Uno o varios usuarios seleccionados no existen o están inactivos'
      );
    }
  }

  const docs = targetUsers.map((user) => ({
    title: title.trim(),
    message: message.trim(),
    category: category.trim(),
    type,
    userId: user._id,
    createdBy,
    createdByName,
    read: false,
    sendStatus: 'pending',
    sentAt: null,
    metadata: {
      targetUserName: user.name,
      targetUserEmail: user.email,
    },
  }));

  const savedNotifications = await Notification.insertMany(docs);

  return {
    notifications: savedNotifications,
    users: targetUsers,
  };
};

module.exports = {
  getNotificationsByUser,
  createNotificationsForUsers,
};