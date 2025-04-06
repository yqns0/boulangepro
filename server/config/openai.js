// Configuration de l'API OpenAI
// IMPORTANT: Ne jamais exposer cette clé côté client

// Vous devez définir la variable d'environnement OPENAI_API_KEY
// ou remplacer process.env.OPENAI_API_KEY par votre clé API
// Pour des raisons de sécurité, il est recommandé d'utiliser des variables d'environnement

module.exports = {
    apiKey: process.env.OPENAI_API_KEY || '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',
    model: 'gpt-3.5-turbo', // Modèle à utiliser
    maxTokens: 500, // Nombre maximum de tokens pour la réponse
    temperature: 0.7, // Contrôle la créativité (0 = déterministe, 1 = très créatif)
    timeout: 30000 // Timeout en millisecondes
};