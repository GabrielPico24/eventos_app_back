const express = require('express');
const { authMiddleware } = require('../middlewares/auth.middleware');
const {
  listEvents,
  listMyEvents,
  createNewEvent,
  updateExistingEvent,
  toggleExistingEventStatus,
} = require('../controllers/event.controller');

const router = express.Router();

router.get('/', authMiddleware, listEvents);
router.get('/my-events', authMiddleware, listMyEvents);
router.post('/', authMiddleware, createNewEvent);
router.put('/:id', authMiddleware, updateExistingEvent);
router.patch('/:id/status', authMiddleware, toggleExistingEventStatus);

module.exports = router;