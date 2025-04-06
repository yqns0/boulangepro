const express = require('express');
const router = express.Router();
const axios = require('axios');
const geminiConfig = require('../config/gemini');

// Endpoint pour générer une idée de recette
router.post('/generate-recipe-idea', async (req, res) => {
    try {
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

        // Prompt complet avec instructions
        const fullPrompt = `${systemPrompt}\n\n${prompt}\n\nRéponds STRICTEMENT au format JSON suivant sans aucun texte avant ou après:\n{\n  "title": "Titre de la recette",\n  "description": "Description détaillée",\n  "ingredients": ["Ingrédient 1", "Ingrédient 2", "..."],\n  "technique": "Technique signature"\n}`;

        while (retryCount <= maxRetries) {
            try {
                // Construire l'URL avec la clé API
                const apiUrl = `${geminiConfig.apiUrl}?key=${geminiConfig.apiKey}`;

                response = await axios.post(
                    apiUrl,
                    {
                        contents: [{
                            parts: [{ text: fullPrompt }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            topP: 0.95,
                            topK: 40,
                            maxOutputTokens: 1024,
                            responseMimeType: "application/json"
                        },
                        safetySettings: [
                            {
                                category: "HARM_CATEGORY_HARASSMENT",
                                threshold: "BLOCK_NONE"
                            },
                            {
                                category: "HARM_CATEGORY_HATE_SPEECH",
                                threshold: "BLOCK_NONE"
                            },
                            {
                                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                                threshold: "BLOCK_NONE"
                            },
                            {
                                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                                threshold: "BLOCK_NONE"
                            }
                        ]
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

                // Vérifier si c'est une erreur de limite de taux
                if (error.response && (error.response.status === 429 || error.response.status === 403)) {
                    console.log(`Limite de taux atteinte, tentative ${retryCount}/${maxRetries}`);

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

// Fonction pour générer une idée de recette de secours
function generateFallbackRecipeIdea(creationType, occasion, currentMonth) {
    console.log('Génération d\'une idée de secours pour:', creationType);

    // Obtenir les produits de saison pour le mois actuel
    const seasonalProduce = getSeasonalProduce(currentMonth);

    // Sélectionner aléatoirement des ingrédients de saison
    const getRandomItems = (array, count) => {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    // Sélectionner des ingrédients en fonction du type de création
    let ingredients = [];
    let title = '';
    let description = '';
    let technique = '';

    // Bases communes pour chaque type de création
    const baseIngredients = {
        'patisserie': ['farine', 'sucre', 'beurre', 'œufs', 'levure chimique'],
        'boulangerie': ['farine', 'eau', 'sel', 'levure', 'farine complète'],
        'viennoiserie': ['farine', 'beurre', 'sucre', 'œufs', 'lait'],
        'snacking': ['farine', 'fromage', 'œufs', 'herbes aromatiques']
    };

    // Sélectionner des ingrédients de base selon le type
    const baseForType = baseIngredients[creationType] || ['farine', 'sucre', 'beurre', 'œufs'];

    // Ajouter des ingrédients de saison
    let seasonalIngredients = [];
    if (occasion === 'saison') {
        // Privilégier les fruits pour les pâtisseries et les légumes pour le reste
        if (creationType === 'patisserie') {
            seasonalIngredients = getRandomItems(seasonalProduce.fruits, 2);
        } else if (creationType === 'snacking') {
            seasonalIngredients = getRandomItems(seasonalProduce.vegetables, 2);
        } else {
            // Mélanger fruits et légumes pour les autres types
            const allProduce = [...seasonalProduce.fruits, ...seasonalProduce.vegetables];
            seasonalIngredients = getRandomItems(allProduce, 2);
        }
    }

    // Combiner les ingrédients de base et de saison
    ingredients = [...baseForType, ...seasonalIngredients];

    // Générer un titre en fonction du type et de la saison
    const adjectives = ['Délicieuse', 'Savoureuse', 'Rustique', 'Gourmande', 'Traditionnelle', 'Créative'];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];

    // Noms spécifiques selon le type de création
    const typeNames = {
        'patisserie': ['Tarte', 'Gâteau', 'Entremet', 'Crème', 'Mousse'],
        'boulangerie': ['Pain', 'Fougasse', 'Baguette', 'Boule', 'Ficelle'],
        'viennoiserie': ['Brioche', 'Croissant', 'Pain au chocolat', 'Chausson', 'Tresse'],
        'snacking': ['Sandwich', 'Wrap', 'Quiche', 'Focaccia', 'Pizza']
    };

    const typeName = typeNames[creationType] ?
        typeNames[creationType][Math.floor(Math.random() * typeNames[creationType].length)] :
        'Création';

    // Ajouter un ingrédient au titre si c'est de saison
    let titleIngredient = '';
    if (seasonalIngredients.length > 0) {
        titleIngredient = ` aux ${seasonalIngredients[0]}`;
    }

    title = `${randomAdjective} ${typeName}${titleIngredient}`;

    // Générer une description
    const seasonText = occasion === 'saison' ?
        `Cette recette met en valeur les produits de saison du mois ${getMonthName(currentMonth)}.` :
        '';

    const occasionText = occasion === 'special' ?
        'Cette création sophistiquée est parfaite pour les occasions spéciales.' :
        'Cette recette équilibrée convient parfaitement pour une consommation quotidienne.';

    description = `Une ${creationType} artisanale qui combine des saveurs authentiques et une texture parfaite. ${seasonText} ${occasionText}`;

    // Générer une technique signature
    const techniques = [
        'Utilisation d\'une fermentation lente pour développer les arômes',
        'Incorporation d\'air dans la pâte pour une texture légère',
        'Cuisson à basse température pour préserver les saveurs',
        'Technique de feuilletage inversé pour un résultat croustillant',
        'Méthode de pétrissage spéciale pour une mie alvéolée',
        'Utilisation d\'un levain naturel pour plus de complexité aromatique'
    ];

    technique = techniques[Math.floor(Math.random() * techniques.length)];

    // Retourner l'idée de recette
    return {
        title,
        description,
        ingredients,
        technique
    };
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