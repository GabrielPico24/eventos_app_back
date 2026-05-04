const User = require('../models/user.model');
const { sendPushToUserTokens } = require('../utils/push.util');

const {
  getEvents,
  getMyEvents,
  createEvent,
  updateEvent,
  toggleEventStatus,
  deleteEvent,
} = require('../services/event.service');

const { emitDashboardStats } = require('../services/dashboard.service');

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

async function markInvalidTokens({ userId, invalidTokens = [] }) {
  if (!userId || invalidTokens.length === 0) return;

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        'fcmTokens.$[tokenItem].isActive': false,
      },
    },
    {
      arrayFilters: [
        {
          'tokenItem.token': {
            $in: invalidTokens,
          },
        },
      ],
    }
  );
}

/*
  Envía push únicamente a los usuarios asignados al evento.
*/
async function notifyAssignedUsersAboutEventAction({
  event,
  title,
  body,
  action,
}) {
  try {
    const assignedIds = (event.assignedUsers || [])
      .map((item) => item.user?.toString())
      .filter(Boolean);

    const uniqueAssignedIds = [...new Set(assignedIds)];

    if (uniqueAssignedIds.length === 0) {
      console.log('⚠️ Evento sin usuarios asignados, no se envía push');
      return;
    }

    const users = await User.find({
      _id: { $in: uniqueAssignedIds },
      role: 'user',
      isActive: true,
      'fcmTokens.isActive': true,
    });

    if (!users || users.length === 0) {
      console.log('⚠️ No hay usuarios asignados con token FCM activo');
      return;
    }

    for (const user of users) {
      const result = await sendPushToUserTokens({
        user,
        title,
        body,
        data: {
          type: 'event',
          eventId: event?._id?.toString() || '',
          action,
        },
      });

      if (result?.invalidTokens?.length > 0) {
        await markInvalidTokens({
          userId: user._id,
          invalidTokens: result.invalidTokens,
        });
      }
    }
  } catch (error) {
    console.error('❌ notifyAssignedUsersAboutEventAction error:', error);
  }
}

/*
  Notifica al creador solo cuando corresponde.
  No se usa para creación hecha por admin, porque ahí el creador es el admin.
*/
async function notifyEventOwnerAboutAction({
  event,
  title,
  body,
  action,
}) {
  try {
    if (!event?.createdBy) {
      console.log('⚠️ Evento sin createdBy, no se puede notificar al creador');
      return;
    }

    const owner = await User.findById(event.createdBy);

    if (!owner) {
      console.log('⚠️ Usuario creador no encontrado');
      return;
    }

    if (!owner.isActive) {
      console.log('⚠️ Usuario creador inactivo, no se envía push');
      return;
    }

    if (owner.role === 'admin') {
      console.log('ℹ️ El creador es admin, no se notifica como usuario final');
      return;
    }

    const result = await sendPushToUserTokens({
      user: owner,
      title,
      body,
      data: {
        type: 'event',
        eventId: event?._id?.toString() || '',
        action,
      },
    });

    if (result?.invalidTokens?.length > 0) {
      await markInvalidTokens({
        userId: owner._id,
        invalidTokens: result.invalidTokens,
      });
    }
  } catch (error) {
    console.error('❌ notifyEventOwnerAboutAction error:', error);
  }
}


function getAssignedUserIdsFromEvent(event) {
  return [
    ...new Set(
      (event.assignedUsers || [])
        .map((item) => item.user?.toString())
        .filter(Boolean)
    ),
  ];
}

function getCreatedByIdFromEvent(event) {
  if (!event?.createdBy) return '';

  if (typeof event.createdBy === 'object') {
    return event.createdBy._id?.toString() || event.createdBy.id?.toString() || '';
  }

  return event.createdBy.toString();
}

function emitEventToAllowedUsers(io, socketEventName, event) {
  if (!io || !event) return;

  const eventId = event._id?.toString() || event.id?.toString() || '';
  const assignedUserIds = getAssignedUserIdsFromEvent(event);
  const createdById = getCreatedByIdFromEvent(event);

  const targetUserIds = [...new Set([...assignedUserIds, createdById].filter(Boolean))];

  io.to('admins').emit(socketEventName, event);
  console.log(`📡 Emitido ${socketEventName} a admins`, eventId);

  for (const userId of targetUserIds) {
    io.to(`user:${userId}`).emit(socketEventName, event);
    console.log(`📡 Emitido ${socketEventName} a user:${userId}`, eventId);
  }
}

function emitEventDeletedToAllowedUsers(io, deletedEvent, deletedId) {
  if (!io || !deletedEvent || !deletedId) return;

  const assignedUserIds = getAssignedUserIdsFromEvent(deletedEvent);
  const createdById = getCreatedByIdFromEvent(deletedEvent);

  const targetUserIds = [...new Set([...assignedUserIds, createdById].filter(Boolean))];

  io.to('admins').emit('event:deleted', { id: deletedId });
  console.log('📡 Emitido event:deleted a admins', deletedId);

  for (const userId of targetUserIds) {
    io.to(`user:${userId}`).emit('event:deleted', { id: deletedId });
    console.log(`📡 Emitido event:deleted a user:${userId}`, deletedId);
  }
}


async function createNewEvent(req, res) {
  try {
    const event = await createEvent(req.body, req.user);

    const io = req.app.get('io') || global.io;
    if (io) {
      emitEventToAllowedUsers(io, 'event:created', event);

      await emitDashboardStats(io);
      console.log('📊 Emitido dashboard:stats-updated');
    }

    await notifyAssignedUsersAboutEventAction({
      event,
      title: 'Nuevo evento asignado',
      body: `Te asignaron el evento: ${event.title}`,
      action: 'created',
    });

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
      emitEventToAllowedUsers(io, 'event:updated', event);

      await emitDashboardStats(io);
      console.log('📊 Emitido dashboard:stats-updated');
    }

    await notifyAssignedUsersAboutEventAction({
      event,
      title: 'Evento actualizado',
      body: `Se actualizó el evento: ${event.title}`,
      action: 'updated',
    });

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
      emitEventToAllowedUsers(io, 'event:updated', event);

      await emitDashboardStats(io);
      console.log('📊 Emitido dashboard:stats-updated');
    }

    const estadoTexto = event.isActive ? 'activado' : 'inactivado';

    await notifyAssignedUsersAboutEventAction({
      event,
      title: `Evento ${estadoTexto}`,
      body: `El evento "${event.title}" fue ${estadoTexto}`,
      action: 'status_changed',
    });

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
    const deletedEvent = await deleteEvent(req.params.id, req.user);

    const io = req.app.get('io') || global.io;
    if (io) {
      emitEventDeletedToAllowedUsers(io, deletedEvent, req.params.id);

      await emitDashboardStats(io);
      console.log('📊 Emitido dashboard:stats-updated');
    }

    await notifyAssignedUsersAboutEventAction({
      event: deletedEvent,
      title: 'Evento eliminado',
      body: `El evento "${deletedEvent.title}" fue eliminado`,
      action: 'deleted',
    });

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