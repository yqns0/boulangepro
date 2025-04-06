const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Veuillez ajouter un nom de recette'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  category: {
    type: String,
    required: [true, 'Veuillez sélectionner une catégorie'],
    enum: ['patisserie', 'boulangerie', 'viennoiserie', 'snacking']
  },
  yield: {
    quantity: {
      type: Number,
      required: [true, 'Veuillez spécifier le rendement']
    },
    unit: {
      type: String,
      required: [true, 'Veuillez spécifier l\'unité de rendement'],
      enum: ['pieces', 'g', 'kg']
    }
  },
  time: {
    type: Number,
    required: [true, 'Veuillez spécifier le temps de préparation']
  },
  ingredients: [
    {
      id: {
        type: mongoose.Schema.ObjectId,
        ref: 'Ingredient',
        required: true
      },
      name: String,
      quantity: Number,
      unit: String,
      price: Number,
      pricePerUnit: Number,
      cost: Number
    }
  ],
  instructions: {
    type: String,
    required: [true, 'Veuillez ajouter des instructions']
  },
  notes: {
    type: String
  },
  totalCost: {
    type: Number,
    required: true
  },
  costPerPiece: {
    type: Number,
    required: true
  },
  totalWeight: {
    type: Number,
    required: true
  },
  image: {
    type: String
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Recipe', RecipeSchema);