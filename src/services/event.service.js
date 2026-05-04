const Event = require('../models/event.model');
const User = require('../models/user.model');
const Category = require('../models/category.model');

const {
  emitDashboardStats,
} = require('./dashboard.service');

const VALID_REPEAT_VALUES = [
  'never',
  'hourly',
  'daily',
  'weekdays',
  'weekends',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'semiannual',
  'yearly',
];

const parseDateDDMMYYYY = (value) => {
  if (!value || typeof value !== 'string') return null;

  const parts = value.trim().split('/');
  if (parts.length !== 3) return null;

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);

  if (!day || !month || !year) return null;

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const normalizeRepeatEndDate = ({ repeat, repeatEndDate, eventDate }) => {
  if (!VALID_REPEAT_VALUES.includes(repeat)) {
    throw new Error('La opción de repetición seleccionada no es válida');
  }

  if (repeat === 'never') {
    return '';
  }

  if (!repeatEndDate || repeatEndDate.trim() === '') {
    throw new Error('Debes seleccionar la fecha para terminar la repetición');
  }

  const start = parseDateDDMMYYYY(eventDate);
  const end = parseDateDDMMYYYY(repeatEndDate);

  if (!start) {
    throw new Error('La fecha del evento no tiene un formato válido');
  }

  if (!end) {
    throw new Error('La fecha de terminar repetición no tiene un formato válido');
  }

  if (end < start) {
    throw new Error(
      'La fecha de terminar repetición no puede ser menor a la fecha del evento'
    );
  }

  return repeatEndDate.trim();
};

const buildAssignedUsers = async (assignedUsersIds = []) => {
  if (!Array.isArray(assignedUsersIds) || assignedUsersIds.length === 0) {
    return [];
  }

  const users = await User.find({
    _id: { $in: assignedUsersIds },
    role: 'user',
    isActive: true,
  }).select('_id name email role isActive');

  if (users.length !== assignedUsersIds.length) {
    throw new Error(
      'Uno o varios usuarios asignados no existen, no son usuarios normales o están inactivos'
    );
  }

  return users.map((user) => ({
    user: user._id,
    name: user.name,
    email: user.email,
  }));
};

const emitDashboardSafe = async () => {
  try {
    if (global.io) {
      await emitDashboardStats(global.io);
    } else {
      console.log('⚠️ global.io no disponible para actualizar dashboard');
    }
  } catch (error) {
    console.error('❌ Error emitiendo actualización del dashboard:', error);
  }
};

const getEvents = async () => {
  return await Event.find()
    .populate('category')
    .populate('createdBy', '_id name email role')
    .sort({ createdAt: -1 });
};

const getMyEvents = async (userId) => {
  return await Event.find({
    $or: [
      { createdBy: userId },
      { 'assignedUsers.user': userId },
    ],
  })
    .populate('category')
    .populate('createdBy', '_id name email role')
    .sort({ createdAt: -1 });
};

const createEvent = async (data, currentUser) => {
  const {
    title,
    description = '',
    category,
    categoryName,
    date,
    time,
    repeat = 'never',
    repeatEndDate = '',
    isActive = true,
    status = 'upcoming',
    // Se ignoran desde el body porque la app solo debe notificar en la hora exacta
    notify24hBefore: _notify24hBefore = false,
    notify1hBefore: _notify1hBefore = false,
    notifyAtTime: _notifyAtTime = true,
    assignedUsers = [],
  } = data;

  if (!title || !category || !categoryName || !date || !time) {
    throw new Error('Faltan campos obligatorios del evento');
  }

  const categoryExists = await Category.findById(category);

  if (!categoryExists) {
    throw new Error('La categoría seleccionada no existe');
  }

  const normalizedRepeatEndDate = normalizeRepeatEndDate({
    repeat,
    repeatEndDate,
    eventDate: date,
  });

  let assignedUsersBuilt = [];

  if (currentUser.role === 'admin') {
    if (!Array.isArray(assignedUsers) || assignedUsers.length === 0) {
      throw new Error(
        'El administrador debe asignar el evento a uno o varios usuarios'
      );
    }

    assignedUsersBuilt = await buildAssignedUsers(assignedUsers);
  }

  const event = await Event.create({
    title: title.trim(),
    description: description.trim(),
    category,
    categoryName: categoryName.trim(),
    date: date.trim(),
    time: time.trim(),
    repeat,
    repeatEndDate: normalizedRepeatEndDate,
    isActive,
    status,
    createdBy: currentUser.id,
    createdByName: currentUser.name,
    assignedUsers: assignedUsersBuilt,
    notify24hBefore: false,
    notify1hBefore: false,
    notifyAtTime: true,
  });

  const populatedEvent = await Event.findById(event._id)
    .populate('category')
    .populate('createdBy', '_id name email role');

  await emitDashboardSafe();

  return populatedEvent;
};

