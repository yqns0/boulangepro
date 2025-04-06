// Configuration de l'API
// Détection automatique de l'environnement basée sur l'URL
const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');

// Remplacez cette URL par celle de votre backend déployé sur Render
const API_URL = isProduction
    ? 'https://boulangepro-api.onrender.com/api'  // URL de l'API en production
    : 'http://localhost:5000/api';  // URL de l'API en développement local

console.log(`Environnement: ${isProduction ? 'Production' : 'Développement'}`);
console.log(`API URL: ${API_URL}`);

// Fonction pour obtenir le token d'authentification
function getToken() {
    console.log('getToken() appelé');

    // Essayer d'abord localStorage
    let token = localStorage.getItem('token');
    console.log('Token dans localStorage:', token ? 'Présent' : 'Absent');

    // Si pas de token dans localStorage, essayer sessionStorage
    if (!token) {
        token = sessionStorage.getItem('token');
        console.log('Token dans sessionStorage:', token ? 'Présent' : 'Absent');

        // Si trouvé dans sessionStorage, synchroniser avec localStorage
        if (token) {
            localStorage.setItem('token', token);
            console.log('Token synchronisé de sessionStorage vers localStorage');
        }
    }

    // Si toujours pas de token, essayer de le récupérer depuis un cookie
    if (!token) {
        const tokenCookie = document.cookie.split('; ').find(row => row.startsWith('auth_token='));
        console.log('Cookie auth_token:', tokenCookie ? 'Présent' : 'Absent');

        if (tokenCookie) {
            token = tokenCookie.split('=')[1];

            // Synchroniser avec localStorage et sessionStorage
            localStorage.setItem('token', token);
            sessionStorage.setItem('token', token);
            console.log('Token synchronisé du cookie vers localStorage et sessionStorage');
        }
    }

    console.log('getToken() résultat final, token trouvé:', token ? 'Oui' : 'Non');
    return token;
}

// Fonction pour définir les headers d'authentification
function getHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Fonctions d'authentification
const auth = {
    // Inscription d'un nouvel utilisateur
    register: async (userData) => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'inscription');
            }
            
            // Stocker le token
            localStorage.setItem('token', data.token);
            
            return data;
        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            throw error;
        }
    },
    
    // Connexion d'un utilisateur
    login: async (credentials) => {
        try {
            console.log('Tentative de connexion avec:', credentials.email);

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la connexion');
            }

            console.log('Réponse du serveur:', data);

            // Ne pas stocker le token ici - cela sera fait dans la page intermédiaire
            // Cela évite les problèmes potentiels de timing

            return data;
        } catch (error) {
            console.error('Erreur de connexion:', error);
            throw error;
        }
    },
    
    // Obtenir les informations de l'utilisateur connecté
    getMe: async () => {
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                method: 'GET',
                headers: getHeaders()
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération des informations utilisateur');
            }
            
            return data;
        } catch (error) {
            console.error('Erreur de récupération utilisateur:', error);
            throw error;
        }
    },
    
    // Déconnexion
    logout: () => {
        console.log('logout() appelé');

        // Supprimer le token de localStorage
        localStorage.removeItem('token');
        console.log('Token supprimé de localStorage');

        // Supprimer le token de sessionStorage
        sessionStorage.removeItem('token');
        console.log('Token supprimé de sessionStorage');

        // Supprimer le cookie en définissant une date d'expiration dans le passé
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        console.log('Token supprimé du cookie');
    },
    
    // Vérifier si l'utilisateur est connecté
    isAuthenticated: () => {
        console.log('isAuthenticated() appelé dans api.js');

        // Fonction pour récupérer un cookie
        function getCookie(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
        }

        console.log('--- VÉRIFICATION D\'AUTHENTIFICATION ---');

        // Vérifier localStorage
        const localStorageToken = localStorage.getItem('token');
        console.log('Token dans localStorage:', localStorageToken ? `Présent (longueur: ${localStorageToken.length})` : 'Absent');

        // Vérifier sessionStorage
        const sessionStorageToken = sessionStorage.getItem('token');
        console.log('Token dans sessionStorage:', sessionStorageToken ? `Présent (longueur: ${sessionStorageToken.length})` : 'Absent');

        // Vérifier les cookies
        const cookieToken = getCookie('auth_token');
        console.log('Token dans cookie:', cookieToken ? `Présent (longueur: ${cookieToken.length})` : 'Absent');

        console.log('--- FIN DE LA VÉRIFICATION ---');

        // Utiliser le premier token disponible
        const token = localStorageToken || sessionStorageToken || cookieToken;

        if (token) {
            console.log('Token trouvé, utilisateur considéré comme authentifié');

            // Synchroniser toutes les sources
            try {
                if (!localStorageToken && token) {
                    localStorage.setItem('token', token);
                    console.log('Token synchronisé vers localStorage');
                }

                if (!sessionStorageToken && token) {
                    sessionStorage.setItem('token', token);
                    console.log('Token synchronisé vers sessionStorage');
                }

                if (!cookieToken && token) {
                    const expirationDate = new Date();
                    expirationDate.setDate(expirationDate.getDate() + 30);
                    document.cookie = `auth_token=${token}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Strict`;
                    console.log('Token synchronisé vers cookie');
                }
            } catch (error) {
                console.error('Erreur lors de la synchronisation du token:', error);
            }

            return true;
        }

        console.log('Pas de token trouvé, utilisateur non authentifié');
        return false;
    }
};

