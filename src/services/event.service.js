const mongoose = require('mongoose');
const Event = require('../models/event.model');
const Category = require('../models/category.model');

const getEvents = async () => {
  return await Event.find()
    .populate('category')
    .sort({ createdAt: -1 });
};

const createEvent = async (payload) => {
  const title = payload.title?.trim();
  const description = payload.description?.trim();
  const date = payload.date?.trim();
  const time = payload.time?.trim();
  const categoryId = payload.category;

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

  if (!date) {
    throw new Error('La fecha del evento es obligatoria');
  }

  if (!time) {
    throw new Error('La hora del evento es obligatoria');
  }

  const event = await Event.create({
    title,
    category: categoryId,
    description,
    date,
    time,
    isActive: payload.isActive ?? true,
  });

  return await Event.findById(event._id).populate('category');
};

const updateEvent = async (id, payload) => {
  const event = await Event.findById(id);

  if (!event) {
    throw new Error('Evento no encontrado');
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
  }

  if (payload.description != null) {
    const description = payload.description.trim();
    if (!description) {
      throw new Error('La descripción del evento es obligatoria');
    }
    event.description = description;
  }

  if (payload.date != null) {
    const date = payload.date.trim();
    if (!date) {
      throw new Error('La fecha del evento es obligatoria');
    }
    event.date = date;
  }

  if (payload.time != null) {
    const time = payload.time.trim();
    if (!time) {
      throw new Error('La hora del evento es obligatoria');
    }
    event.time = time;
  }

  if (payload.isActive != null) {
    event.isActive = payload.isActive;
  }

  await event.save();

  return await Event.findById(event._id).populate('category');
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