const Ingredient = require('../models/Ingredient');

// @desc    Obtenir tous les ingrédients
// @route   GET /api/ingredients
// @access  Private
exports.getIngredients = async (req, res, next) => {
  try {
    const ingredients = await Ingredient.find({ user: req.user.id });

    res.status(200).json({
      success: true,
      count: ingredients.length,
      data: ingredients
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtenir un ingrédient
// @route   GET /api/ingredients/:id
// @access  Private
exports.getIngredient = async (req, res, next) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        error: 'Ingrédient non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (ingredient.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Non autorisé à accéder à cet ingrédient'
      });
    }

    res.status(200).json({
      success: true,
      data: ingredient
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Créer un ingrédient
// @route   POST /api/ingredients
// @access  Private
exports.createIngredient = async (req, res, next) => {
  try {
    // Ajouter l'utilisateur à la requête
    req.body.user = req.user.id;

    const ingredient = await Ingredient.create(req.body);

    res.status(201).json({
      success: true,
      data: ingredient
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mettre à jour un ingrédient
// @route   PUT /api/ingredients/:id
// @access  Private
exports.updateIngredient = async (req, res, next) => {
  try {
    let ingredient = await Ingredient.findById(req.params.id);

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        error: 'Ingrédient non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (ingredient.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Non autorisé à mettre à jour cet ingrédient'
      });
    }

    ingredient = await Ingredient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: ingredient
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Supprimer un ingrédient
// @route   DELETE /api/ingredients/:id
// @access  Private
exports.deleteIngredient = async (req, res, next) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        error: 'Ingrédient non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (ingredient.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Non autorisé à supprimer cet ingrédient'
      });
    }

    await ingredient.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};