// Fonctions pour les recettes
const recipes = {
    // Obtenir toutes les recettes
    getAll: async () => {
        try {
            const response = await fetch(`${API_URL}/recipes`, {
                method: 'GET',
                headers: getHeaders()
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération des recettes');
            }
            
            return data.data;
        } catch (error) {
            console.error('Erreur de récupération des recettes:', error);
            throw error;
        }
    },
    
    // Obtenir une recette par ID
    getById: async (id) => {
        try {
            const response = await fetch(`${API_URL}/recipes/${id}`, {
                method: 'GET',
                headers: getHeaders()
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération de la recette');
            }
            
            return data.data;
        } catch (error) {
            console.error('Erreur de récupération de recette:', error);
            throw error;
        }
    },
    
    // Créer une nouvelle recette
    create: async (recipeData) => {
        try {
            console.log('Création de recette avec les données:', recipeData);

            const response = await fetch(`${API_URL}/recipes`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(recipeData)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Réponse d\'erreur du serveur:', data);
                throw new Error(data.error || 'Erreur lors de la création de la recette');
            }

            console.log('Recette créée avec succès:', data.data);
            return data.data;
        } catch (error) {
            console.error('Erreur de création de recette:', error);
            throw error;
        }
    },
    
    // Mettre à jour une recette
    update: async (id, recipeData) => {
        try {
            const response = await fetch(`${API_URL}/recipes/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(recipeData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la mise à jour de la recette');
            }
            
            return data.data;
        } catch (error) {
            console.error('Erreur de mise à jour de recette:', error);
            throw error;
        }
    },
    
    // Supprimer une recette
    delete: async (id) => {
        try {
            const response = await fetch(`${API_URL}/recipes/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la suppression de la recette');
            }
            
            return true;
        } catch (error) {
            console.error('Erreur de suppression de recette:', error);
            throw error;
        }
    }
};

// Fonctions pour les ingrédients
const ingredients = {
    // Obtenir tous les ingrédients
    getAll: async () => {
        try {
            const response = await fetch(`${API_URL}/ingredients`, {
                method: 'GET',
                headers: getHeaders()
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération des ingrédients');
            }
            
            return data.data;
        } catch (error) {
            console.error('Erreur de récupération des ingrédients:', error);
            throw error;
        }
    },
    
    // Obtenir un ingrédient par ID
    getById: async (id) => {
        try {
            const response = await fetch(`${API_URL}/ingredients/${id}`, {
                method: 'GET',
                headers: getHeaders()
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération de l\'ingrédient');
            }
            
            return data.data;
        } catch (error) {
            console.error('Erreur de récupération d\'ingrédient:', error);
            throw error;
        }
    },
    
    // Créer un nouvel ingrédient
    create: async (ingredientData) => {
        try {
            console.log('Création d\'ingrédient avec les données:', ingredientData);

            const response = await fetch(`${API_URL}/ingredients`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(ingredientData)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Réponse d\'erreur du serveur:', data);
                throw new Error(data.error || 'Erreur lors de la création de l\'ingrédient');
            }

            console.log('Ingrédient créé avec succès:', data.data);
            return data.data;
        } catch (error) {
            console.error('Erreur de création d\'ingrédient:', error);
            throw error;
        }
    },
    
    // Mettre à jour un ingrédient
    update: async (id, ingredientData) => {
        try {
            const response = await fetch(`${API_URL}/ingredients/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(ingredientData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la mise à jour de l\'ingrédient');
            }
            
            return data.data;
        } catch (error) {
            console.error('Erreur de mise à jour d\'ingrédient:', error);
            throw error;
        }
    },
    
    // Supprimer un ingrédient
    delete: async (id) => {
        try {
            const response = await fetch(`${API_URL}/ingredients/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la suppression de l\'ingrédient');
            }
            
            return true;
        } catch (error) {
            console.error('Erreur de suppression d\'ingrédient:', error);
            throw error;
        }
    }
};

