const Event = require('../models/event.model');

const getEvents = async () => {
  return await Event.find()
    .populate('category')
    .sort({ createdAt: -1 });
};

const createEvent = async (payload) => {
  return await Event.create(payload);
};

const updateEvent = async (id, payload) => {
  const event = await Event.findByIdAndUpdate(id, payload, {
    new: true,
  }).populate('category');

  if (!event) {
    throw new Error('Evento no encontrado');
  }

  return event;
};

const deleteEvent = async (id) => {
  const event = await Event.findByIdAndDelete(id);

  if (!event) {
    throw new Error('Evento no encontrado');
  }

  return true;
};

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
};