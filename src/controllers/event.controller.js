const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../services/event.service');

async function listEvents(req, res) {
  try {
    console.log('📥 HTTP GET /api/events -> listEvents');

    const events = await getEvents();

    console.log('✅ Eventos obtenidos:', events.length);

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
    console.log('📥 HTTP POST /api/events -> createNewEvent');
    console.log('📦 Body recibido:', req.body);

    const event = await createEvent(req.body);

    console.log('✅ Evento creado en DB:', event._id?.toString());

    if (global.io) {
      console.log('📡 SOCKET EMIT -> event:created', event._id?.toString());
      global.io.emit('event:created', event);
    } else {
      console.log('⚠️ global.io no está disponible para event:created');
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
    console.log('📥 HTTP PUT /api/events/:id -> updateExistingEvent');
    console.log('🆔 ID recibido:', req.params.id);
    console.log('📦 Body recibido:', req.body);

    const event = await updateEvent(req.params.id, req.body);

    console.log('✅ Evento actualizado en DB:', event._id?.toString());

    if (global.io) {
      console.log('📡 SOCKET EMIT -> event:updated', event._id?.toString());
      global.io.emit('event:updated', event);
    } else {
      console.log('⚠️ global.io no está disponible para event:updated');
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
    console.log('📥 HTTP DELETE /api/events/:id -> deleteExistingEvent');
    console.log('🆔 ID recibido:', req.params.id);

    await deleteEvent(req.params.id);

    console.log('✅ Evento eliminado en DB:', req.params.id);

    if (global.io) {
      console.log('📡 SOCKET EMIT -> event:deleted', req.params.id);
      global.io.emit('event:deleted', {
        id: req.params.id,
      });
    } else {
      console.log('⚠️ global.io no está disponible para event:deleted');
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