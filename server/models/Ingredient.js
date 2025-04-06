const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Veuillez ajouter un nom d\'ingrédient'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  category: {
    type: String,
    required: [true, 'Veuillez sélectionner une catégorie'],
    enum: ['farine', 'sucre', 'produit-laitier', 'fruit', 'chocolat', 'autre']
  },
  price: {
    type: Number,
    required: [true, 'Veuillez spécifier le prix']
  },
  unit: {
    type: String,
    required: [true, 'Veuillez spécifier l\'unité'],
    enum: ['g', 'kg', 'ml', 'l', 'pcs']
  },
  stock: {
    type: Number,
    default: 0
  },
  notes: {
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

module.exports = mongoose.model('Ingredient', IngredientSchema);