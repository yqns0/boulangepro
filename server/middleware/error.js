const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log pour le développeur
  console.log(err);

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

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Erreur serveur'
  });
};

module.exports = errorHandler;