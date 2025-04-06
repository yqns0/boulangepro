const express = require('express');
const {
  getIngredients,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient
} = require('../controllers/ingredients');

const router = express.Router();

const { protect } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getIngredients)
  .post(protect, createIngredient);

router
  .route('/:id')
  .get(protect, getIngredient)
  .put(protect, updateIngredient)
  .delete(protect, deleteIngredient);

module.exports = router;