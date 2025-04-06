const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log détaillé pour le développeur
  console.error('ERREUR DÉTECTÉE:');
  console.error(`URL: ${req.method} ${req.originalUrl}`);
  console.error(`Corps de la requête:`, req.body);
  console.error(`Message d'erreur:`, err.message);
  console.error(`Stack trace:`, err.stack);

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new Error(message);
    error.statusCode = 400;
  }

  // Erreur de clé dupliquée
  if (err.code === 11000) {
    const message = 'Valeur dupliquée entrée';
    error = new Error(message);
    error.statusCode = 400;
  }

  // Erreur d'ID Mongoose
  if (err.name === 'CastError') {
    const message = `Ressource non trouvée`;
    error = new Error(message);
    error.statusCode = 404;
  }

  // Erreur de connexion à la base de données
  if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
    const message = 'Problème de connexion à la base de données';
    error = new Error(message);
    error.statusCode = 503;
    console.error('ERREUR DE CONNEXION À LA BASE DE DONNÉES:', err);
  }

  // Réponse JSON avec des informations détaillées en développement
  const response = {
    success: false,
    error: error.message || 'Erreur serveur',
    statusCode: error.statusCode || 500
  };

  // Ajouter des détails supplémentaires en développement
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
    response.detailedError = err.toString();
  }

  res.status(error.statusCode || 500).json(response);
};

module.exports = errorHandler;