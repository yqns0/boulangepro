const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Supprimer les avertissements de dépréciation
    mongoose.set('strictQuery', true);

    // Afficher l'URI de connexion (masqué pour la sécurité)
    const maskedURI = process.env.MONGO_URI
      ? process.env.MONGO_URI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://****:****@')
      : 'Non défini';
    console.log(`Tentative de connexion à MongoDB avec URI: ${maskedURI}`);

    // Ajouter un délai de connexion plus long et des options de reconnexion
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000, // Augmenter le délai d'attente à 15 secondes
      socketTimeoutMS: 45000, // Augmenter le délai d'attente du socket à 45 secondes
      connectTimeoutMS: 30000, // Augmenter le délai de connexion à 30 secondes
      retryWrites: true,
      w: 'majority'
    });

    console.log(`MongoDB connecté avec succès: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Erreur de connexion à MongoDB: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);

    // Ne pas quitter le processus en cas d'erreur de connexion
    // Cela permet à l'application de fonctionner en mode dégradé
    console.log('Application démarrée en mode dégradé (sans base de données)');
    return null;
  }
};

module.exports = connectDB;