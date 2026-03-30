const Notification = require('../models/notification.model');

const getNotifications = async () => {
  return await Notification.find()
    .populate('recipients', 'name email')
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 });
};

const createNotification = async (payload) => {
  return await Notification.create(payload);
};

module.exports = {
  getNotifications,
  createNotification,
};