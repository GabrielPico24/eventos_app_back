const express = require('express');
const { authMiddleware, adminOnly } = require('../middlewares/auth.middleware');
const {
  getNotifications,
  sendNotification,
} = require('../controllers/notification.controller');

const router = express.Router();

router.get('/', authMiddleware, getNotifications);
router.post('/send', authMiddleware, adminOnly, sendNotification);

module.exports = router;