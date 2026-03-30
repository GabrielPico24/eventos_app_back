const Category = require('../models/category.model');

const getCategories = async () => {
  return await Category.find().sort({ createdAt: -1 });
};

const getCategoryById = async (id) => {
  const category = await Category.findById(id);

  if (!category) {
    throw new Error('Categoría no encontrada');
  }

  return category;
};

const createCategory = async (payload) => {
  const name = payload.name?.trim();

  if (!name) {
    throw new Error('El nombre de la categoría es obligatorio');
  }

  const exists = await Category.findOne({
    name: { $regex: new RegExp(`^${name}$`, 'i') },
  });

  if (exists) {
    throw new Error('Ya existe una categoría con ese nombre');
  }

  return await Category.create({
    name,
    description: payload.description?.trim() || '',
    isActive: payload.isActive ?? true,
  });
};

const updateCategory = async (id, payload) => {
  const category = await Category.findById(id);

  if (!category) {
    throw new Error('Categoría no encontrada');
  }

  if (payload.name) {
    const name = payload.name.trim();

    const exists = await Category.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });

    if (exists) {
      throw new Error('Ya existe una categoría con ese nombre');
    }

    category.name = name;
  }

  if (payload.description !== undefined) {
    category.description = payload.description.trim();
  }

  if (payload.isActive !== undefined) {
    category.isActive = payload.isActive;
  }

  await category.save();
  return category;
};

const deleteCategory = async (id) => {
  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    throw new Error('Categoría no encontrada');
  }

  return true;
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};