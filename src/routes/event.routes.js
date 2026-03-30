const express = require('express');
const {
  listEvents,
  createNewEvent,
  editEvent,
  removeEvent,
} = require('../controllers/event.controller');
const { authMiddleware, adminOnly } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, listEvents);
router.post('/', authMiddleware, adminOnly, createNewEvent);
router.put('/:id', authMiddleware, adminOnly, editEvent);
router.delete('/:id', authMiddleware, adminOnly, removeEvent);

module.exports = router;