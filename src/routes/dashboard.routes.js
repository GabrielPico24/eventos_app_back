const express = require('express');
const router = express.Router();

const {
  getAdminDashboardStats,
} = require('../controllers/dashboard.controller');

const {
  authMiddleware,
  adminOnly,
} = require('../middlewares/auth.middleware');

router.get('/admin-stats', authMiddleware, adminOnly, getAdminDashboardStats);

module.exports = router;