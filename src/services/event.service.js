const mongoose = require('mongoose');
const Event = require('../models/event.model');
const Category = require('../models/category.model');

const getEvents = async () => {
  return await Event.find()
    .populate('category')
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 });
};

const getMyEvents = async (userId) => {
  return await Event.find({ createdBy: userId })
    .populate('category')
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 });
};

const createEvent = async (payload, user) => {
  const title = payload.title?.trim();
  const description = payload.description?.trim();
  const startDate = payload.startDate?.trim();
  const endDate = payload.endDate?.trim();
  const startTime = payload.startTime?.trim();
  const endTime = payload.endTime?.trim();
  const location = payload.location?.trim() || '';
  const categoryId = payload.category;
  const categoryName = payload.categoryName?.trim();

  if (!title) {
    throw new Error('El título del evento es obligatorio');
  }

  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new Error('La categoría del evento no es válida');
  }

  const categoryExists = await Category.findById(categoryId);
  if (!categoryExists) {
    throw new Error('La categoría seleccionada no existe');
  }

  if (!description) {
    throw new Error('La descripción del evento es obligatoria');
  }

  if (!startDate) {
    throw new Error('La fecha de inicio es obligatoria');
  }

  if (!endDate) {
    throw new Error('La fecha de fin es obligatoria');
  }

  if (!startTime) {
    throw new Error('La hora de inicio es obligatoria');
  }

  if (!endTime) {
    throw new Error('La hora de fin es obligatoria');
  }

  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const event = await Event.create({
    title,
    category: categoryId,
    categoryName: categoryName || categoryExists.name,
    description,
    startDate,
    endDate,
    startTime,
    endTime,
    location,
    isActive: payload.isActive ?? true,
    status: payload.status ?? 'upcoming',
    createdBy: user.id,
    createdByName: user.name || '',
    notify24hBefore: payload.notify24hBefore ?? true,
    notify1hBefore: payload.notify1hBefore ?? true,
    notifyAtTime: payload.notifyAtTime ?? true,
  });

  return await Event.findById(event._id)
    .populate('category')
    .populate('createdBy', 'name email role');
};

const updateEvent = async (id, payload, user) => {
  const event = await Event.findById(id);

  if (!event) {
    throw new Error('Evento no encontrado');
  }

  const isAdmin = user?.role === 'admin';
  const isOwner = event.createdBy.toString() === user?.id;

  if (!isAdmin && !isOwner) {
    throw new Error('No tienes permisos para editar este evento');
  }

  if (payload.title != null) {
    const title = payload.title.trim();
    if (!title) {
      throw new Error('El título del evento es obligatorio');
    }
    event.title = title;
  }

  if (payload.category != null) {
    if (!mongoose.Types.ObjectId.isValid(payload.category)) {
      throw new Error('La categoría del evento no es válida');
    }

    const categoryExists = await Category.findById(payload.category);
    if (!categoryExists) {
      throw new Error('La categoría seleccionada no existe');
    }

    event.category = payload.category;
    event.categoryName = payload.categoryName?.trim() || categoryExists.name;
  }

  if (payload.description != null) {
    const description = payload.description.trim();
    if (!description) {
      throw new Error('La descripción del evento es obligatoria');
    }
    event.description = description;
  }

  if (payload.startDate != null) {
    const startDate = payload.startDate.trim();
    if (!startDate) {
      throw new Error('La fecha de inicio es obligatoria');
    }
    event.startDate = startDate;
  }

  if (payload.endDate != null) {
    const endDate = payload.endDate.trim();
    if (!endDate) {
      throw new Error('La fecha de fin es obligatoria');
    }
    event.endDate = endDate;
  }

  if (payload.startTime != null) {
    const startTime = payload.startTime.trim();
    if (!startTime) {
      throw new Error('La hora de inicio es obligatoria');
    }
    event.startTime = startTime;
  }

  if (payload.endTime != null) {
    const endTime = payload.endTime.trim();
    if (!endTime) {
      throw new Error('La hora de fin es obligatoria');
    }
    event.endTime = endTime;
  }

  if (payload.location != null) {
    event.location = payload.location.trim();
  }

  if (payload.isActive != null) {
    event.isActive = payload.isActive;
  }

  if (payload.status != null) {
    event.status = payload.status;
  }

  if (payload.notify24hBefore != null) {
    event.notify24hBefore = payload.notify24hBefore;
  }

  if (payload.notify1hBefore != null) {
    event.notify1hBefore = payload.notify1hBefore;
  }

  if (payload.notifyAtTime != null) {
    event.notifyAtTime = payload.notifyAtTime;
  }

  await event.save();

  return await Event.findById(event._id)
    .populate('category')
    .populate('createdBy', 'name email role');
};

const toggleEventStatus = async (id, isActive, user) => {
  const event = await Event.findById(id);

  if (!event) {
    throw new Error('Evento no encontrado');
  }

  const isAdmin = user?.role === 'admin';
  const isOwner = event.createdBy.toString() === user?.id;

  if (!isAdmin && !isOwner) {
    throw new Error('No tienes permisos para cambiar el estado de este evento');
  }

  event.isActive = isActive;
  await event.save();

  return await Event.findById(event._id)
    .populate('category')
    .populate('createdBy', 'name email role');
};

module.exports = {
  getEvents,
  getMyEvents,
  createEvent,
  updateEvent,
  toggleEventStatus,
};