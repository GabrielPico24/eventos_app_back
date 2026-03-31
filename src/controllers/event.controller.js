const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../services/event.service');

async function listEvents(req, res) {
  try {
    const events = await getEvents();

    return res.json({
      ok: true,
      data: events,
    });
  } catch (error) {
    console.error('❌ getEvents error', error);
    return res.status(500).json({
      ok: false,
      message: error.message || 'Error al listar eventos',
    });
  }
}

async function createNewEvent(req, res) {
  try {
    const event = await createEvent(req.body);

    if (global.io) {
      global.io.emit('event:created', event);
    }

    return res.status(201).json({
      ok: true,
      message: 'Evento creado correctamente',
      data: event,
    });
  } catch (error) {
    console.error('❌ createEvent error', error);
    return res.status(400).json({
      ok: false,
      message: error.message || 'Error al crear evento',
    });
  }
}

async function updateExistingEvent(req, res) {
  try {
    const event = await updateEvent(req.params.id, req.body);

    if (global.io) {
      global.io.emit('event:updated', event);
    }

    return res.json({
      ok: true,
      message: 'Evento actualizado correctamente',
      data: event,
    });
  } catch (error) {
    console.error('❌ updateEvent error', error);

    const statusCode =
      error.message === 'Evento no encontrado' ? 404 : 400;

    return res.status(statusCode).json({
      ok: false,
      message: error.message || 'Error al actualizar evento',
    });
  }
}

async function deleteExistingEvent(req, res) {
  try {
    await deleteEvent(req.params.id);

    if (global.io) {
      global.io.emit('event:deleted', {
        id: req.params.id,
      });
    }

    return res.json({
      ok: true,
      message: 'Evento eliminado correctamente',
    });
  } catch (error) {
    console.error('❌ deleteEvent error', error);

    const statusCode =
      error.message === 'Evento no encontrado' ? 404 : 400;

    return res.status(statusCode).json({
      ok: false,
      message: error.message || 'Error al eliminar evento',
    });
  }
}

module.exports = {
  listEvents,
  createNewEvent,
  updateExistingEvent,
  deleteExistingEvent,
};