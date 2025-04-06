# BoulangePro API

API backend pour l'application BoulangePro.

## Variables d'environnement requises

Assurez-vous de configurer les variables d'environnement suivantes sur votre plateforme d'hébergement :

- `PORT` : Port sur lequel le serveur s'exécutera (généralement défini automatiquement par l'hébergeur)
- `MONGO_URI` : URI de connexion à la base de données MongoDB
- `JWT_SECRET` : Clé secrète pour la génération des tokens JWT
- `JWT_EXPIRE` : Durée de validité des tokens JWT (ex: "30d" pour 30 jours)
- `OPENAI_API_KEY` : Clé API pour OpenAI (pour la génération d'idées de recettes)
- `GEMINI_API_KEY` : Clé API pour Google Gemini (alternative à OpenAI)

Pour le développement local, copiez le fichier `.env.example` en `.env` et remplissez les valeurs appropriées :

```bash
cp .env.example .env
# Puis modifiez le fichier .env avec vos propres valeurs
```

**IMPORTANT** : Ne jamais commiter le fichier `.env` dans le dépôt Git. Il est déjà inclus dans le `.gitignore`.

## Déploiement sur Render

1. Créez un nouveau service Web sur Render
2. Connectez votre dépôt GitHub
3. Configurez les paramètres suivants :
   - **Name** : boulangepro-api
   - **Environment** : Node
   - **Build Command** : `npm install`
   - **Start Command** : `node server.js`
   - **Root Directory** : `server` (si vous déployez tout le dépôt)
4. Ajoutez les variables d'environnement mentionnées ci-dessus
5. Cliquez sur "Create Web Service"

## Configuration CORS

Si nécessaire, mettez à jour la configuration CORS dans `server.js` pour autoriser les requêtes depuis votre frontend déployé :

```javascript
app.use(cors({
  origin: ['https://votre-app-frontend.netlify.app', 'http://localhost:3000']
}));
```