const express = require('express');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { getNotifications } = require('../controllers/notification.controller');

const router = express.Router();

router.get('/', authMiddleware, getNotifications);

module.exports = router;