const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../services/event.service');

const listEvents = async (req, res) => {
  try {
    const events = await getEvents();

    return res.json({
      ok: true,
      data: events,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
};

const createNewEvent = async (req, res) => {
  try {
    const event = await createEvent(req.body);

    return res.status(201).json({
      ok: true,
      message: 'Evento creado correctamente',
      data: event,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
};

const editEvent = async (req, res) => {
  try {
    const event = await updateEvent(req.params.id, req.body);

    return res.json({
      ok: true,
      message: 'Evento actualizado correctamente',
      data: event,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
};

const removeEvent = async (req, res) => {
  try {
    await deleteEvent(req.params.id);

    return res.json({
      ok: true,
      message: 'Evento eliminado correctamente',
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
};

module.exports = {
  listEvents,
  createNewEvent,
  editEvent,
  removeEvent,
};