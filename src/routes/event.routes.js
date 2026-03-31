const express = require('express');
const { authMiddleware } = require('../middlewares/auth.middleware');
const {
  listEvents,
  createNewEvent,
  updateExistingEvent,
  deleteExistingEvent,
} = require('../controllers/event.controller');

const router = express.Router();

router.get('/', authMiddleware, listEvents);
router.post('/', authMiddleware, createNewEvent);
router.put('/:id', authMiddleware, updateExistingEvent);
router.delete('/:id', authMiddleware, deleteExistingEvent);

module.exports = router;