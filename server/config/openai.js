// Configuration de l'API OpenAI
// IMPORTANT: Ne jamais exposer cette clé côté client

// Vous devez définir la variable d'environnement OPENAI_API_KEY
// Pour des raisons de sécurité, il est recommandé d'utiliser des variables d'environnement
// Ajoutez cette variable dans le fichier .env ou dans les variables d'environnement de votre hébergeur

module.exports = {
    apiKey: process.env.OPENAI_API_KEY || 'votre-cle-api-ici', // À remplacer par votre clé API dans le fichier .env
    model: 'gpt-3.5-turbo', // Modèle à utiliser
    maxTokens: 500, // Nombre maximum de tokens pour la réponse
    temperature: 0.7, // Contrôle la créativité (0 = déterministe, 1 = très créatif)
    timeout: 30000 // Timeout en millisecondes
};