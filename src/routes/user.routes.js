const express = require('express');
const {
  listUsers,
  createNewUser,
  editUser,
  removeUser,
} = require('../controllers/user.controller');
const { authMiddleware, adminOnly } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, adminOnly, listUsers);
router.post('/', authMiddleware, adminOnly, createNewUser);
router.put('/:id', authMiddleware, adminOnly, editUser);
router.delete('/:id', authMiddleware, adminOnly, removeUser);

module.exports = router;