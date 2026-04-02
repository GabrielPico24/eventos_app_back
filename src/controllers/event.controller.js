const {
  getEvents,
  getMyEvents,
  createEvent,
  updateEvent,
  toggleEventStatus,
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

async function listMyEvents(req, res) {
  try {
    console.log('📥 HTTP GET /api/events/my-events -> listMyEvents');
    console.log('👤 Usuario:', req.user?.id);

    const events = await getMyEvents(req.user.id);

    console.log('✅ Mis eventos obtenidos:', events.length);

    return res.json({
      ok: true,
      data: events,
    });
  } catch (error) {
    console.error('❌ getMyEvents error', error);
    return res.status(500).json({
      ok: false,
      message: error.message || 'Error al listar mis eventos',
    });
  }
}

async function createNewEvent(req, res) {
  try {
    console.log('📥 HTTP POST /api/events -> createNewEvent');
    console.log('📦 Body recibido:', req.body);

    const event = await createEvent(req.body, req.user);

    console.log('✅ Evento creado en DB:', event._id?.toString());

    if (global.io) {
      console.log('📡 SOCKET EMIT -> event:created', event._id?.toString());
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
    console.log('📥 HTTP PUT /api/events/:id -> updateExistingEvent');
    console.log('🆔 ID recibido:', req.params.id);
    console.log('📦 Body recibido:', req.body);

    const event = await updateEvent(req.params.id, req.body, req.user);

    console.log('✅ Evento actualizado en DB:', event._id?.toString());

    if (global.io) {
      console.log('📡 SOCKET EMIT -> event:updated', event._id?.toString());
      global.io.emit('event:updated', event);
    }

    return res.json({
      ok: true,
      message: 'Evento actualizado correctamente',
      data: event,
    });
  } catch (error) {
    console.error('❌ updateEvent error', error);

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
    console.log('📥 HTTP PATCH /api/events/:id/status -> toggleExistingEventStatus');
    console.log('🆔 ID recibido:', req.params.id);
    console.log('📦 Body recibido:', req.body);

    const event = await toggleEventStatus(
      req.params.id,
      req.body.isActive,
      req.user,
    );

    console.log('✅ Estado del evento actualizado:', event._id?.toString());

    if (global.io) {
      console.log('📡 SOCKET EMIT -> event:updated', event._id?.toString());
      global.io.emit('event:updated', event);
    }

    return res.json({
      ok: true,
      message: 'Estado del evento actualizado correctamente',
      data: event,
    });
  } catch (error) {
    console.error('❌ toggleEventStatus error', error);

    let statusCode = 400;
    if (error.message === 'Evento no encontrado') statusCode = 404;
    if (error.message.includes('No tienes permisos')) statusCode = 403;

    return res.status(statusCode).json({
      ok: false,
      message: error.message || 'Error al cambiar estado del evento',
    });
  }
}

module.exports = {
  listEvents,
  listMyEvents,
  createNewEvent,
  updateExistingEvent,
  toggleExistingEventStatus,
};