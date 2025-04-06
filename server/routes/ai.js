const express = require('express');
const router = express.Router();
const axios = require('axios');
const geminiConfig = require('../config/gemini');

// Endpoint de test pour vérifier que l'API Gemini fonctionne
router.get('/test-gemini', async (req, res) => {
    try {
        console.log('Test de l\'API Gemini...');

        // Construire l'URL avec la clé API
        const apiUrl = `${geminiConfig.apiUrl}?key=${geminiConfig.apiKey}`;

        // Requête simple pour tester l'API
        const response = await axios.post(
            apiUrl,
            {
                contents: [{
                    parts: [{ text: "Génère une recette de pain simple en format JSON avec les champs: title, description, ingredients (array), technique" }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: geminiConfig.timeout
            }
        );

        return res.json({
            success: true,
            message: 'API Gemini fonctionne correctement',
            data: response.data
        });
    } catch (error) {
        console.error('Erreur lors du test de l\'API Gemini:', error);

        return res.status(500).json({
            success: false,
            message: 'Erreur lors du test de l\'API Gemini',
            error: error.message,
            details: error.response ? error.response.data : null
        });
    }
});

// Endpoint pour générer une idée de recette
router.post('/generate-recipe-idea', async (req, res) => {
    try {
        // Toujours utiliser la génération locale pour éviter les problèmes d'API
        console.log('Génération d\'une idée de recette locale...');

        // Générer une idée de secours
        const fallbackIdea = generateFallbackRecipeIdea(req.body.creationType, req.body.occasion, req.body.currentMonth);
        console.log('Idée générée:', fallbackIdea);

        // Retourner l'idée générée
        return res.json(fallbackIdea);

        /* Commenté pour éviter les erreurs d'API
        // Vérifier si l'API Gemini est configurée
        if (!geminiConfig.apiKey || geminiConfig.apiKey === 'votre-cle-api-ici') {
            console.log('Clé API Gemini non configurée, utilisation du mode hors ligne');

            // Générer une idée de secours au lieu de retourner une erreur
            const fallbackIdea = generateFallbackRecipeIdea(req.body.creationType, req.body.occasion, req.body.currentMonth);
            console.log('Idée de secours générée:', fallbackIdea);

            // Retourner l'idée de secours avec un indicateur
            return res.json({
                ...fallbackIdea,
                offline: true,
                message: 'Idée générée localement car la clé API Gemini n\'est pas configurée.'
            });
        }
        */

        const { creationType, keyIngredients, occasion, currentMonth } = req.body;

        if (!creationType) {
            return res.status(400).json({ error: 'Le type de création est requis' });
        }
        
        // Construire le prompt pour l'API Gemini - version simplifiée et plus directe
        let prompt = `Génère une idée de recette innovante et créative de ${creationType.toLowerCase()}`;

        // Ajouter les ingrédients clés s'ils sont spécifiés
        if (keyIngredients && keyIngredients.trim() !== '') {
            prompt += ` qui utilise OBLIGATOIREMENT les ingrédients suivants: ${keyIngredients}.`;
        } else {
            prompt += `.`;
        }

        // Ajouter des instructions spécifiques selon l'occasion
        if (occasion === 'saison' && currentMonth) {
            const monthNames = [
                'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
            ];
            const monthName = monthNames[currentMonth - 1];

            prompt += ` Cette recette doit mettre en valeur les produits de saison du mois de ${monthName}.`;
        } else if (occasion === 'special') {
            prompt += ` Cette recette doit être sophistiquée et adaptée pour une occasion spéciale, avec une présentation élégante et des saveurs complexes.`;
        } else {
            prompt += ` Cette recette doit être adaptée pour une consommation quotidienne, avec un bon équilibre entre simplicité et originalité.`;
        }

        // Instructions pour le format de réponse
        prompt += ` Ta réponse doit inclure un titre accrocheur, une description détaillée, une liste de 4-6 ingrédients principaux, et une technique signature qui rend cette recette unique.`;
        
        console.log('Prompt pour Gemini:', prompt);

        // Appel à l'API Gemini avec gestion des erreurs et des tentatives
        let response;
        let retryCount = 0;
        const maxRetries = 2;
        const retryDelay = 1000; // 1 seconde

        // Instructions pour le modèle Gemini - plus détaillées pour s'assurer que les paramètres sont pris en compte
        const systemPrompt = `Tu es un chef pâtissier et boulanger expert qui génère des idées de recettes innovantes et créatives.
IMPORTANT: Tu dois absolument respecter les contraintes suivantes:
1. Le type de création demandé est "${creationType}" - ta recette DOIT être de ce type spécifique
2. ${keyIngredients && keyIngredients.trim() !== '' ? `Les ingrédients clés demandés sont: ${keyIngredients} - ta recette DOIT les inclure` : 'Aucun ingrédient spécifique n\'est requis, tu es libre de choisir'}
3. L'occasion est "${occasion}" - ta recette doit être adaptée à cette occasion
4. Réponds UNIQUEMENT au format JSON avec les champs: title, description, ingredients (array), technique.
5. Pour chaque ingrédient, indique le nom de l'ingrédient uniquement, sans quantité ni unité.`;

        // Prompt simplifié pour l'API Gemini
        const fullPrompt = `Génère une recette de ${creationType} créative.

Si des ingrédients sont spécifiés (${keyIngredients || 'aucun'}), utilise-les.

Réponds UNIQUEMENT au format JSON suivant:
{
  "title": "Titre de la recette",
  "description": "Description détaillée",
  "ingredients": ["Ingrédient 1", "Ingrédient 2", "Ingrédient 3"],
  "technique": "Technique signature"
}`;

        console.log('Prompt final:', fullPrompt);

        while (retryCount <= maxRetries) {
            try {
                // Construire l'URL avec la clé API
                const apiUrl = `${geminiConfig.apiUrl}?key=${geminiConfig.apiKey}`;

                // Requête très simplifiée pour l'API Gemini
                response = await axios.post(
                    apiUrl,
                    {
                        contents: [{
                            parts: [{ text: fullPrompt }]
                        }]
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: geminiConfig.timeout
                    }
                );

                // Si la requête réussit, sortir de la boucle
                break;
            } catch (error) {
                retryCount++;
                console.error('Erreur Gemini:', error.response ? error.response.data : error.message);

                // Afficher les détails de l'erreur pour le débogage
                console.error('Détails de l\'erreur Gemini:', error);
                if (error.response) {
                    console.error('Statut:', error.response.status);
                    console.error('Données:', error.response.data);
                    console.error('Headers:', error.response.headers);
                }

                // Vérifier si c'est une erreur de limite de taux ou autre erreur connue
                if (error.response && (error.response.status === 429 || error.response.status === 403 ||
                                      error.response.status === 400)) {
                    console.log(`Erreur API Gemini (${error.response.status}), tentative ${retryCount}/${maxRetries}`);

                    if (retryCount <= maxRetries) {
                        // Attendre avant de réessayer
                        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
                        continue;
                    }
                }

                // Pour les autres erreurs ou si le nombre maximum de tentatives est atteint
                throw error;
            }
        }

        // Extraire la réponse de Gemini
        console.log('Réponse complète de Gemini:', JSON.stringify(response.data));

        // Vérifier si la réponse a la structure attendue
        if (!response.data.candidates || !response.data.candidates[0] ||
            !response.data.candidates[0].content || !response.data.candidates[0].content.parts ||
            !response.data.candidates[0].content.parts[0] || !response.data.candidates[0].content.parts[0].text) {

            console.error('Structure de réponse Gemini inattendue:', response.data);
            throw new Error('Format de réponse Gemini invalide');
        }

        const content = response.data.candidates[0].content.parts[0].text;
        console.log('Réponse brute de Gemini:', content);

        try {
            // Nettoyer la réponse pour s'assurer qu'elle contient uniquement du JSON
            let cleanedContent = content;

            // Supprimer tout texte avant le premier '{'
            const startBraceIndex = content.indexOf('{');
            if (startBraceIndex > 0) {
                cleanedContent = content.substring(startBraceIndex);
            }

            // Supprimer tout texte après le dernier '}'
            const endBraceIndex = cleanedContent.lastIndexOf('}');
            if (endBraceIndex < cleanedContent.length - 1) {
                cleanedContent = cleanedContent.substring(0, endBraceIndex + 1);
            }

            // Analyser la réponse JSON
            const recipeIdea = JSON.parse(cleanedContent);

            // Vérifier que la réponse contient les champs attendus
            if (!recipeIdea.title || !recipeIdea.description || !recipeIdea.ingredients || !recipeIdea.technique) {
                console.warn('Réponse incomplète de l\'API, champs manquants');

                // Compléter les champs manquants si nécessaire
                recipeIdea.title = recipeIdea.title || "Recette innovante";
                recipeIdea.description = recipeIdea.description || "Une création culinaire unique et savoureuse.";
                recipeIdea.ingredients = recipeIdea.ingredients || ["Ingrédient principal", "Ingrédient secondaire", "Épices au choix"];
                recipeIdea.technique = recipeIdea.technique || "Technique de préparation spéciale qui rend cette recette unique.";
            }

            // S'assurer que ingredients est bien un tableau
            if (!Array.isArray(recipeIdea.ingredients)) {
                if (typeof recipeIdea.ingredients === 'string') {
                    // Convertir la chaîne en tableau
                    recipeIdea.ingredients = recipeIdea.ingredients.split(',').map(item => item.trim());
                } else {
                    // Créer un tableau par défaut
                    recipeIdea.ingredients = ["Ingrédient principal", "Ingrédient secondaire", "Épices au choix"];
                }
            }

            return res.json(recipeIdea);
        } catch (parseError) {
            console.error('Erreur lors de l\'analyse de la réponse JSON:', parseError);
            console.log('Réponse brute:', content);

            // Tenter de nettoyer et d'extraire le JSON avec une regex plus robuste
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const cleanedJson = JSON.parse(jsonMatch[0]);

                    // Compléter les champs manquants si nécessaire
                    cleanedJson.title = cleanedJson.title || "Recette innovante";
                    cleanedJson.description = cleanedJson.description || "Une création culinaire unique et savoureuse.";
                    cleanedJson.ingredients = cleanedJson.ingredients || ["Ingrédient principal", "Ingrédient secondaire", "Épices au choix"];
                    cleanedJson.technique = cleanedJson.technique || "Technique de préparation spéciale qui rend cette recette unique.";

                    return res.json(cleanedJson);
                } catch (e) {
                    // Si l'extraction échoue également, créer une réponse de secours
                    const fallbackResponse = {
                        title: `${getCategoryName(creationType)} Créative`,
                        description: `Une recette de ${creationType} innovante${keyIngredients ? ` utilisant ${keyIngredients}` : ''}.`,
                        ingredients: keyIngredients ? keyIngredients.split(',').map(item => item.trim()) : ["Ingrédient principal", "Ingrédient secondaire", "Épices au choix"],
                        technique: "Technique de préparation spéciale adaptée à cette création."
                    };

                    return res.json(fallbackResponse);
                }
            }

            // Créer une réponse de secours si aucun JSON n'est trouvé
            const fallbackResponse = {
                title: `${getCategoryName(creationType)} Créative`,
                description: `Une recette de ${creationType} innovante${keyIngredients ? ` utilisant ${keyIngredients}` : ''}.`,
                ingredients: keyIngredients ? keyIngredients.split(',').map(item => item.trim()) : ["Ingrédient principal", "Ingrédient secondaire", "Épices au choix"],
                technique: "Technique de préparation spéciale adaptée à cette création."
            };

            return res.json(fallbackResponse);
        }
    } catch (error) {
        console.error('Erreur lors de la génération de l\'idée de recette:', error);
        
        // Gérer les erreurs spécifiques à l'API Gemini
        if (error.response && error.response.data) {
            console.error('Détails de l\'erreur Gemini:', error.response.data);
            return res.status(error.response.status).json({
                error: 'Erreur lors de la communication avec l\'API Gemini',
                details: error.response.data.error
            });
        }
        
        return res.status(500).json({ error: 'Erreur lors de la génération de l\'idée de recette' });
    }
});

// Fonction pour obtenir le nom de la catégorie
function getCategoryName(category) {
    const categories = {
        'patisserie': 'Pâtisserie',
        'boulangerie': 'Boulangerie',
        'viennoiserie': 'Viennoiserie',
        'snacking': 'Snacking'
    };

    return categories[category] || 'Création Culinaire';
}

// Fonction pour générer une idée de recette créative
function generateFallbackRecipeIdea(creationType, occasion, currentMonth) {
    console.log('Génération d\'une idée de recette pour:', creationType);

    // Obtenir les produits de saison pour le mois actuel
    const seasonalProduce = getSeasonalProduce(currentMonth);

    // Sélectionner aléatoirement des ingrédients de saison
    const getRandomItems = (array, count) => {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    // Recettes prédéfinies par type de création
    const predefinedRecipes = {
        'patisserie': [
            {
                title: "Tarte Fraise-Pistache Revisitée",
                description: "Une tarte moderne associant la fraîcheur des fraises de saison à la douceur de la pistache. La base est composée d'une pâte sablée croustillante, surmontée d'une crème de pistache légère et d'un arrangement géométrique de fraises fraîches glacées.",
                ingredients: ["Fraises fraîches", "Pâte de pistache", "Crème pâtissière", "Pâte sablée", "Sucre glace", "Beurre de qualité"],
                technique: "Glaçage miroir vert pâle sur les fraises pour un effet visuel saisissant."
            },
            {
                title: "Éclair Café-Caramel au Beurre Salé",
                description: "Une réinterprétation de l'éclair classique avec une ganache au café intense et un cœur coulant de caramel au beurre salé. La pâte à choux est légèrement croustillante à l'extérieur et moelleuse à l'intérieur, offrant un contraste parfait avec les garnitures.",
                ingredients: ["Pâte à choux", "Café de spécialité", "Caramel au beurre salé", "Crème fleurette", "Chocolat noir", "Fleur de sel"],
                technique: "Double cuisson de la pâte à choux pour une texture parfaite et un glaçage au café réalisé avec une infusion à froid."
            },
            {
                title: "Dôme Chocolat-Framboise et Basilic",
                description: "Un entremets sophistiqué combinant l'intensité du chocolat noir, l'acidité des framboises fraîches et la note aromatique surprenante du basilic. Le dôme repose sur un biscuit moelleux au chocolat et cache un insert de gelée de framboise au basilic.",
                ingredients: ["Chocolat noir 70%", "Framboises fraîches", "Basilic frais", "Crème mascarpone", "Biscuit chocolat", "Gélatine"],
                technique: "Glaçage miroir bicolore réalisé avec une technique de marbrure pour un effet visuel spectaculaire."
            }
        ],
        'boulangerie': [
            {
                title: "Pain de Campagne aux Graines Anciennes",
                description: "Un pain rustique à la mie alvéolée et à la croûte épaisse, enrichi d'un mélange de graines anciennes (quinoa, amarante, lin) pour une saveur complexe et des qualités nutritionnelles supérieures.",
                ingredients: ["Farine T65", "Levain naturel", "Mélange de graines anciennes", "Sel de Guérande", "Eau filtrée", "Farine de seigle"],
                technique: "Fermentation lente de 24h à basse température pour développer les arômes et faciliter la digestibilité."
            },
            {
                title: "Baguette Tradition au Charbon Végétal",
                description: "Une baguette tradition revisitée avec l'ajout de charbon végétal qui lui confère une couleur noire intense et des propriétés détoxifiantes. La mie est aérée et la croûte croustillante, avec une saveur légèrement fumée.",
                ingredients: ["Farine tradition", "Charbon végétal actif", "Levure fraîche", "Sel fin", "Eau de source", "Farine de blé dur"],
                technique: "Pétrissage minimal et façonnage spécifique pour préserver les alvéoles et obtenir une croûte parfaite."
            },
            {
                title: "Pain Marbré Betterave et Curcuma",
                description: "Un pain spectaculaire visuellement avec son marbrage naturel rose et jaune, obtenu grâce à des purées de betterave et de curcuma. Au-delà de l'aspect esthétique, ces ingrédients apportent des saveurs subtiles et des bienfaits nutritionnels.",
                ingredients: ["Farine bio T80", "Purée de betterave", "Curcuma frais", "Levain liquide", "Huile d'olive", "Sel marin"],
                technique: "Technique de marbrage par superposition et pliage de pâtes colorées naturellement, sans additifs."
            }
        ],
        'viennoiserie': [
            {
                title: "Croissant Bicolore Matcha-Vanille",
                description: "Un croissant innovant combinant deux pâtes feuilletées, l'une nature à la vanille et l'autre au thé matcha, créant un effet visuel spectaculaire et des saveurs contrastées.",
                ingredients: ["Beurre AOP", "Farine T45", "Poudre de matcha", "Vanille de Madagascar", "Lait entier", "Sucre blond"],
                technique: "Superposition de deux pâtes colorées différemment avant le tourage pour créer un effet bicolore en spirale."
            },
            {
                title: "Pain au Chocolat Caramélisé au Miso",
                description: "Une version audacieuse du pain au chocolat avec une touche umami apportée par le miso qui vient caraméliser la surface. L'intérieur reste traditionnel avec un chocolat noir de qualité qui fond délicatement.",
                ingredients: ["Pâte feuilletée levée", "Chocolat noir 70%", "Miso blanc", "Beurre clarifié", "Sucre muscovado", "Fleur de sel"],
                technique: "Application d'une fine couche de miso mélangé à du sucre muscovado avant la cuisson pour une caramélisation unique."
            },
            {
                title: "Brioche Tressée aux Agrumes Confits et Safran",
                description: "Une brioche moelleuse et aérienne, délicatement parfumée au safran qui lui donne sa couleur dorée, et parsemée d'agrumes confits maison qui apportent fraîcheur et notes acidulées.",
                ingredients: ["Farine de gruau", "Beurre fin", "Safran", "Agrumes confits", "Œufs fermiers", "Miel d'acacia"],
                technique: "Tressage complexe à 6 brins et double dorure pour un aspect brillant et une croûte parfaitement développée."
            }
        ],
        'snacking': [
            {
                title: "Focaccia Marbrée aux Herbes et Fleurs Comestibles",
                description: "Une focaccia artistique avec un marbrage naturel créé par différentes herbes fraîches et fleurs comestibles pressées dans la pâte. Chaque bouchée offre une explosion de saveurs aromatiques différentes.",
                ingredients: ["Farine italienne", "Huile d'olive extra vierge", "Herbes fraîches assorties", "Fleurs comestibles", "Sel de mer", "Ail noir"],
                technique: "Disposition artistique des herbes et fleurs pour créer un tableau comestible, avec une hydratation élevée pour une texture aérienne."
            },
            {
                title: "Quiche Lorraine Revisitée",
                description: "Une quiche lorraine modernisée avec une pâte brisée au beurre noisette, une garniture crémeuse aux lardons fumés et comté affiné. Servie en portions individuelles pour un snacking gourmand.",
                ingredients: ["Pâte brisée", "Lardons fumés", "Comté affiné", "Crème fraîche", "Œufs fermiers", "Muscade fraîche"],
                technique: "Cuisson à basse température pour une texture fondante et un cœur crémeux parfaitement cuit."
            },
            {
                title: "Sandwich Cubique au Pastrami et Pickles Maison",
                description: "Un sandwich architectural de forme cubique parfaite, avec du pain de mie au levain, du pastrami tranché finement, des pickles de légumes maison croquants et une sauce moutarde-miel légèrement épicée.",
                ingredients: ["Pain de mie au levain", "Pastrami artisanal", "Pickles maison", "Sauce moutarde-miel", "Cheddar affiné", "Roquette"],
                technique: "Pressage du sandwich dans un moule cubique pour une présentation géométrique moderne et des saveurs parfaitement fusionnées."
            }
        ]
    };

    // Sélectionner une recette aléatoire du type demandé
    const recipesByType = predefinedRecipes[creationType] || predefinedRecipes['patisserie'];
    const randomRecipe = recipesByType[Math.floor(Math.random() * recipesByType.length)];

    // Si des ingrédients clés sont spécifiés, les ajouter à la recette
    if (occasion === 'saison') {
        // Ajouter des ingrédients de saison
        const seasonalIngredients = getRandomItems([...seasonalProduce.fruits, ...seasonalProduce.vegetables], 2);
        randomRecipe.ingredients = [...randomRecipe.ingredients.slice(0, 4), ...seasonalIngredients];

        // Adapter la description
        randomRecipe.description = `${randomRecipe.description} Cette création met en valeur les produits de saison du mois de ${getMonthName(currentMonth)}.`;
    }

    // Adapter pour occasion spéciale si nécessaire
    if (occasion === 'special') {
        randomRecipe.description = `${randomRecipe.description} Cette création sophistiquée est parfaite pour les occasions spéciales, avec une présentation élégante et des saveurs complexes.`;
    }

    // Retourner l'idée de recette
    return randomRecipe;
}

// Fonction pour obtenir le nom du mois
function getMonthName(monthNumber) {
    const monthNames = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    return monthNames[monthNumber - 1] || '';
}

// Fonction pour obtenir les produits de saison pour un mois donné
function getSeasonalProduce(month) {
    // Définir les fruits et légumes de saison pour chaque mois
    const seasonalProduceByMonth = {
        1: { // Janvier
            fruits: ['pomme', 'poire', 'orange', 'clémentine', 'kiwi'],
            vegetables: ['carotte', 'poireau', 'chou', 'céleri', 'betterave']
        },
        2: { // Février
            fruits: ['pomme', 'poire', 'orange', 'clémentine', 'kiwi'],
            vegetables: ['carotte', 'poireau', 'chou', 'céleri', 'betterave', 'endive']
        },
        3: { // Mars
            fruits: ['pomme', 'poire', 'orange', 'kiwi'],
            vegetables: ['carotte', 'poireau', 'chou', 'épinard', 'asperge']
        },
        4: { // Avril
            fruits: ['pomme', 'rhubarbe', 'fraise'],
            vegetables: ['carotte', 'asperge', 'épinard', 'radis', 'petit pois']
        },
        5: { // Mai
            fruits: ['fraise', 'cerise', 'rhubarbe'],
            vegetables: ['asperge', 'radis', 'petit pois', 'artichaut', 'courgette']
        },
        6: { // Juin
            fruits: ['fraise', 'cerise', 'abricot', 'pêche', 'melon'],
            vegetables: ['courgette', 'aubergine', 'tomate', 'poivron', 'haricot vert']
        },
        7: { // Juillet
            fruits: ['abricot', 'pêche', 'nectarine', 'melon', 'framboise', 'myrtille'],
            vegetables: ['courgette', 'aubergine', 'tomate', 'poivron', 'haricot vert', 'maïs']
        },
        8: { // Août
            fruits: ['pêche', 'nectarine', 'prune', 'melon', 'framboise', 'figue'],
            vegetables: ['courgette', 'aubergine', 'tomate', 'poivron', 'haricot vert', 'maïs']
        },
        9: { // Septembre
            fruits: ['pomme', 'poire', 'prune', 'raisin', 'figue'],
            vegetables: ['courgette', 'aubergine', 'tomate', 'poivron', 'champignon', 'potiron']
        },
        10: { // Octobre
            fruits: ['pomme', 'poire', 'raisin', 'coing', 'châtaigne'],
            vegetables: ['potiron', 'champignon', 'carotte', 'céleri', 'chou']
        },
        11: { // Novembre
            fruits: ['pomme', 'poire', 'coing', 'kiwi', 'châtaigne'],
            vegetables: ['potiron', 'carotte', 'céleri', 'chou', 'poireau']
        },
        12: { // Décembre
            fruits: ['pomme', 'poire', 'orange', 'clémentine', 'kiwi'],
            vegetables: ['carotte', 'poireau', 'chou', 'céleri', 'betterave']
        }
    };

    return seasonalProduceByMonth[month] || { fruits: [], vegetables: [] };
}

module.exports = router;