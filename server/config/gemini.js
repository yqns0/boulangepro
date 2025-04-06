// Configuration de l'API Gemini
// IMPORTANT: Ne jamais exposer cette clé côté client

// Vous devez définir la variable d'environnement GEMINI_API_KEY
// Pour des raisons de sécurité, il est recommandé d'utiliser des variables d'environnement
// Ajoutez cette variable dans le fichier .env ou dans les variables d'environnement de votre hébergeur

// Vérifier si la clé API est définie
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn('⚠️ ATTENTION: La clé API Gemini n\'est pas définie dans les variables d\'environnement.');
    console.warn('Le générateur de recettes fonctionnera en mode hors ligne uniquement.');
    console.warn('Pour activer Gemini, ajoutez GEMINI_API_KEY dans le fichier .env ou dans les variables d\'environnement de Render.');
} else {
    console.log('✅ Clé API Gemini trouvée dans les variables d\'environnement.');
}

module.exports = {
    apiKey: apiKey || 'AIzaSyDJC5a7eNBznUFYCwdBRzLQ_NKmMmXlqGQ', // Utiliser la clé API définie dans .env
    model: 'gemini-2.0-flash', // Modèle à utiliser
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    timeout: 30000, // Timeout en millisecondes
    isConfigured: !!apiKey // Indique si la clé API est configurée
};