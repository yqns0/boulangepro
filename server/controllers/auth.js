const User = require('../models/User');

// @desc    Inscrire un utilisateur
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Créer l'utilisateur
    const user = await User.create({
      name,
      email,
      password
    });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Connecter un utilisateur
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Valider l'email et le mot de passe
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez fournir un email et un mot de passe'
      });
    }

    // Vérifier si c'est l'utilisateur de démonstration
    if (email === 'demo@boulangeproapp.com' && password === 'password123') {
      // Créer ou récupérer l'utilisateur de démonstration
      let demoUser = await User.findOne({ email: 'demo@boulangeproapp.com' });

      if (!demoUser) {
        // Créer l'utilisateur de démonstration s'il n'existe pas
        demoUser = await User.create({
          name: 'Utilisateur Démo',
          email: 'demo@boulangeproapp.com',
          password: 'password123'
        });
      }

      return sendTokenResponse(demoUser, 200, res);
    }

    // Vérifier l'utilisateur normal
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides'
      });
    }

    // Vérifier si le mot de passe correspond
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Obtenir l'utilisateur actuel
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Déconnecter l'utilisateur / effacer le cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {}
  });
};

// Fonction utilitaire pour créer un token, créer un cookie et envoyer la réponse
const sendTokenResponse = (user, statusCode, res) => {
  // Créer un token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token
  });
};