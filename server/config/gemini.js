// Configuration de l'API Gemini
// IMPORTANT: Ne jamais exposer cette clé côté client

// Vous devez définir la variable d'environnement GEMINI_API_KEY
// ou remplacer process.env.GEMINI_API_KEY par votre clé API
// Pour des raisons de sécurité, il est recommandé d'utiliser des variables d'environnement

module.exports = {
    apiKey: process.env.GEMINI_API_KEY || 'AIzaSyCUmXDn9QhggX0IukM0z2FdDPXpmjrFafQ',
    model: 'gemini-2.0-flash', // Modèle à utiliser
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    timeout: 30000 // Timeout en millisecondes
};