// Fonctions pour l'IA
const ai = {
    // Générer une idée de recette
    generateRecipeIdea: async (params) => {
        try {
            console.log('Génération d\'une idée de recette avec les paramètres:', params);

            // Vérifier si le mode hors ligne est activé
            const offlineMode = localStorage.getItem('ai_offline_mode') === 'true';

            if (offlineMode) {
                console.log('Mode hors ligne activé, utilisation des suggestions locales');
                throw new Error('Mode hors ligne activé');
            }

            // Ajouter un timeout pour éviter d'attendre trop longtemps
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes

            try {
                const response = await fetch(`${API_URL}/ai/generate-recipe-idea`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        creationType: params.creationType,
                        keyIngredients: params.keyIngredients,
                        occasion: params.occasion,
                        currentMonth: params.currentMonth || (new Date().getMonth() + 1)
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Erreur lors de la génération de l\'idée de recette');
                }

                // Réinitialiser le compteur d'erreurs si la requête réussit
                localStorage.setItem('ai_error_count', '0');

                // Si la réponse n'est pas au format attendu, essayer de la formater
                if (typeof data === 'string') {
                    try {
                        // Essayer de trouver un JSON dans la réponse
                        const jsonMatch = data.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            return JSON.parse(jsonMatch[0]);
                        }
                    } catch (e) {
                        console.warn('Impossible de parser la réponse comme JSON');
                    }
                }

                // Vérifier que tous les champs requis sont présents
                if (data && typeof data === 'object') {
                    // S'assurer que tous les champs requis sont présents
                    data.title = data.title || "Recette innovante";
                    data.description = data.description || "Une création culinaire unique et savoureuse.";

                    // S'assurer que ingredients est un tableau
                    if (!data.ingredients || !Array.isArray(data.ingredients)) {
                        data.ingredients = ["Ingrédient principal", "Ingrédient secondaire", "Épices au choix"];
                    }

                    data.technique = data.technique || "Technique de préparation spéciale qui rend cette recette unique.";
                }

                return data;
            } catch (fetchError) {
                clearTimeout(timeoutId);
                throw fetchError;
            }
        } catch (error) {
            console.error('Erreur de génération d\'idée de recette:', error);

            // Incrémenter le compteur d'erreurs
            const errorCount = parseInt(localStorage.getItem('ai_error_count') || '0') + 1;
            localStorage.setItem('ai_error_count', errorCount.toString());

            // Si trop d'erreurs consécutives, suggérer le mode hors ligne
            if (errorCount >= 3) {
                console.log('Trop d\'erreurs consécutives, activation du mode hors ligne');
                localStorage.setItem('ai_offline_mode', 'true');

                // Afficher une notification à l'utilisateur (dans une implémentation réelle)
                // alert('Mode hors ligne activé en raison de problèmes de connexion à l\'API');
            }

            throw error;
        }
    },

    // Activer/désactiver le mode hors ligne
    toggleOfflineMode: (enable) => {
        localStorage.setItem('ai_offline_mode', enable ? 'true' : 'false');
        localStorage.setItem('ai_error_count', '0');
        console.log(`Mode hors ligne ${enable ? 'activé' : 'désactivé'}`);
        return enable;
    },

    // Vérifier si le mode hors ligne est activé
    isOfflineMode: () => {
        return localStorage.getItem('ai_offline_mode') === 'true';
    }
};

// Exporter les fonctions API
const api = {
    auth,
    recipes,
    ingredients,
    ai
};

// Rendre l'API disponible globalement
window.api = api;