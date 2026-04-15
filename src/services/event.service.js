const Event = require('../models/event.model');
const User = require('../models/user.model');
const Category = require('../models/category.model');

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
    isActive = true,
    status = 'upcoming',
    notify24hBefore = true,
    notify1hBefore = true,
    notifyAtTime = true,
    assignedUsers = [],
  } = data;

  if (!title || !category || !categoryName || !date || !time) {
    throw new Error('Faltan campos obligatorios del evento');
  }

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw new Error('La categoría seleccionada no existe');
  }

  let assignedUsersBuilt = [];

  if (currentUser.role === 'admin') {
    if (!Array.isArray(assignedUsers) || assignedUsers.length === 0) {
      throw new Error('El administrador debe asignar el evento a uno o varios usuarios');
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
    isActive,
    status,
    createdBy: currentUser.id,
    createdByName: currentUser.name,
    assignedUsers: assignedUsersBuilt,
    notify24hBefore,
    notify1hBefore,
    notifyAtTime,
  });

  return await Event.findById(event._id)
    .populate('category')
    .populate('createdBy', '_id name email role');
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
    isActive = true,
    status = 'upcoming',
    notify24hBefore = true,
    notify1hBefore = true,
    notifyAtTime = true,
    assignedUsers,
  } = data;

  if (!title || !category || !categoryName || !date || !time) {
    throw new Error('Faltan campos obligatorios del evento');
  }

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw new Error('La categoría seleccionada no existe');
  }

  let assignedUsersBuilt = event.assignedUsers;

  if (isAdmin) {
    if (!Array.isArray(assignedUsers) || assignedUsers.length === 0) {
      throw new Error('El administrador debe asignar el evento a uno o varios usuarios');
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
  event.isActive = isActive;
  event.status = status;
  event.notify24hBefore = notify24hBefore;
  event.notify1hBefore = notify1hBefore;
  event.notifyAtTime = notifyAtTime;
  event.assignedUsers = assignedUsersBuilt;

  await event.save();

  return await Event.findById(event._id)
    .populate('category')
    .populate('createdBy', '_id name email role');
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

  return await Event.findById(event._id)
    .populate('category')
    .populate('createdBy', '_id name email role');
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