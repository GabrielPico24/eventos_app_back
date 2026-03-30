const express = require('express');
const {
  listCategories,
  getSingleCategory,
  createNewCategory,
  editCategory,
  removeCategory,
} = require('../controllers/category.controller');
const { authMiddleware, adminOnly } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, listCategories);
router.get('/:id', authMiddleware, getSingleCategory);
router.post('/', authMiddleware, adminOnly, createNewCategory);
router.put('/:id', authMiddleware, adminOnly, editCategory);
router.delete('/:id', authMiddleware, adminOnly, removeCategory);

module.exports = router;