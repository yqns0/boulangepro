# BoulangePro - Assistant de Boulangerie-Pâtisserie

BoulangePro est une application web conçue pour aider les pâtissiers et boulangers professionnels à gérer leurs recettes, calculer leurs coûts et optimiser leur production.

## Architecture

L'application est divisée en deux parties :
- **Frontend** : Interface utilisateur en HTML/CSS/JavaScript
- **Backend** : API REST en Node.js/Express avec MongoDB

## Fonctionnalités

### 1. Gestion des Recettes
- Création et édition de recettes détaillées
- Organisation par catégories (pâtisserie, boulangerie, viennoiserie)
- Calcul automatique des coûts par recette

### 2. Gestion des Ingrédients
- Base de données d'ingrédients avec prix unitaires
- Suivi des stocks
- Catégorisation des matières premières

### 3. Calculateur de Coûts
- Calcul précis du coût de revient des recettes
- Ajustement des quantités (multiplication, division)
- Adaptation des recettes pour un nombre précis de produits
- Calcul du coût par pièce ou par poids
- Suggestion de prix de vente basée sur la marge souhaitée

### 4. Inspirations et Nouveautés
- Suggestions de recettes générées par IA
- Idées saisonnières
- Catégories variées (pâtisserie, boulangerie, viennoiserie, snacking)
- Possibilité de créer des recettes à partir des suggestions

## Déploiement

### Frontend (Netlify)

1. Connectez-vous à [Netlify](https://app.netlify.com/)
2. Cliquez sur "New site from Git"
3. Sélectionnez votre dépôt GitHub
4. Configurez les paramètres de build :
   - **Base directory** : (laissez vide)
   - **Build command** : (laissez vide)
   - **Publish directory** : `.`
5. Cliquez sur "Deploy site"
6. Une fois déployé, allez dans "Site settings" > "Domain management" pour configurer votre domaine personnalisé si nécessaire

### Backend (Render)

1. Créez un nouveau service Web sur [Render](https://render.com/)
2. Connectez votre dépôt GitHub
3. Configurez les paramètres suivants :
   - **Name** : boulangepro-api
   - **Environment** : Node
   - **Build Command** : `npm install`
   - **Start Command** : `node server.js`
   - **Root Directory** : `server` (si vous déployez tout le dépôt)
4. Ajoutez les variables d'environnement nécessaires (voir server/README.md)
5. Cliquez sur "Create Web Service"

## Installation locale

1. Clonez ce dépôt sur votre machine :
```
git clone https://github.com/votre-utilisateur/boulangepro.git
```

2. Installez les dépendances du backend :
```
cd server
npm install
```

3. Créez un fichier `.env` dans le dossier `server` avec les variables nécessaires

4. Démarrez le serveur :
```
npm run dev
```

5. Ouvrez `index.html` dans votre navigateur ou utilisez une extension comme Live Server dans VS Code

## Utilisation

### Première utilisation
L'application utilise le stockage local de votre navigateur (localStorage) pour sauvegarder vos données. Des données d'exemple sont préchargées pour vous permettre de tester les fonctionnalités.

### Gestion des recettes
1. Accédez à l'onglet "Mes Recettes"
2. Cliquez sur "Nouvelle recette" pour créer une recette
3. Remplissez les détails de la recette, ajoutez les ingrédients et les instructions
4. Enregistrez la recette

### Calcul des coûts
1. Accédez à l'onglet "Calculateur"
2. Sélectionnez une recette dans la liste déroulante
3. Ajustez les quantités selon vos besoins (multiplication, nombre de pièces, poids total)
4. Consultez le coût total, le coût par pièce et le prix de vente suggéré

### Gestion des ingrédients
1. Accédez à l'onglet "Ingrédients"
2. Ajoutez, modifiez ou supprimez des ingrédients
3. Définissez les prix unitaires et les stocks

## Personnalisation

### Thème
- Cliquez sur l'icône lune/soleil dans l'en-tête pour basculer entre le mode clair et le mode sombre

### Données
- Toutes les données sont stockées localement dans votre navigateur
- Pour réinitialiser les données, effacez le localStorage de votre navigateur

## Technologies utilisées

- HTML5
- CSS3 avec variables CSS pour la thématisation
- JavaScript vanilla (pas de framework)
- LocalStorage pour la persistance des données

## Développement futur

Fonctionnalités prévues pour les versions futures :
- Synchronisation des données avec un serveur
- Exportation des recettes en PDF
- Gestion des utilisateurs et partage de recettes
- Application mobile
- Intégration d'une véritable IA pour les suggestions de recettes
- Gestion des allergènes et régimes alimentaires

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

---

Développé avec ❤️ pour les professionnels de la boulangerie et pâtisserie.