const updateEvent = async (eventId, data, currentUser) => {
  const event = await Event.findById(eventId);

  if (!event) {
    throw new Error('Evento no encontrado');
  }

  const isAdmin = currentUser.role === 'admin';
  const isOwner = event.createdBy.toString() === currentUser.id;

  if (!isAdmin && !isOwner) {
    throw new Error('No tienes permisos para editar este evento');
  }

  const {
    title,
    description = '',
    category,
    categoryName,
    date,
    time,
    repeat = 'never',
    repeatEndDate = '',
    isActive = true,
    status = 'upcoming',
    // Se ignoran desde el body porque la app solo debe notificar en la hora exacta
    notify24hBefore: _notify24hBefore = false,
    notify1hBefore: _notify1hBefore = false,
    notifyAtTime: _notifyAtTime = true,
    assignedUsers,
  } = data;

  if (!title || !category || !categoryName || !date || !time) {
    throw new Error('Faltan campos obligatorios del evento');
  }

  const categoryExists = await Category.findById(category);

  if (!categoryExists) {
    throw new Error('La categoría seleccionada no existe');
  }

  const normalizedRepeatEndDate = normalizeRepeatEndDate({
    repeat,
    repeatEndDate,
    eventDate: date,
  });

  let assignedUsersBuilt = event.assignedUsers;

  if (isAdmin) {
    if (!Array.isArray(assignedUsers) || assignedUsers.length === 0) {
      throw new Error(
        'El administrador debe asignar el evento a uno o varios usuarios'
      );
    }

    assignedUsersBuilt = await buildAssignedUsers(assignedUsers);
  }

  event.title = title.trim();
  event.description = description.trim();
  event.category = category;
  event.categoryName = categoryName.trim();
  event.date = date.trim();
  event.time = time.trim();
  event.repeat = repeat;
  event.repeatEndDate = normalizedRepeatEndDate;
  event.isActive = isActive;
  event.status = status;
  event.notify24hBefore = false;
  event.notify1hBefore = false;
  event.notifyAtTime = true;
  event.assignedUsers = assignedUsersBuilt;

  await event.save();

  const populatedEvent = await Event.findById(event._id)
    .populate('category')
    .populate('createdBy', '_id name email role');

  await emitDashboardSafe();

  return populatedEvent;
};

const toggleEventStatus = async (eventId, isActive, currentUser) => {
  const event = await Event.findById(eventId);

  if (!event) {
    throw new Error('Evento no encontrado');
  }

  const isAdmin = currentUser.role === 'admin';
  const isOwner = event.createdBy.toString() === currentUser.id;

  if (!isAdmin && !isOwner) {
    throw new Error('No tienes permisos para cambiar el estado de este evento');
  }

  event.isActive = isActive;

  await event.save();

  const populatedEvent = await Event.findById(event._id)
    .populate('category')
    .populate('createdBy', '_id name email role');

  await emitDashboardSafe();

  return populatedEvent;
};

const deleteEvent = async (eventId, currentUser) => {
  const event = await Event.findById(eventId);

  if (!event) {
    throw new Error('Evento no encontrado');
  }

  const isAdmin = currentUser.role === 'admin';
  const isOwner = event.createdBy.toString() === currentUser.id;

  if (!isAdmin && !isOwner) {
    throw new Error('No tienes permisos para eliminar este evento');
  }

  await Event.findByIdAndDelete(eventId);

  await emitDashboardSafe();

  return event;
};

module.exports = {
  getEvents,
  getMyEvents,
  createEvent,
  updateEvent,
  toggleEventStatus,
  deleteEvent,
};