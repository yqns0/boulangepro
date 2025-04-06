const Recipe = require('../models/Recipe');

// @desc    Obtenir toutes les recettes
// @route   GET /api/recipes
// @access  Private
exports.getRecipes = async (req, res, next) => {
  try {
    const recipes = await Recipe.find({ user: req.user.id });

    res.status(200).json({
      success: true,
      count: recipes.length,
      data: recipes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtenir une recette
// @route   GET /api/recipes/:id
// @access  Private
exports.getRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: 'Recette non trouvée'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (recipe.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Non autorisé à accéder à cette recette'
      });
    }

    res.status(200).json({
      success: true,
      data: recipe
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Créer une recette
// @route   POST /api/recipes
// @access  Private
exports.createRecipe = async (req, res, next) => {
  try {
    // Ajouter l'utilisateur à la requête
    req.body.user = req.user.id;

    const recipe = await Recipe.create(req.body);

    res.status(201).json({
      success: true,
      data: recipe
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mettre à jour une recette
// @route   PUT /api/recipes/:id
// @access  Private
exports.updateRecipe = async (req, res, next) => {
  try {
    let recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: 'Recette non trouvée'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (recipe.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Non autorisé à mettre à jour cette recette'
      });
    }

    recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: recipe
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Supprimer une recette
// @route   DELETE /api/recipes/:id
// @access  Private
exports.deleteRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: 'Recette non trouvée'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (recipe.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Non autorisé à supprimer cette recette'
      });
    }

    await recipe.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};