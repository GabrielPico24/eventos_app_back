const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../services/category.service');

const listCategories = async (req, res) => {
  try {
    const categories = await getCategories();

    return res.json({
      ok: true,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
};

const getSingleCategory = async (req, res) => {
  try {
    const category = await getCategoryById(req.params.id);

    return res.json({
      ok: true,
      data: category,
    });
  } catch (error) {
    return res.status(404).json({
      ok: false,
      message: error.message,
    });
  }
};

const createNewCategory = async (req, res) => {
  try {
    const category = await createCategory(req.body);

    if (global.io) {
      global.io.emit('category:created', category);
    }

    return res.status(201).json({
      ok: true,
      message: 'Categoría creada correctamente',
      data: category,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
};

const editCategory = async (req, res) => {
  try {
    const category = await updateCategory(req.params.id, req.body);

    if (global.io) {
      global.io.emit('category:updated', category);
    }

    return res.json({
      ok: true,
      message: 'Categoría actualizada correctamente',
      data: category,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
};

const removeCategory = async (req, res) => {
  try {
    await deleteCategory(req.params.id);

    if (global.io) {
      global.io.emit('category:deleted', { id: req.params.id });
    }

    return res.json({
      ok: true,
      message: 'Categoría eliminada correctamente',
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
};

module.exports = {
  listCategories,
  getSingleCategory,
  createNewCategory,
  editCategory,
  removeCategory,
};