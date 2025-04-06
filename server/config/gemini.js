// Configuration de l'API Gemini
// IMPORTANT: Ne jamais exposer cette clé côté client

// Vous devez définir la variable d'environnement GEMINI_API_KEY
// Pour des raisons de sécurité, il est recommandé d'utiliser des variables d'environnement
// Ajoutez cette variable dans le fichier .env ou dans les variables d'environnement de votre hébergeur

module.exports = {
    apiKey: process.env.GEMINI_API_KEY || 'votre-cle-api-ici', // À remplacer par votre clé API dans le fichier .env
    model: 'gemini-2.0-flash', // Modèle à utiliser
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    timeout: 30000 // Timeout en millisecondes
};