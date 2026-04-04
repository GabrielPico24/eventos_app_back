const express = require('express');
const {
  listUsers,
  createNewUser,
  editUser,
  removeUser,
  saveMyFcmToken,
  deleteMyFcmToken,
} = require('../controllers/user.controller');
const { authMiddleware, adminOnly } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, adminOnly, listUsers);
router.post('/', authMiddleware, adminOnly, createNewUser);
router.put('/:id', authMiddleware, adminOnly, editUser);
router.delete('/:id', authMiddleware, adminOnly, removeUser);

// FCM
router.post('/me/fcm-token', authMiddleware, saveMyFcmToken);
router.delete('/me/fcm-token', authMiddleware, deleteMyFcmToken);

module.exports = router;