const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const path = require('path');

// Charger les variables d'environnement
dotenv.config();

// Variable globale pour suivre l'état de la connexion à la base de données
global.dbConnected = false;

// Connecter à la base de données
console.log('Tentative de connexion à la base de données...');
connectDB()
  .then(connection => {
    if (connection) {
      global.dbConnected = true;
      console.log('Base de données connectée et prête');
    } else {
      console.log('Application en mode dégradé - certaines fonctionnalités seront limitées');
    }
  })
  .catch(err => {
    console.error('Erreur lors de l\'initialisation de la connexion à la base de données:', err);
    console.log('Application en mode dégradé - certaines fonctionnalités seront limitées');
  });

// Initialiser l'application Express
const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));

// Configuration CORS spécifique pour Netlify et environnement local
app.use(cors({
  origin: ['https://boulangepro.netlify.app', 'http://localhost:3000', 'http://127.0.0.1:5500'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware pour ajouter manuellement les en-têtes CORS (solution de secours)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://boulangepro.netlify.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Route de test pour vérifier que l'API est accessible
app.get('/api/test', (req, res) => {
  // Obtenir l'adresse IP du serveur
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  const ips = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Ignorer les adresses de loopback et non IPv4
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }

  res.json({
    success: true,
    message: 'API accessible',
    timestamp: new Date().toISOString(),
    server_ip: ips,
    client_ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/ingredients', require('./routes/ingredients'));
app.use('/api/ai', require('./routes/ai'));

// Servir les fichiers statiques (toujours, pas seulement en production)
app.use(express.static(path.join(__dirname, '../')));

// Route pour toutes les autres requêtes - renvoyer index.html
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../', 'index.html'));
});

// Middleware de gestion des erreurs
app.use(errorHandler);

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

// Gérer les erreurs non gérées
process.on('unhandledRejection', (err, promise) => {
  console.log(`Erreur: ${err.message}`);
  // Fermer le serveur et quitter le processus
  server.close(() => process.exit(1));
});