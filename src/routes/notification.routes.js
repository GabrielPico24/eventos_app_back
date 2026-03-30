const express = require('express');
const {
  listNotifications,
  createNewNotification,
} = require('../controllers/notification.controller');
const { authMiddleware, adminOnly } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, adminOnly, listNotifications);
router.post('/', authMiddleware, adminOnly, createNewNotification);

module.exports = router;