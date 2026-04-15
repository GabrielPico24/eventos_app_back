const {
  getEvents,
  getMyEvents,
  createEvent,
  updateEvent,
  toggleEventStatus,
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
    return res.status(500).json({
      ok: false,
      message: error.message || 'Error al listar eventos',
    });
  }
}

async function listMyEvents(req, res) {
  try {
    const events = await getMyEvents(req.user.id);

    return res.json({
      ok: true,
      data: events,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Error al listar mis eventos',
    });
  }
}

async function createNewEvent(req, res) {
  try {
    const event = await createEvent(req.body, req.user);

    const io = req.app.get('io') || global.io;
    if (io) {
      io.emit('event:created', event);
    }

    return res.status(201).json({
      ok: true,
      message: 'Evento creado correctamente',
      data: event,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: error.message || 'Error al crear evento',
    });
  }
}

async function updateExistingEvent(req, res) {
  try {
    const event = await updateEvent(req.params.id, req.body, req.user);

    const io = req.app.get('io') || global.io;
    if (io) {
      io.emit('event:updated', event);
    }

    return res.json({
      ok: true,
      message: 'Evento actualizado correctamente',
      data: event,
    });
  } catch (error) {
    let statusCode = 400;
    if (error.message === 'Evento no encontrado') statusCode = 404;
    if (error.message.includes('No tienes permisos')) statusCode = 403;

    return res.status(statusCode).json({
      ok: false,
      message: error.message || 'Error al actualizar evento',
    });
  }
}

async function toggleExistingEventStatus(req, res) {
  try {
    const event = await toggleEventStatus(
      req.params.id,
      req.body.isActive,
      req.user
    );

    const io = req.app.get('io') || global.io;
    if (io) {
      io.emit('event:updated', event);
    }

    return res.json({
      ok: true,
      message: 'Estado del evento actualizado correctamente',
      data: event,
    });
  } catch (error) {
    let statusCode = 400;
    if (error.message === 'Evento no encontrado') statusCode = 404;
    if (error.message.includes('No tienes permisos')) statusCode = 403;

    return res.status(statusCode).json({
      ok: false,
      message: error.message || 'Error al cambiar estado del evento',
    });
  }
}

async function removeEvent(req, res) {
  try {
    await deleteEvent(req.params.id, req.user);

    const io = req.app.get('io') || global.io;
    if (io) {
      io.emit('event:deleted', { id: req.params.id });
    }

    return res.json({
      ok: true,
      message: 'Evento eliminado correctamente',
    });
  } catch (error) {
    let statusCode = 400;
    if (error.message === 'Evento no encontrado') statusCode = 404;
    if (error.message.includes('No tienes permisos')) statusCode = 403;

    return res.status(statusCode).json({
      ok: false,
      message: error.message || 'Error al eliminar evento',
    });
  }
}

module.exports = {
  listEvents,
  listMyEvents,
  createNewEvent,
  updateExistingEvent,
  toggleExistingEventStatus,
  removeEvent,
};