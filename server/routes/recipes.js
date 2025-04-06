const express = require('express');
const {
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe
} = require('../controllers/recipes');

const router = express.Router();

const { protect } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getRecipes)
  .post(protect, createRecipe);

router
  .route('/:id')
  .get(protect, getRecipe)
  .put(protect, updateRecipe)
  .delete(protect, deleteRecipe);

module.exports = router;