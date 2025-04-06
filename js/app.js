// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM chargé dans app.js');

    // Fonction pour récupérer un cookie
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    // Attendre que l'API soit chargée - délai plus long pour s'assurer que tout est chargé
    setTimeout(function() {
        console.log('Vérification dans app.js...');

        // Vérifier si l'API est disponible
        if (typeof window.api === 'undefined') {
            console.error('API non disponible dans app.js');
            return; // Ne pas rediriger, laisser index.html gérer cela
        }

        console.log('API disponible dans app.js');

        // Vérifier les tokens dans toutes les sources
        const localStorageToken = localStorage.getItem('token');
        const sessionStorageToken = sessionStorage.getItem('token');
        const cookieToken = getCookie('auth_token');

        console.log('app.js - Token dans localStorage:', localStorageToken ? 'Présent' : 'Absent');
        console.log('app.js - Token dans sessionStorage:', sessionStorageToken ? 'Présent' : 'Absent');
        console.log('app.js - Token dans cookie:', cookieToken ? 'Présent' : 'Absent');

        // Utiliser le premier token disponible
        const token = localStorageToken || sessionStorageToken || cookieToken;

        if (!token) {
            console.log('Pas de token trouvé dans app.js');
            return; // Ne pas rediriger, laisser index.html gérer cela
        }

        console.log('Token trouvé dans app.js, initialisation de l\'application...');

        // Initialisation des données
        initializeApp();
    }, 1000); // Attendre 1000ms pour s'assurer que l'API est chargée

    // Navigation entre les pages
    setupNavigation();

    // Gestion des modales
    setupModals();

    // Gestion du thème sombre/clair
    setupThemeToggle();

    // Initialisation des fonctionnalités spécifiques
    setupRecipesPage();
    setupIngredientsPage();
    setupCalculatorPage();
    setupNewsPage();

    // Configuration de la déconnexion
    setupLogout();
});

// Initialisation de l'application
function initializeApp() {
    // Les données sont déjà chargées depuis l'API et stockées dans window.appData
    console.log('Application initialisée avec les données de l\'API');

    // Vérifier que les données sont bien chargées
    if (window.appData) {
        console.log('Données chargées:', {
            recipes: window.appData.recipes ? window.appData.recipes.length : 0,
            ingredients: window.appData.ingredients ? window.appData.ingredients.length : 0
        });

        if (window.appData.recipes) {
            console.log('Détail des recettes:', window.appData.recipes);
        }

        if (window.appData.ingredients) {
            console.log('Détail des ingrédients:', window.appData.ingredients);
        }

        // Charger les recettes et les ingrédients
        loadRecipes();
        loadIngredients();
        updateIngredientSelectors();

        // Initialiser le calculateur
        setupCalculatorPage();
    } else {
        console.error('Aucune donnée n\'a été chargée depuis l\'API');

        // Essayer de recharger les données
        try {
            Promise.all([
                window.api.recipes.getAll(),
                window.api.ingredients.getAll()
            ]).then(([recipes, ingredients]) => {
                window.appData = {
                    recipes: recipes,
                    ingredients: ingredients
                };

                console.log('Données rechargées avec succès');

                // Charger les recettes et les ingrédients
                loadRecipes();
                loadIngredients();
                updateIngredientSelectors();

                // Initialiser le calculateur
                setupCalculatorPage();
            }).catch(err => {
                console.error('Erreur lors du rechargement des données:', err);
            });
        } catch (error) {
            console.error('Erreur lors de la tentative de rechargement des données:', error);
        }
    }
}

// Configuration de la navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('nav a, .footer-links a, .cta-buttons .btn');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetPage = this.getAttribute('data-page');
            if (!targetPage) return;
            
            // Masquer toutes les pages
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            // Afficher la page cible
            document.getElementById(targetPage).classList.add('active');
            
            // Mettre à jour la navigation
            document.querySelectorAll('nav a').forEach(navLink => {
                navLink.classList.remove('active');
                if (navLink.getAttribute('data-page') === targetPage) {
                    navLink.classList.add('active');
                }
            });
            
            // Faire défiler vers le haut
            window.scrollTo(0, 0);
        });
    });
}

// Configuration des modales
function setupModals() {
    // Boutons pour ouvrir les modales
    const newRecipeBtn = document.getElementById('new-recipe-btn');
    const newIngredientBtn = document.getElementById('new-ingredient-btn');
    
    // Modales
    const recipeModal = document.getElementById('recipe-modal');
    const ingredientModal = document.getElementById('ingredient-modal');
    
    // Boutons pour fermer les modales
    const closeButtons = document.querySelectorAll('.close-modal, #cancel-recipe, #cancel-ingredient');
    
    // Ouvrir la modale de recette
    if (newRecipeBtn) {
        newRecipeBtn.addEventListener('click', function() {
            recipeModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Empêcher le défilement
        });
    }
    
    // Ouvrir la modale d'ingrédient
    if (newIngredientBtn) {
        newIngredientBtn.addEventListener('click', function() {
            ingredientModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Fermer les modales
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            recipeModal.classList.remove('active');
            ingredientModal.classList.remove('active');
            document.body.style.overflow = ''; // Réactiver le défilement
        });
    });
    
    // Fermer les modales en cliquant à l'extérieur
    window.addEventListener('click', function(e) {
        if (e.target === recipeModal) {
            recipeModal.classList.remove('active');
            document.body.style.overflow = '';
        }
        if (e.target === ingredientModal) {
            ingredientModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Empêcher la propagation du clic depuis le contenu de la modale
    const modalContents = document.querySelectorAll('.modal-content');
    modalContents.forEach(content => {
        content.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
    
    // Configuration des formulaires
    setupRecipeForm();
    setupIngredientForm();
}

// Configuration du basculement de thème
function setupThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    
    // Vérifier si un thème est déjà enregistré
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
    
    // Basculer le thème
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        
        if (document.body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            localStorage.setItem('theme', 'light');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    });
}

// Configuration de la page des recettes
function setupRecipesPage() {
    // Recherche et filtrage
    const searchInput = document.querySelector('#recipes .search-bar input');
    const categoryFilter = document.getElementById('category-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterRecipes();
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            filterRecipes();
        });
    }
    
    // Charger les recettes
    loadRecipes();
    
    // Ajouter un gestionnaire d'événements pour les cartes de recettes
    const recipesContainer = document.getElementById('recipes-container');
    if (recipesContainer) {
        recipesContainer.addEventListener('click', function(e) {
            const recipeCard = e.target.closest('.recipe-card');
            if (recipeCard) {
                const recipeId = recipeCard.getAttribute('data-id');
                if (recipeId) {
                    openRecipeDetails(recipeId);
                }
            }
        });
    }
}

// Charger les recettes depuis l'API
function loadRecipes() {
    const recipesContainer = document.getElementById('recipes-container');
    if (!recipesContainer) return;

    // Vider le conteneur
    recipesContainer.innerHTML = '';

    // Utiliser les données de l'API stockées dans window.appData
    if (!window.appData || !window.appData.recipes) return;

    console.log('Chargement des recettes:', window.appData.recipes.length, 'recettes trouvées');
    
    // Créer les cartes de recettes
    window.appData.recipes.forEach(recipe => {
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        recipeCard.setAttribute('data-id', recipe._id);
        recipeCard.setAttribute('data-category', recipe.category);

        // Déterminer l'image (personnalisée ou par défaut)
        let imageStyle = '';
        if (recipe.image) {
            // Utiliser l'image personnalisée
            imageStyle = `background-image: url('${recipe.image}')`;
        } else {
            // Utiliser une image par défaut selon la catégorie
            let imagePath = '';
            switch (recipe.category) {
                case 'patisserie':
                    imagePath = 'images/opera.jpg';
                    break;
                case 'boulangerie':
                    imagePath = 'images/baguette.jpg';
                    break;
                case 'viennoiserie':
                    imagePath = 'images/croissant.jpg';
                    break;
                case 'snacking':
                    imagePath = 'images/snacking.jpg';
                    break;
                default:
                    imagePath = 'images/default-recipe.jpg';
            }
            imageStyle = `background-image: url('${imagePath}')`;
        }

        // Formater le coût par pièce
        const costPerPiece = recipe.costPerPiece.toFixed(2);

        // Formater le temps
        const hours = Math.floor(recipe.time / 60);
        const minutes = recipe.time % 60;
        const timeDisplay = hours > 0
            ? `${hours}h${minutes > 0 ? minutes : ''}`
            : `${minutes}min`;

        // Créer le HTML de la carte
        recipeCard.innerHTML = `
            <div class="recipe-image" style="${imageStyle}"></div>
            <div class="recipe-info">
                <h3>${recipe.name}</h3>
                <p class="recipe-category">${getCategoryName(recipe.category)}</p>
                <div class="recipe-meta">
                    <span><i class="fas fa-euro-sign"></i> ${costPerPiece}€/${recipe.yield.unit === 'pieces' ? 'pièce' : '100g'}</span>
                    <span><i class="fas fa-clock"></i> ${timeDisplay}</span>
                </div>
            </div>
        `;
        
        recipesContainer.appendChild(recipeCard);
    });
}

// Filtrer les recettes
function filterRecipes() {
    const searchInput = document.querySelector('#recipes .search-bar input');
    const categoryFilter = document.getElementById('category-filter');
    const recipeCards = document.querySelectorAll('.recipe-card');
    
    if (!searchInput || !categoryFilter || !recipeCards.length) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const categoryValue = categoryFilter.value;
    
    recipeCards.forEach(card => {
        const recipeName = card.querySelector('h3').textContent.toLowerCase();
        const recipeCategory = card.getAttribute('data-category');
        
        const matchesSearch = recipeName.includes(searchTerm);
        const matchesCategory = categoryValue === '' || recipeCategory === categoryValue;
        
        if (matchesSearch && matchesCategory) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Ouvrir les détails d'une recette
function openRecipeDetails(recipeId) {
    // Utiliser les données de l'API stockées dans window.appData
    if (!window.appData || !window.appData.recipes) return;

    // Trouver la recette
    const recipe = window.appData.recipes.find(r => r._id === recipeId);
    if (!recipe) return;
    
    // Remplir le formulaire de recette
    const recipeForm = document.getElementById('recipe-form');
    if (!recipeForm) return;

    document.getElementById('recipe-name').value = recipe.name;
    document.getElementById('recipe-category').value = recipe.category;
    document.getElementById('recipe-yield-quantity').value = recipe.yield.quantity;
    document.getElementById('recipe-yield-unit').value = recipe.yield.unit;
    document.getElementById('recipe-time').value = recipe.time;
    document.getElementById('recipe-piece-weight').value = recipe.pieceWeight || '';
    document.getElementById('recipe-instructions').value = recipe.instructions;

    if (document.getElementById('recipe-notes')) {
        document.getElementById('recipe-notes').value = recipe.notes || '';
    }

    // Afficher l'image de la recette si elle existe
    const imagePreview = document.getElementById('recipe-image-preview');
    const removeImageBtn = document.getElementById('remove-recipe-image');

    if (imagePreview && removeImageBtn) {
        if (recipe.image) {
            imagePreview.style.backgroundImage = `url('${recipe.image}')`;
            imagePreview.classList.add('has-image');
            removeImageBtn.disabled = false;
            window.recipeImageData = recipe.image;
        } else {
            imagePreview.style.backgroundImage = '';
            imagePreview.classList.remove('has-image');
            removeImageBtn.disabled = true;
            window.recipeImageData = null;
        }
    }
    
    // Remplir les ingrédients
    const ingredientsContainer = document.getElementById('ingredients-container');
    ingredientsContainer.innerHTML = '';
    
    recipe.ingredients.forEach(ingredient => {
        addIngredientRow(ingredient);
    });
    
    // Changer le titre de la modale
    const modalTitle = document.querySelector('#recipe-modal .modal-header h3');
    modalTitle.textContent = 'Modifier la recette';
    
    // Ajouter l'ID de la recette au formulaire
    recipeForm.setAttribute('data-recipe-id', recipe._id);
    
    // Ouvrir la modale
    const recipeModal = document.getElementById('recipe-modal');
    recipeModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Configuration de la page des ingrédients
function setupIngredientsPage() {
    // Recherche et filtrage
    const searchInput = document.querySelector('#ingredients .search-bar input');
    const categoryFilter = document.getElementById('ingredient-category-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterIngredients();
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            filterIngredients();
        });
    }
    
    // Charger les ingrédients
    loadIngredients();
    
    // Ajouter des gestionnaires d'événements pour les boutons d'édition et de suppression
    const ingredientsList = document.getElementById('ingredients-list');
    if (ingredientsList) {
        ingredientsList.addEventListener('click', function(e) {
            if (e.target.closest('.edit-btn')) {
                const row = e.target.closest('tr');
                const ingredientId = row.getAttribute('data-id');
                if (ingredientId) {
                    openIngredientDetails(ingredientId);
                }
            }
            
            if (e.target.closest('.delete-btn')) {
                const row = e.target.closest('tr');
                const ingredientId = row.getAttribute('data-id');
                if (ingredientId) {
                    confirmDeleteIngredient(ingredientId);
                }
            }
        });
    }
}

// Charger les ingrédients depuis l'API
function loadIngredients() {
    const ingredientsList = document.getElementById('ingredients-list');
    if (!ingredientsList) return;

    // Vider la liste
    ingredientsList.innerHTML = '';

    // Utiliser les données de l'API stockées dans window.appData
    if (!window.appData || !window.appData.ingredients) return;

    console.log('Chargement des ingrédients:', window.appData.ingredients.length, 'ingrédients trouvés');

    // Créer les lignes d'ingrédients
    window.appData.ingredients.forEach(ingredient => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', ingredient._id);
        row.setAttribute('data-category', ingredient.category);
        
        row.innerHTML = `
            <td>${ingredient.name}</td>
            <td>${getCategoryName(ingredient.category)}</td>
            <td>${ingredient.price.toFixed(2)}€/${ingredient.unit}</td>
            <td>${ingredient.unit}</td>
            <td>${ingredient.stock}</td>
            <td>
                <button class="btn-icon edit-btn"><i class="fas fa-edit"></i></button>
                <button class="btn-icon delete-btn"><i class="fas fa-trash"></i></button>
            </td>
        `;
        
        ingredientsList.appendChild(row);
    });
}

// Filtrer les ingrédients
function filterIngredients() {
    const searchInput = document.querySelector('#ingredients .search-bar input');
    const categoryFilter = document.getElementById('ingredient-category-filter');
    const ingredientRows = document.querySelectorAll('#ingredients-list tr');
    
    if (!searchInput || !categoryFilter || !ingredientRows.length) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const categoryValue = categoryFilter.value;
    
    ingredientRows.forEach(row => {
        const ingredientName = row.querySelector('td').textContent.toLowerCase();
        const ingredientCategory = row.getAttribute('data-category');
        
        const matchesSearch = ingredientName.includes(searchTerm);
        const matchesCategory = categoryValue === '' || ingredientCategory === categoryValue;
        
        if (matchesSearch && matchesCategory) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Ouvrir les détails d'un ingrédient
function openIngredientDetails(ingredientId) {
    // Utiliser les données de l'API stockées dans window.appData
    if (!window.appData || !window.appData.ingredients) return;

    // Trouver l'ingrédient
    const ingredient = window.appData.ingredients.find(i => i._id === ingredientId);
    if (!ingredient) return;
    
    // Remplir le formulaire d'ingrédient
    const ingredientForm = document.getElementById('ingredient-form');
    if (!ingredientForm) return;
    
    document.getElementById('ingredient-name').value = ingredient.name;
    document.getElementById('ingredient-category').value = ingredient.category;
    document.getElementById('ingredient-price').value = ingredient.price;
    document.getElementById('ingredient-unit').value = ingredient.unit;
    document.getElementById('ingredient-stock').value = ingredient.stock;
    
    if (document.getElementById('ingredient-notes')) {
        document.getElementById('ingredient-notes').value = ingredient.notes || '';
    }
    
    // Mettre à jour l'unité de stock
    document.getElementById('stock-unit').textContent = ingredient.unit;
    
    // Changer le titre de la modale
    const modalTitle = document.querySelector('#ingredient-modal .modal-header h3');
    modalTitle.textContent = 'Modifier un ingrédient';
    
    // Ajouter l'ID de l'ingrédient au formulaire
    ingredientForm.setAttribute('data-ingredient-id', ingredient._id);
    
    // Ouvrir la modale
    const ingredientModal = document.getElementById('ingredient-modal');
    ingredientModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Confirmer la suppression d'un ingrédient
function confirmDeleteIngredient(ingredientId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet ingrédient ?')) {
        deleteIngredient(ingredientId);
    }
}

// Supprimer un ingrédient
async function deleteIngredient(ingredientId) {
    try {
        // Supprimer l'ingrédient via l'API
        await window.api.ingredients.delete(ingredientId);

        // Recharger les données depuis l'API
        const freshIngredients = await window.api.ingredients.getAll();
        window.appData.ingredients = freshIngredients;

        // Recharger la liste des ingrédients
        loadIngredients();

        // Mettre à jour les sélecteurs d'ingrédients dans le formulaire de recette
        updateIngredientSelectors();

        // Afficher un message de succès
        console.log('Ingrédient supprimé avec succès');
        alert('Ingrédient supprimé avec succès');
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'ingrédient:', error);
        alert('Erreur lors de la suppression de l\'ingrédient. Veuillez réessayer.');
    }
}

// Configuration du formulaire de recette
function setupRecipeForm() {
    const recipeForm = document.getElementById('recipe-form');
    const addIngredientBtn = document.getElementById('add-ingredient');

    if (addIngredientBtn) {
        addIngredientBtn.addEventListener('click', function() {
            addIngredientRow();
        });
    }

    // Gestion de l'upload d'image
    setupImageUpload();

    if (recipeForm) {
        // Gérer la soumission du formulaire
        recipeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveRecipe();
        });

        // Gérer la suppression d'ingrédients
        const ingredientsContainer = document.getElementById('ingredients-container');
        if (ingredientsContainer) {
            ingredientsContainer.addEventListener('click', function(e) {
                if (e.target.closest('.remove-ingredient')) {
                    const row = e.target.closest('.ingredient-row');
                    row.remove();
                }
            });
        }

        // Mettre à jour l'unité de stock en fonction de l'unité sélectionnée
        const ingredientUnitSelect = document.getElementById('ingredient-unit');
        if (ingredientUnitSelect) {
            ingredientUnitSelect.addEventListener('change', function() {
                document.getElementById('stock-unit').textContent = this.value;
            });
        }
    }
}

// Configuration de l'upload d'image
function setupImageUpload() {
    const imageUpload = document.getElementById('recipe-image-upload');
    const imagePreview = document.getElementById('recipe-image-preview');
    const removeImageBtn = document.getElementById('remove-recipe-image');

    if (imageUpload && imagePreview && removeImageBtn) {
        // Gérer le téléchargement d'image
        imageUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();

                reader.onload = function(event) {
                    imagePreview.style.backgroundImage = `url('${event.target.result}')`;
                    imagePreview.classList.add('has-image');
                    removeImageBtn.disabled = false;

                    // Stocker l'image en base64
                    window.recipeImageData = event.target.result;
                };

                reader.readAsDataURL(file);
            }
        });

        // Gérer la suppression d'image
        removeImageBtn.addEventListener('click', function() {
            imagePreview.style.backgroundImage = '';
            imagePreview.classList.remove('has-image');
            imageUpload.value = '';
            removeImageBtn.disabled = true;
            window.recipeImageData = null;
        });
    }
}

// Ajouter une ligne d'ingrédient au formulaire de recette
function addIngredientRow(ingredientData = null) {
    const ingredientsContainer = document.getElementById('ingredients-container');
    if (!ingredientsContainer) return;
    
    // Utiliser les données de l'API stockées dans window.appData
    if (!window.appData || !window.appData.ingredients) return;
    
    // Créer une nouvelle ligne
    const row = document.createElement('div');
    row.className = 'ingredient-row';
    
    // Créer le sélecteur d'ingrédients
    const select = document.createElement('select');
    select.className = 'ingredient-select';
    
    // Option par défaut
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Sélectionner un ingrédient';
    select.appendChild(defaultOption);
    
    // Ajouter les options d'ingrédients
    window.appData.ingredients.forEach(ingredient => {
        const option = document.createElement('option');
        option.value = ingredient._id;
        option.textContent = ingredient.name;
        select.appendChild(option);
    });
    
    // Créer le champ de quantité
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.className = 'ingredient-quantity';
    quantityInput.min = '0';
    quantityInput.step = '0.01';
    quantityInput.placeholder = 'Quantité';
    
    // Créer le sélecteur d'unité
    const unitSelect = document.createElement('select');
    unitSelect.className = 'ingredient-unit';
    
    const units = [
        { value: 'g', text: 'g' },
        { value: 'kg', text: 'kg' },
        { value: 'ml', text: 'ml' },
        { value: 'l', text: 'l' },
        { value: 'pcs', text: 'pcs' }
    ];
    
    units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit.value;
        option.textContent = unit.text;
        unitSelect.appendChild(option);
    });
    
    // Créer le bouton de suppression
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-ingredient btn-icon';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    
    // Ajouter les éléments à la ligne
    row.appendChild(select);
    row.appendChild(quantityInput);
    row.appendChild(unitSelect);
    row.appendChild(removeBtn);
    
    // Si des données d'ingrédient sont fournies, les utiliser
    if (ingredientData) {
        select.value = ingredientData.id; // Utiliser l'ID MongoDB
        quantityInput.value = ingredientData.quantity;
        unitSelect.value = ingredientData.unit;

        console.log('Valeur du sélecteur d\'ingrédient:', select.value);
    }
    
    // Ajouter la ligne au conteneur
    ingredientsContainer.appendChild(row);
}

// Sauvegarder une recette
async function saveRecipe() {
    try {
        // Récupérer les données du formulaire
        const recipeForm = document.getElementById('recipe-form');
        const recipeId = recipeForm.getAttribute('data-recipe-id');

        const name = document.getElementById('recipe-name').value;
        const category = document.getElementById('recipe-category').value;
        const yieldQuantity = parseFloat(document.getElementById('recipe-yield-quantity').value);
        const yieldUnit = document.getElementById('recipe-yield-unit').value;
        const time = parseInt(document.getElementById('recipe-time').value);
        const pieceWeightInput = document.getElementById('recipe-piece-weight').value;
        const instructions = document.getElementById('recipe-instructions').value;
        const notes = document.getElementById('recipe-notes') ? document.getElementById('recipe-notes').value : '';

        // Récupérer l'image si elle existe
        const imageData = window.recipeImageData || null;

        // Récupérer les ingrédients
        const ingredientRows = document.querySelectorAll('.ingredient-row');
        const ingredients = [];
        let totalCost = 0;

        // Calculer le poids total en fonction du poids par pièce et du nombre de pièces
        let pieceWeight = pieceWeightInput ? parseInt(pieceWeightInput) : 0;
        let totalWeight = 0;

        // Si le poids par pièce est défini et que l'unité est en pièces, calculer le poids total
        if (pieceWeight > 0 && yieldUnit === 'pieces') {
            totalWeight = pieceWeight * yieldQuantity;
        } else {
            // Sinon, calculer le poids total à partir des ingrédients
            totalWeight = 0; // Sera calculé à partir des ingrédients
        }

        // Récupérer les données des ingrédients depuis l'API
        const ingredientsList = window.appData.ingredients;

    ingredientRows.forEach(row => {
        const ingredientId = row.querySelector('.ingredient-select').value;
        if (!ingredientId) return; // Ignorer les lignes sans ingrédient sélectionné

        const quantity = parseFloat(row.querySelector('.ingredient-quantity').value);
        const unit = row.querySelector('.ingredient-unit').value;

        // Trouver l'ingrédient dans les données
        const ingredientData = ingredientsList.find(i => i._id == ingredientId);
        if (!ingredientData) return;

        // Calculer le coût
        let cost = 0;
        if (unit === ingredientData.unit) {
            cost = quantity * ingredientData.price;
        } else {
            // Conversion d'unités
            switch (unit) {
                case 'g':
                    if (ingredientData.unit === 'kg') {
                        cost = (quantity / 1000) * ingredientData.price;
                    }
                    break;
                case 'kg':
                    if (ingredientData.unit === 'g') {
                        cost = (quantity * 1000) * ingredientData.price;
                    }
                    break;
                case 'ml':
                    if (ingredientData.unit === 'l') {
                        cost = (quantity / 1000) * ingredientData.price;
                    }
                    break;
                case 'l':
                    if (ingredientData.unit === 'ml') {
                        cost = (quantity * 1000) * ingredientData.price;
                    }
                    break;
            }
        }

        // Si le poids par pièce n'est pas spécifié, calculer le poids total à partir des ingrédients
        if (pieceWeight === 0) {
            // Calculer le poids total (approximatif)
            if (unit === 'g' || unit === 'ml') {
                totalWeight += quantity;
            } else if (unit === 'kg' || unit === 'l') {
                totalWeight += quantity * 1000;
            } else if (unit === 'pcs') {
                // Estimation du poids par pièce (à ajuster selon les besoins)
                totalWeight += quantity * 50;
            }
        }

        totalCost += cost;

        ingredients.push({
            id: ingredientId,
            name: ingredientData.name,
            quantity: quantity,
            unit: unit,
            price: ingredientData.price,
            pricePerUnit: ingredientData.price,
            cost: cost
        });
    });

    // Calculer le coût par pièce
    const costPerPiece = yieldUnit === 'pieces'
        ? totalCost / yieldQuantity
        : totalCost / (yieldQuantity / 100);

    // Créer l'objet recette
    const recipe = {
        name: name,
        category: category,
        yield: { quantity: yieldQuantity, unit: yieldUnit },
        time: time,
        ingredients: ingredients,
        instructions: instructions,
        notes: notes,
        totalCost: totalCost,
        costPerPiece: costPerPiece,
        totalWeight: totalWeight,
        pieceWeight: pieceWeight,
        image: imageData // Ajouter l'image à la recette
    };
    
    // Mettre à jour ou créer la recette via l'API
        let savedRecipe;

        if (recipeId) {
            // Mettre à jour une recette existante
            savedRecipe = await window.api.recipes.update(recipeId, recipe);
        } else {
            // Créer une nouvelle recette
            savedRecipe = await window.api.recipes.create(recipe);
        }

        // Mettre à jour les données locales
        if (recipeId) {
            // Trouver l'index de la recette
            const recipeIndex = window.appData.recipes.findIndex(r => r._id === recipeId);
            if (recipeIndex !== -1) {
                window.appData.recipes[recipeIndex] = savedRecipe;
            }
        } else {
            // Ajouter la nouvelle recette
            window.appData.recipes.push(savedRecipe);
        }

        // Fermer la modale
        document.getElementById('recipe-modal').classList.remove('active');
        document.body.style.overflow = '';

        // Recharger les données depuis l'API
        const freshRecipes = await window.api.recipes.getAll();
        window.appData.recipes = freshRecipes;

        // Recharger l'affichage des recettes
        loadRecipes();

        // Afficher un message de succès
        console.log('Recette sauvegardée avec succès');
        alert('Recette sauvegardée avec succès');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la recette:', error);
        alert('Erreur lors de la sauvegarde de la recette. Veuillez réessayer.');
    }
}

// Configuration du formulaire d'ingrédient
function setupIngredientForm() {
    const ingredientForm = document.getElementById('ingredient-form');
    
    if (ingredientForm) {
        // Gérer la soumission du formulaire
        ingredientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveIngredient();
        });
        
        // Mettre à jour l'unité de stock en fonction de l'unité sélectionnée
        const ingredientUnitSelect = document.getElementById('ingredient-unit');
        if (ingredientUnitSelect) {
            ingredientUnitSelect.addEventListener('change', function() {
                document.getElementById('stock-unit').textContent = this.value;
            });
        }
    }
}

// Sauvegarder un ingrédient
async function saveIngredient() {
    try {
        // Récupérer les données du formulaire
        const ingredientForm = document.getElementById('ingredient-form');
        const ingredientId = ingredientForm.getAttribute('data-ingredient-id');

        const name = document.getElementById('ingredient-name').value;
        const category = document.getElementById('ingredient-category').value;
        const price = parseFloat(document.getElementById('ingredient-price').value);
        const unit = document.getElementById('ingredient-unit').value;
        const stock = parseFloat(document.getElementById('ingredient-stock').value);
        const notes = document.getElementById('ingredient-notes') ? document.getElementById('ingredient-notes').value : '';

        // Créer l'objet ingrédient
        const ingredient = {
            name: name,
            category: category,
            price: price,
            unit: unit,
            stock: stock,
            notes: notes
        };

        // Mettre à jour ou créer l'ingrédient via l'API
        let savedIngredient;

        if (ingredientId) {
            // Mettre à jour un ingrédient existant
            savedIngredient = await window.api.ingredients.update(ingredientId, ingredient);
        } else {
            // Créer un nouvel ingrédient
            savedIngredient = await window.api.ingredients.create(ingredient);
        }

        // Mettre à jour les données locales
        if (ingredientId) {
            // Trouver l'index de l'ingrédient
            const ingredientIndex = window.appData.ingredients.findIndex(i => i._id === ingredientId);
            if (ingredientIndex !== -1) {
                window.appData.ingredients[ingredientIndex] = savedIngredient;
            }
        } else {
            // Ajouter le nouvel ingrédient
            window.appData.ingredients.push(savedIngredient);
        }

        // Fermer la modale
        document.getElementById('ingredient-modal').classList.remove('active');
        document.body.style.overflow = '';

        // Recharger les données depuis l'API
        const freshIngredients = await window.api.ingredients.getAll();
        window.appData.ingredients = freshIngredients;

        // Recharger l'affichage des ingrédients
        loadIngredients();

        // Mettre à jour les sélecteurs d'ingrédients dans le formulaire de recette
        updateIngredientSelectors();

        // Afficher un message de succès
        console.log('Ingrédient sauvegardé avec succès');
        alert('Ingrédient sauvegardé avec succès');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'ingrédient:', error);
        alert('Erreur lors de la sauvegarde de l\'ingrédient. Veuillez réessayer.');
    }
}

// Mettre à jour les sélecteurs d'ingrédients dans le formulaire de recette
function updateIngredientSelectors() {
    const ingredientSelects = document.querySelectorAll('.ingredient-select');
    if (!ingredientSelects.length) return;

    // Utiliser les données de l'API stockées dans window.appData
    if (!window.appData || !window.appData.ingredients) return;

    ingredientSelects.forEach(select => {
        const selectedValue = select.value;

        // Vider le sélecteur
        select.innerHTML = '';

        // Option par défaut
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Sélectionner un ingrédient';
        select.appendChild(defaultOption);

        // Ajouter les options d'ingrédients
        window.appData.ingredients.forEach(ingredient => {
            const option = document.createElement('option');
            option.value = ingredient._id;
            option.textContent = ingredient.name;
            select.appendChild(option);
        });

        // Restaurer la valeur sélectionnée
        select.value = selectedValue;
    });
}

// Configuration de la page calculateur
function setupCalculatorPage() {
    console.log('Initialisation de la page calculateur');

    // Vérifier que les données sont chargées
    if (!window.appData || !window.appData.recipes) {
        console.error('Les données des recettes ne sont pas disponibles');
        // Essayer de charger les données
        try {
            window.api.recipes.getAll().then(recipes => {
                console.log('Recettes rechargées:', recipes);
                window.appData = window.appData || {};
                window.appData.recipes = recipes;
                // Charger les recettes dans le sélecteur
                loadRecipeOptions();
            }).catch(err => {
                console.error('Erreur lors du rechargement des recettes:', err);
            });
        } catch (error) {
            console.error('Erreur lors de la tentative de rechargement des recettes:', error);
        }
    }

    // Sélecteur de recette
    const recipeSelect = document.getElementById('recipe-select');
    if (recipeSelect) {
        // Charger les recettes dans le sélecteur
        loadRecipeOptions();

        // Gérer le changement de recette
        recipeSelect.addEventListener('change', function() {
            const recipeId = this.value;
            console.log('Recette sélectionnée:', recipeId);

            if (recipeId) {
                loadRecipeForCalculator(recipeId);
            } else {
                clearCalculator();
            }
        });
    } else {
        console.error('Sélecteur de recette non trouvé');
    }
    
    // Boutons d'ajustement
    const applyMultiplyBtn = document.getElementById('apply-multiply');
    const applyPiecesBtn = document.getElementById('apply-pieces');
    const applyPieceWeightBtn = document.getElementById('apply-piece-weight');
    const applyWeightBtn = document.getElementById('apply-weight');

    if (applyMultiplyBtn) {
        applyMultiplyBtn.addEventListener('click', function() {
            const factor = parseFloat(document.getElementById('multiply-factor').value);
            if (factor > 0) {
                adjustRecipeByFactor(factor);
            }
        });
    }

    if (applyPiecesBtn) {
        applyPiecesBtn.addEventListener('click', function() {
            const pieces = parseInt(document.getElementById('pieces-count').value);
            if (pieces > 0) {
                adjustRecipeByPieces(pieces);
            }
        });
    }

    if (applyPieceWeightBtn) {
        applyPieceWeightBtn.addEventListener('click', function() {
            const pieceWeight = parseInt(document.getElementById('piece-weight').value);
            if (pieceWeight > 0) {
                adjustRecipeByPieceWeight(pieceWeight);
            }
        });
    }

    if (applyWeightBtn) {
        applyWeightBtn.addEventListener('click', function() {
            const weight = parseInt(document.getElementById('total-weight').value);
            if (weight > 0) {
                adjustRecipeByWeight(weight);
            }
        });
    }
    
    // Calculateur de prix de vente
    const updatePriceBtn = document.getElementById('update-price');
    if (updatePriceBtn) {
        updatePriceBtn.addEventListener('click', function() {
            updateSuggestedPrice();
        });
    }
}

// Charger les options de recettes dans le sélecteur
function loadRecipeOptions() {
    console.log('Fonction loadRecipeOptions appelée');

    const recipeSelect = document.getElementById('recipe-select');
    if (!recipeSelect) {
        console.error('Sélecteur de recette non trouvé dans loadRecipeOptions');
        return;
    }

    // Vider le sélecteur
    recipeSelect.innerHTML = '';

    // Option par défaut
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Choisir une recette';
    recipeSelect.appendChild(defaultOption);

    // Utiliser les données de l'API stockées dans window.appData
    if (!window.appData) {
        console.error('window.appData n\'est pas défini');
        return;
    }

    if (!window.appData.recipes) {
        console.error('window.appData.recipes n\'est pas défini');
        return;
    }

    console.log('Chargement des options de recettes:', window.appData.recipes.length, 'recettes trouvées');
    console.log('Recettes disponibles:', window.appData.recipes);

    // Ajouter les options de recettes
    window.appData.recipes.forEach(recipe => {
        console.log('Ajout de la recette au sélecteur:', recipe.name, 'avec ID:', recipe._id);
        const option = document.createElement('option');
        option.value = recipe._id;
        option.textContent = recipe.name;
        recipeSelect.appendChild(option);
    });

    console.log('Nombre d\'options dans le sélecteur après chargement:', recipeSelect.options.length);
}

// Charger une recette pour le calculateur
function loadRecipeForCalculator(recipeId) {
    console.log('Fonction loadRecipeForCalculator appelée avec ID:', recipeId);

    // Utiliser les données de l'API stockées dans window.appData
    if (!window.appData) {
        console.error('window.appData n\'est pas défini');
        return;
    }

    if (!window.appData.recipes) {
        console.error('window.appData.recipes n\'est pas défini');
        return;
    }

    console.log('Chargement de la recette pour le calculateur, ID:', recipeId);
    console.log('Recettes disponibles:', window.appData.recipes);

    // Trouver la recette
    const recipe = window.appData.recipes.find(r => r._id === recipeId);
    if (!recipe) {
        console.error('Recette non trouvée avec l\'ID:', recipeId);

        // Essayer de charger la recette directement depuis l'API
        try {
            window.api.recipes.getById(recipeId).then(loadedRecipe => {
                console.log('Recette chargée directement depuis l\'API:', loadedRecipe);
                if (loadedRecipe) {
                    // Stocker la recette dans window.currentRecipe
                    window.currentRecipe = JSON.parse(JSON.stringify(loadedRecipe));

                    // Mettre à jour les champs d'ajustement
                    document.getElementById('multiply-factor').value = 1;
                    document.getElementById('pieces-count').value = loadedRecipe.yield.quantity;

                    // Initialiser le poids par pièce
                    const pieceWeightInput = document.getElementById('piece-weight');
                    if (pieceWeightInput) {
                        if (loadedRecipe.pieceWeight && loadedRecipe.yield.unit === 'pieces') {
                            pieceWeightInput.value = loadedRecipe.pieceWeight;
                        } else if (loadedRecipe.totalWeight && loadedRecipe.yield.unit === 'pieces') {
                            // Calculer le poids par pièce si non défini
                            const calculatedPieceWeight = Math.round(loadedRecipe.totalWeight / loadedRecipe.yield.quantity);
                            pieceWeightInput.value = calculatedPieceWeight;
                        } else {
                            pieceWeightInput.value = 0;
                        }
                    }

                    // Utiliser le poids total calculé à partir du poids par pièce si disponible
                    if (loadedRecipe.pieceWeight && loadedRecipe.yield.unit === 'pieces') {
                        const calculatedTotalWeight = loadedRecipe.pieceWeight * loadedRecipe.yield.quantity;
                        document.getElementById('total-weight').value = calculatedTotalWeight;
                    } else {
                        document.getElementById('total-weight').value = loadedRecipe.totalWeight;
                    }

                    // Afficher les ingrédients
                    displayRecipeIngredients(loadedRecipe);

                    // Mettre à jour le résumé des coûts
                    updateCostSummary(loadedRecipe);
                }
            }).catch(err => {
                console.error('Erreur lors du chargement direct de la recette:', err);
            });
        } catch (error) {
            console.error('Erreur lors de la tentative de chargement direct de la recette:', error);
        }
        return;
    }

    console.log('Recette trouvée:', recipe);
    
    // Stocker la recette originale dans une variable globale temporaire
    window.currentRecipe = JSON.parse(JSON.stringify(recipe));
    
    // Mettre à jour les champs d'ajustement
    document.getElementById('multiply-factor').value = 1;
    document.getElementById('pieces-count').value = recipe.yield.quantity;

    // Initialiser le poids par pièce
    const pieceWeightInput = document.getElementById('piece-weight');
    if (pieceWeightInput) {
        if (recipe.pieceWeight && recipe.yield.unit === 'pieces') {
            pieceWeightInput.value = recipe.pieceWeight;
        } else if (recipe.totalWeight && recipe.yield.unit === 'pieces') {
            // Calculer le poids par pièce si non défini
            const calculatedPieceWeight = Math.round(recipe.totalWeight / recipe.yield.quantity);
            pieceWeightInput.value = calculatedPieceWeight;
        } else {
            pieceWeightInput.value = 0;
        }
    }

    // Utiliser le poids total calculé à partir du poids par pièce si disponible
    if (recipe.pieceWeight && recipe.yield.unit === 'pieces') {
        const calculatedTotalWeight = recipe.pieceWeight * recipe.yield.quantity;
        document.getElementById('total-weight').value = calculatedTotalWeight;
    } else {
        document.getElementById('total-weight').value = recipe.totalWeight;
    }
    
    // Afficher les ingrédients
    displayRecipeIngredients(recipe);
    
    // Mettre à jour le résumé des coûts
    updateCostSummary(recipe);
}

// Afficher les ingrédients d'une recette
function displayRecipeIngredients(recipe) {
    const ingredientsList = document.getElementById('recipe-ingredients-list');
    if (!ingredientsList) return;
    
    // Vider la liste
    ingredientsList.innerHTML = '';
    
    // Ajouter les ingrédients
    recipe.ingredients.forEach(ingredient => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${ingredient.name}</td>
            <td>${ingredient.quantity}${ingredient.unit}</td>
            <td>${ingredient.cost ? ingredient.cost.toFixed(2) : (ingredient.quantity * ingredient.pricePerUnit).toFixed(2)}€</td>
        `;
        
        ingredientsList.appendChild(row);
    });
    
    // Mettre à jour le coût total
    const totalCostElement = document.getElementById('ingredients-total-cost');
    if (totalCostElement) {
        totalCostElement.textContent = `${recipe.totalCost.toFixed(2)}€`;
    }
}

// Mettre à jour le résumé des coûts
function updateCostSummary(recipe) {
    // Coût total des ingrédients
    document.getElementById('summary-ingredients-cost').textContent = `${recipe.totalCost.toFixed(2)}€`;
    
    // Coût par pièce
    const costPerPiece = document.getElementById('cost-per-piece');
    if (recipe.yield.unit === 'pieces') {
        // Déterminer le poids par pièce
        let pieceWeight = recipe.pieceWeight || 0;
        if (!pieceWeight && recipe.totalWeight) {
            pieceWeight = Math.round(recipe.totalWeight / recipe.yield.quantity);
        }

        // Mettre à jour le texte pour inclure le nombre de pièces et le poids par pièce
        const piecesLabel = document.querySelector('.cost-item:nth-child(2) .cost-label');
        if (piecesLabel) {
            if (pieceWeight > 0) {
                piecesLabel.textContent = `Coût par pièce (${recipe.yield.quantity} pièces de ${pieceWeight}g):`;
            } else {
                piecesLabel.textContent = `Coût par pièce (${recipe.yield.quantity} pièces):`;
            }
        }

        // Calculer le coût par pièce
        const calculatedCostPerPiece = recipe.totalCost / recipe.yield.quantity;
        costPerPiece.textContent = `${calculatedCostPerPiece.toFixed(2)}€`;
    } else {
        costPerPiece.textContent = 'N/A';
    }

    // Coût par 100g
    const costPer100g = document.getElementById('cost-per-100g');

    // Calculer le poids total en fonction du poids par pièce si disponible
    let totalWeight = recipe.totalWeight;
    if (recipe.pieceWeight && recipe.yield.unit === 'pieces') {
        totalWeight = recipe.pieceWeight * recipe.yield.quantity;
    }

    // Mettre à jour le texte pour inclure le poids total
    const weightLabel = document.querySelector('.cost-item:nth-child(3) .cost-label');
    if (weightLabel) {
        weightLabel.textContent = `Coût par 100g (${totalWeight}g total):`;
    }

    // Calculer le coût par 100g
    if (totalWeight > 0) {
        costPer100g.textContent = `${(recipe.totalCost / (totalWeight / 100)).toFixed(2)}€`;
    } else {
        costPer100g.textContent = 'N/A';
    }
    
    // Prix de vente suggéré
    updateSuggestedPrice();
}

// Mettre à jour le prix de vente suggéré
function updateSuggestedPrice() {
    if (!window.currentRecipe) return;
    
    const marginPercentage = parseInt(document.getElementById('margin-percentage').value);
    const costPerPiece = window.currentRecipe.costPerPiece;
    
    const suggestedPrice = costPerPiece / (1 - (marginPercentage / 100));
    
    document.getElementById('suggested-price').textContent = `${suggestedPrice.toFixed(2)}€`;
    document.getElementById('calculated-price').textContent = `${suggestedPrice.toFixed(2)}€`;
}

// Ajuster la recette par un facteur multiplicateur
function adjustRecipeByFactor(factor) {
    if (!window.currentRecipe) return;
    
    const recipe = JSON.parse(JSON.stringify(window.currentRecipe));
    
    // Ajuster les quantités et les coûts
    recipe.ingredients.forEach(ingredient => {
        ingredient.quantity *= factor;
        if (ingredient.cost) {
            ingredient.cost *= factor;
        }
    });
    
    // Ajuster les rendements
    recipe.yield.quantity *= factor;
    recipe.totalCost *= factor;
    recipe.totalWeight *= factor;

    // Ajuster le poids par pièce (qui reste constant)
    if (window.currentRecipe.pieceWeight) {
        recipe.pieceWeight = window.currentRecipe.pieceWeight;
    }
    
    // Afficher la recette ajustée
    displayRecipeIngredients(recipe);
    updateCostSummary(recipe);
    
    // Mettre à jour les champs d'ajustement
    document.getElementById('pieces-count').value = recipe.yield.quantity;
    document.getElementById('total-weight').value = recipe.totalWeight;
}

// Ajuster la recette pour un nombre de pièces spécifique
function adjustRecipeByPieces(pieces) {
    if (!window.currentRecipe || window.currentRecipe.yield.unit !== 'pieces') return;
    
    const factor = pieces / window.currentRecipe.yield.quantity;
    adjustRecipeByFactor(factor);
}

// Ajuster la recette pour un poids total spécifique
function adjustRecipeByWeight(weight) {
    if (!window.currentRecipe) return;

    const factor = weight / window.currentRecipe.totalWeight;
    adjustRecipeByFactor(factor);
}

// Ajuster la recette en fonction du poids par pièce
function adjustRecipeByPieceWeight(pieceWeight) {
    if (!window.currentRecipe || window.currentRecipe.yield.unit !== 'pieces') return;

    // Mettre à jour le poids par pièce dans la recette courante
    const recipe = JSON.parse(JSON.stringify(window.currentRecipe));
    recipe.pieceWeight = pieceWeight;

    // Calculer le nouveau poids total
    const newTotalWeight = pieceWeight * recipe.yield.quantity;

    // Mettre à jour le poids total
    recipe.totalWeight = newTotalWeight;

    // Mettre à jour le champ de poids total
    document.getElementById('total-weight').value = newTotalWeight;

    // Afficher la recette ajustée
    displayRecipeIngredients(recipe);
    updateCostSummary(recipe);
}

// Vider le calculateur
function clearCalculator() {
    // Réinitialiser la recette courante
    window.currentRecipe = null;
    
    // Vider la liste des ingrédients
    const ingredientsList = document.getElementById('recipe-ingredients-list');
    if (ingredientsList) {
        ingredientsList.innerHTML = '';
    }
    
    // Réinitialiser les coûts
    document.getElementById('ingredients-total-cost').textContent = '0.00€';
    document.getElementById('summary-ingredients-cost').textContent = '0.00€';
    document.getElementById('cost-per-piece').textContent = '0.00€';
    document.getElementById('cost-per-100g').textContent = '0.00€';
    document.getElementById('suggested-price').textContent = '0.00€';
    document.getElementById('calculated-price').textContent = '0.00€';
    
    // Réinitialiser les champs d'ajustement
    document.getElementById('multiply-factor').value = 1;
    document.getElementById('pieces-count').value = 0;
    document.getElementById('piece-weight').value = 0;
    document.getElementById('total-weight').value = 0;
}

// Configuration de la page nouveautés
function setupNewsPage() {
    // Réinitialiser le mode hors ligne et le compteur d'erreurs au chargement de la page
    localStorage.removeItem('ai_offline_mode');
    localStorage.removeItem('ai_offline_mode_auto');
    localStorage.removeItem('ai_error_count');
    console.log('Mode IA réinitialisé au chargement de la page - mode en ligne activé');

    // Bouton de génération d'idée
    const generateIdeaBtn = document.getElementById('generate-idea');
    if (generateIdeaBtn) {
        generateIdeaBtn.addEventListener('click', function() {
            generateRecipeIdea();
        });
    }

    // Bouton pour activer/désactiver le mode hors ligne
    const offlineModeToggle = document.getElementById('toggle-offline-mode');
    if (offlineModeToggle) {
        // Initialiser l'état du bouton
        const isOffline = window.api.ai.isOfflineMode();
        offlineModeToggle.textContent = isOffline ? 'Activer l\'IA en ligne' : 'Utiliser les suggestions locales';
        offlineModeToggle.classList.toggle('offline', isOffline);

        // Ajouter l'événement de clic
        offlineModeToggle.addEventListener('click', function() {
            const currentMode = window.api.ai.isOfflineMode();
            const newMode = !currentMode;

            // Mettre à jour le mode
            window.api.ai.toggleOfflineMode(newMode);

            // Mettre à jour le texte et la classe du bouton
            this.textContent = newMode ? 'Activer l\'IA en ligne' : 'Utiliser les suggestions locales';
            this.classList.toggle('offline', newMode);

            // Afficher un message à l'utilisateur
            const resultCard = document.querySelector('.result-card');
            if (resultCard) {
                resultCard.innerHTML = `
                    <div class="info-message">
                        <i class="fas ${newMode ? 'fa-lightbulb' : 'fa-robot'}"></i>
                        <p>Mode ${newMode ? 'hors ligne' : 'en ligne'} activé. ${newMode ? 'Les suggestions seront générées localement.' : 'Les idées seront générées par l\'IA Gemini.'}</p>
                    </div>
                `;
            }
        });
    }

    // Boutons d'action pour les idées générées
    const saveInspirationBtn = document.getElementById('save-inspiration');
    const createFromInspirationBtn = document.getElementById('create-from-inspiration');

    if (saveInspirationBtn) {
        saveInspirationBtn.addEventListener('click', function() {
            saveInspiration();
        });
    }

    if (createFromInspirationBtn) {
        createFromInspirationBtn.addEventListener('click', function() {
            createRecipeFromInspiration();
        });
    }
}

// Configuration de la déconnexion
function setupLogout() {
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();

            // Déconnecter l'utilisateur
            window.api.auth.logout();

            // Rediriger vers la page de connexion
            window.location.href = 'login.html';
        });
    }
}

// Générer une idée de recette avec l'IA
async function generateRecipeIdea() {
    // Récupérer les paramètres de l'utilisateur
    const creationType = document.getElementById('creation-type').value;
    const keyIngredients = document.getElementById('key-ingredients').value;
    const occasion = document.getElementById('occasion-type').value;
    const currentMonth = new Date().getMonth() + 1; // 1-12

    // Afficher un indicateur de chargement
    const resultCard = document.querySelector('.result-card');
    if (resultCard) {
        resultCard.innerHTML = `
            <div class="loading-indicator">
                <div class="spinner"></div>
                <p>Génération d'une idée en cours avec l'IA...</p>
            </div>
        `;
    }

    try {
        console.log('Appel à l\'API Gemini pour générer une idée de recette...');

        let randomIdea;
        let isFromAPI = true; // Par défaut, on suppose que l'idée vient de l'API

        try {
            // Réinitialiser le mode hors ligne si activé automatiquement
            if (localStorage.getItem('ai_offline_mode') === 'true' &&
                localStorage.getItem('ai_offline_mode_auto') === 'true') {
                console.log('Tentative de réactiver le mode en ligne');
                localStorage.setItem('ai_offline_mode', 'false');
                localStorage.setItem('ai_error_count', '0');
            }

            // Appeler l'API Gemini via notre serveur
            randomIdea = await window.api.ai.generateRecipeIdea({
                creationType,
                keyIngredients,
                occasion,
                currentMonth
            });

            console.log('Idée générée par l\'IA:', randomIdea);

            // Vérifier si l'idée a été générée en mode hors ligne côté serveur
            if (randomIdea.offline) {
                console.log('Idée générée en mode hors ligne côté serveur:', randomIdea.message);
                isFromAPI = false;
            }
        } catch (apiError) {
            console.error('Erreur API Gemini:', apiError);

            // En cas d'erreur avec l'API, utiliser une idée de recette de secours
            console.log('Utilisation d\'une idée de recette de secours...');

            // Générer une idée de secours basée sur le type de création
            randomIdea = generateFallbackRecipeIdea(creationType, occasion, currentMonth);
            isFromAPI = false; // L'idée vient du système de secours
        }

        // Afficher l'idée générée
        if (resultCard && randomIdea) {
            // Utiliser la variable isFromAPI pour déterminer la source de l'idée

            resultCard.innerHTML = `
                <div class="result-header">
                    <h4>${randomIdea.title}</h4>
                    <span class="result-tag">${getCategoryName(creationType)}</span>
                    <span class="ai-badge ${isFromAPI ? 'ai-online' : 'ai-offline'}">
                        <i class="fas ${isFromAPI ? 'fa-robot' : 'fa-lightbulb'}"></i>
                        ${isFromAPI ? 'Généré par Gemini' : 'Suggestion locale'}
                    </span>
                </div>
                <div class="result-content">
                    <p>${randomIdea.description}</p>
                    <h5>Ingrédients principaux:</h5>
                    <ul>
                        ${randomIdea.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                    </ul>
                    <h5>Technique signature:</h5>
                    <p>${randomIdea.technique}</p>
                </div>
                <div class="result-actions">
                    <button class="btn secondary" id="save-inspiration">Sauvegarder l'idée</button>
                    <button class="btn outline" id="create-from-inspiration">Créer une recette</button>
                    <button class="btn primary" id="regenerate-idea">Générer une nouvelle idée</button>
                </div>
            `;

            // Ajouter des gestionnaires d'événements pour les boutons
            const saveInspirationBtn = document.getElementById('save-inspiration');
            const createFromInspirationBtn = document.getElementById('create-from-inspiration');
            const regenerateIdeaBtn = document.getElementById('regenerate-idea');

            if (saveInspirationBtn) {
                saveInspirationBtn.addEventListener('click', function() {
                    saveInspiration();
                });
            }

            if (createFromInspirationBtn) {
                createFromInspirationBtn.addEventListener('click', function() {
                    createRecipeFromInspiration();
                });
            }

            if (regenerateIdeaBtn) {
                regenerateIdeaBtn.addEventListener('click', function() {
                    generateRecipeIdea();
                });
            }

            // Stocker l'idée générée
            window.currentIdea = {
                title: randomIdea.title,
                category: creationType,
                description: randomIdea.description,
                ingredients: randomIdea.ingredients,
                technique: randomIdea.technique
            };
        }
    } catch (error) {
        console.error('Erreur lors de la génération de l\'idée:', error);

        // Afficher un message d'erreur
        if (resultCard) {
            resultCard.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Une erreur est survenue lors de la génération de l'idée. Veuillez réessayer.</p>
                </div>
            `;
        }
    }

    // Cette section est redondante et cause l'erreur - elle est déjà traitée plus haut
    // Nous la supprimons pour éviter la référence à randomIdea qui pourrait être undefined à ce stade
}

// Obtenir les produits de saison pour un mois donné
function getSeasonalProduce(month) {
    // Définir les fruits et légumes de saison pour chaque mois
    const seasonalProduceByMonth = {
        // Janvier
        1: {
            fruits: ['pomme', 'poire', 'orange', 'clémentine', 'kiwi', 'citron'],
            vegetables: ['poireau', 'chou', 'carotte', 'endive', 'céleri', 'betterave', 'panais', 'topinambour']
        },
        // Février
        2: {
            fruits: ['pomme', 'poire', 'orange', 'clémentine', 'kiwi', 'citron'],
            vegetables: ['poireau', 'chou', 'carotte', 'endive', 'céleri', 'betterave', 'panais', 'topinambour']
        },
        // Mars
        3: {
            fruits: ['pomme', 'poire', 'orange', 'citron', 'kiwi'],
            vegetables: ['poireau', 'chou', 'carotte', 'endive', 'épinard', 'asperge', 'radis']
        },
        // Avril
        4: {
            fruits: ['pomme', 'rhubarbe', 'citron'],
            vegetables: ['asperge', 'radis', 'épinard', 'artichaut', 'petit pois', 'carotte nouvelle']
        },
        // Mai
        5: {
            fruits: ['fraise', 'cerise', 'rhubarbe'],
            vegetables: ['asperge', 'radis', 'petit pois', 'artichaut', 'courgette', 'fève']
        },
        // Juin
        6: {
            fruits: ['fraise', 'cerise', 'abricot', 'pêche', 'nectarine', 'melon', 'framboise'],
            vegetables: ['courgette', 'aubergine', 'poivron', 'tomate', 'haricot vert', 'artichaut', 'petit pois']
        },
        // Juillet
        7: {
            fruits: ['abricot', 'pêche', 'nectarine', 'melon', 'pastèque', 'framboise', 'myrtille', 'cassis', 'groseille', 'cerise'],
            vegetables: ['tomate', 'courgette', 'aubergine', 'poivron', 'haricot vert', 'maïs', 'concombre']
        },
        // Août
        8: {
            fruits: ['pêche', 'nectarine', 'abricot', 'melon', 'pastèque', 'prune', 'mirabelle', 'framboise', 'mûre', 'myrtille', 'figue'],
            vegetables: ['tomate', 'courgette', 'aubergine', 'poivron', 'haricot vert', 'maïs', 'concombre']
        },
        // Septembre
        9: {
            fruits: ['pomme', 'poire', 'prune', 'mirabelle', 'raisin', 'figue', 'framboise', 'mûre'],
            vegetables: ['tomate', 'courgette', 'aubergine', 'poivron', 'maïs', 'potiron', 'champignon']
        },
        // Octobre
        10: {
            fruits: ['pomme', 'poire', 'raisin', 'coing', 'châtaigne', 'noix', 'noisette'],
            vegetables: ['potiron', 'courge', 'champignon', 'carotte', 'céleri', 'chou', 'poireau', 'betterave']
        },
        // Novembre
        11: {
            fruits: ['pomme', 'poire', 'coing', 'kiwi', 'châtaigne', 'noix', 'noisette', 'orange', 'clémentine'],
            vegetables: ['potiron', 'courge', 'champignon', 'carotte', 'céleri', 'chou', 'poireau', 'betterave', 'endive']
        },
        // Décembre
        12: {
            fruits: ['pomme', 'poire', 'orange', 'clémentine', 'mandarine', 'kiwi', 'châtaigne'],
            vegetables: ['poireau', 'chou', 'carotte', 'endive', 'céleri', 'betterave', 'panais', 'topinambour']
        }
    };

    return seasonalProduceByMonth[month] || { fruits: [], vegetables: [] };
}

// Obtenir le nom du mois
function getMonthName(month) {
    const monthNames = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    return monthNames[month - 1];
}

// Sélectionner des éléments aléatoires d'un tableau
function getRandomItems(array, count) {
    // Vérifier que array est bien un tableau et qu'il n'est pas vide
    if (!Array.isArray(array) || array.length === 0) {
        console.warn('getRandomItems: array n\'est pas un tableau valide ou est vide');
        return [];
    }

    // S'assurer que count est un nombre positif et ne dépasse pas la taille du tableau
    const safeCount = Math.min(Math.max(1, count), array.length);

    // Mélanger le tableau et prendre les n premiers éléments
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, safeCount);
}

// Mettre en majuscule la première lettre d'une chaîne
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Sauvegarder une inspiration
function saveInspiration() {
    // Implémenter la sauvegarde de l'inspiration
    console.log('Sauvegarde de l\'inspiration:', window.currentIdea);

    // Afficher un message de confirmation
    alert('Inspiration sauvegardée !');
}

// Créer une recette à partir d'une inspiration générée par l'IA
function createRecipeFromInspiration() {
    console.log('Création d\'une recette à partir de l\'inspiration:', window.currentIdea);

    if (!window.currentIdea) {
        console.error('Aucune idée disponible');
        return;
    }

    // Ouvrir la modale de création de recette
    const recipeModal = document.getElementById('recipe-modal');
    if (recipeModal) {
        recipeModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Empêcher le défilement
    }

    // Remplir le formulaire avec les détails de l'idée
    const recipeForm = document.getElementById('recipe-form');
    if (!recipeForm) return;

    // Remplir les champs de base
    document.getElementById('recipe-name').value = window.currentIdea.title;
    document.getElementById('recipe-category').value = window.currentIdea.category;
    document.getElementById('recipe-instructions').value = window.currentIdea.technique + '\n\n' + window.currentIdea.description;

    // Valeurs par défaut pour les autres champs
    document.getElementById('recipe-yield-quantity').value = '10'; // Par défaut 10 pièces
    document.getElementById('recipe-yield-unit').value = 'pieces';
    document.getElementById('recipe-time').value = '60'; // Par défaut 60 minutes
    document.getElementById('recipe-piece-weight').value = '80'; // Par défaut 80g par pièce

    if (document.getElementById('recipe-notes')) {
        document.getElementById('recipe-notes').value = 'Recette inspirée par une idée générée par l\'IA.';
    }

    // Vider le conteneur d'ingrédients existant
    const ingredientsContainer = document.getElementById('ingredients-container');
    if (ingredientsContainer) {
        ingredientsContainer.innerHTML = '';
    }

    // Ajouter les ingrédients de l'idée avec des quantités estimées
    if (window.currentIdea.ingredients && window.currentIdea.ingredients.length > 0) {
        window.currentIdea.ingredients.forEach((ingredientName, index) => {
            // Trouver l'ingrédient correspondant dans la base de données
            let ingredientId = '';
            if (window.appData && window.appData.ingredients) {
                const matchingIngredient = window.appData.ingredients.find(ingredient =>
                    ingredient.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
                    ingredientName.toLowerCase().includes(ingredient.name.toLowerCase())
                );

                if (matchingIngredient) {
                    ingredientId = matchingIngredient._id;
                }
            }

            // Estimer la quantité et l'unité
            const estimatedQuantity = getEstimatedQuantity(ingredientName, index);

            // Ajouter une ligne d'ingrédient
            const row = document.createElement('div');
            row.className = 'ingredient-row';

            // Créer le sélecteur d'ingrédient
            const select = document.createElement('select');
            select.className = 'ingredient-select';

            // Option par défaut
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Sélectionner un ingrédient';
            select.appendChild(defaultOption);

            // Ajouter les options d'ingrédients
            if (window.appData && window.appData.ingredients) {
                window.appData.ingredients.forEach(ingredient => {
                    const option = document.createElement('option');
                    option.value = ingredient._id;
                    option.textContent = ingredient.name;

                    // Sélectionner l'ingrédient correspondant
                    if (ingredient._id === ingredientId) {
                        option.selected = true;
                    }

                    select.appendChild(option);
                });
            }

            // Créer le champ de quantité
            const quantityInput = document.createElement('input');
            quantityInput.type = 'number';
            quantityInput.className = 'ingredient-quantity';
            quantityInput.min = '0';
            quantityInput.step = '0.01';
            quantityInput.placeholder = 'Quantité';
            quantityInput.value = estimatedQuantity.quantity;

            // Créer le sélecteur d'unité
            const unitSelect = document.createElement('select');
            unitSelect.className = 'ingredient-unit';

            const units = [
                { value: 'g', text: 'g' },
                { value: 'kg', text: 'kg' },
                { value: 'ml', text: 'ml' },
                { value: 'l', text: 'l' },
                { value: 'pcs', text: 'pcs' }
            ];

            units.forEach(unit => {
                const option = document.createElement('option');
                option.value = unit.value;
                option.textContent = unit.text;

                // Sélectionner l'unité estimée
                if (unit.value === estimatedQuantity.unit) {
                    option.selected = true;
                }

                unitSelect.appendChild(option);
            });

            // Créer le bouton de suppression
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-ingredient btn-icon';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';

            // Ajouter les éléments à la ligne
            row.appendChild(select);
            row.appendChild(quantityInput);
            row.appendChild(unitSelect);
            row.appendChild(removeBtn);

            // Ajouter la ligne au conteneur
            ingredientsContainer.appendChild(row);
        });
    } else {
        // Ajouter une ligne d'ingrédient vide si aucun ingrédient n'est disponible
        addIngredientRow();
    }

    // Mettre à jour le titre de la modale
    const modalHeader = recipeModal.querySelector('.modal-header h3');
    if (modalHeader) {
        modalHeader.textContent = 'Créer une recette à partir de l\'inspiration';
    }
}

// Fonction pour estimer les quantités des ingrédients
function getEstimatedQuantity(ingredient, index) {
    // Quantités estimées pour différents types d'ingrédients
    const estimations = {
        // Farines
        'farine': { quantity: 500, unit: 'g' },
        'flour': { quantity: 500, unit: 'g' },

        // Liquides
        'eau': { quantity: 300, unit: 'ml' },
        'water': { quantity: 300, unit: 'ml' },
        'lait': { quantity: 250, unit: 'ml' },
        'milk': { quantity: 250, unit: 'ml' },
        'crème': { quantity: 200, unit: 'ml' },
        'cream': { quantity: 200, unit: 'ml' },

        // Matières grasses
        'beurre': { quantity: 250, unit: 'g' },
        'butter': { quantity: 250, unit: 'g' },
        'huile': { quantity: 100, unit: 'ml' },
        'oil': { quantity: 100, unit: 'ml' },

        // Sucres
        'sucre': { quantity: 200, unit: 'g' },
        'sugar': { quantity: 200, unit: 'g' },

        // Œufs
        'œuf': { quantity: 4, unit: 'pcs' },
        'egg': { quantity: 4, unit: 'pcs' },
        'œufs': { quantity: 4, unit: 'pcs' },
        'eggs': { quantity: 4, unit: 'pcs' },

        // Fruits
        'fraise': { quantity: 250, unit: 'g' },
        'strawberry': { quantity: 250, unit: 'g' },
        'fraises': { quantity: 250, unit: 'g' },
        'strawberries': { quantity: 250, unit: 'g' },
        'pomme': { quantity: 3, unit: 'pcs' },
        'apple': { quantity: 3, unit: 'pcs' },

        // Chocolat
        'chocolat': { quantity: 200, unit: 'g' },
        'chocolate': { quantity: 200, unit: 'g' },

        // Épices et arômes
        'vanille': { quantity: 10, unit: 'g' },
        'vanilla': { quantity: 10, unit: 'g' },
        'cannelle': { quantity: 5, unit: 'g' },
        'cinnamon': { quantity: 5, unit: 'g' },

        // Levures
        'levure': { quantity: 10, unit: 'g' },
        'yeast': { quantity: 10, unit: 'g' },

        // Sel
        'sel': { quantity: 10, unit: 'g' },
        'salt': { quantity: 10, unit: 'g' }
    };

    // Rechercher l'ingrédient dans les estimations
    for (const [key, value] of Object.entries(estimations)) {
        if (ingredient.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }

    // Valeurs par défaut selon la position dans la liste
    // Les premiers ingrédients sont généralement les ingrédients principaux
    if (index === 0) {
        return { quantity: 500, unit: 'g' }; // Premier ingrédient (souvent farine)
    } else if (index === 1) {
        return { quantity: 250, unit: 'g' }; // Deuxième ingrédient
    } else if (index === 2) {
        return { quantity: 200, unit: 'g' }; // Troisième ingrédient
    } else {
        return { quantity: 100, unit: 'g' }; // Autres ingrédients
    }
}

// Générer une idée de recette de secours en cas d'erreur avec l'API Gemini
function generateFallbackRecipeIdea(creationType, occasion, currentMonth) {
    console.log('Génération d\'une idée de secours pour:', creationType);

    // Déterminer les fruits et légumes de saison
    const seasonalProduce = getSeasonalProduce(currentMonth);

    // Idées de recettes par défaut pour chaque type de création
    const fallbackIdeas = {
        'patisserie': {
            title: "Tarte Fraise-Pistache Revisitée",
            description: "Une tarte moderne associant la fraîcheur des fraises de saison à la douceur de la pistache. La base est composée d'une pâte sablée croustillante, surmontée d'une crème de pistache légère et d'un arrangement géométrique de fraises fraîches glacées.",
            ingredients: ["Fraises fraîches", "Pâte de pistache", "Crème pâtissière", "Pâte sablée"],
            technique: "Glaçage miroir vert pâle sur les fraises pour un effet visuel saisissant."
        },
        'boulangerie': {
            title: "Pain de Campagne aux Graines Anciennes",
            description: "Un pain rustique à la mie alvéolée et à la croûte épaisse, enrichi d'un mélange de graines anciennes (quinoa, amarante, lin) pour une saveur complexe et des qualités nutritionnelles supérieures.",
            ingredients: ["Farine T65", "Levain naturel", "Mélange de graines anciennes", "Sel de Guérande"],
            technique: "Fermentation lente de 24h à basse température pour développer les arômes."
        },
        'viennoiserie': {
            title: "Croissant Bicolore Matcha-Vanille",
            description: "Un croissant innovant combinant deux pâtes feuilletées, l'une nature à la vanille et l'autre au thé matcha, créant un effet visuel spectaculaire et des saveurs contrastées.",
            ingredients: ["Beurre AOP", "Farine T45", "Poudre de matcha", "Vanille de Madagascar"],
            technique: "Superposition de deux pâtes colorées différemment avant le tourage."
        },
        'snacking': {
            title: "Quiche Lorraine Revisitée",
            description: "Une quiche lorraine modernisée avec une pâte brisée au beurre noisette, une garniture crémeuse aux lardons fumés et comté affiné. Servie en portions individuelles pour un snacking gourmand.",
            ingredients: ["Pâte brisée", "Lardons fumés", "Comté affiné", "Crème fraîche", "Œufs fermiers"],
            technique: "Cuisson à basse température pour une texture fondante et un cœur crémeux."
        }
    };

    // Utiliser l'idée de secours correspondant au type de création
    // ou une idée générique si le type n'est pas reconnu
    return fallbackIdeas[creationType] || {
        title: "Création Gourmande Personnalisée",
        description: "Une création sur mesure adaptée à vos besoins spécifiques. Contactez notre chef pour discuter des détails et personnaliser cette recette selon vos préférences et contraintes.",
        ingredients: ["Ingrédients de saison", "Produits locaux", "Éléments de votre choix", "Touches créatives"],
        technique: "Techniques adaptées à votre niveau et à votre équipement."
    };
}

// Sauvegarder une inspiration
function saveInspiration() {
    // Dans une application réelle, cela sauvegarderait l'idée dans une base de données
    alert('Idée sauvegardée avec succès !');
}

// Créer une recette à partir d'une inspiration
function createRecipeFromInspiration() {
    if (!window.currentIdea) return;
    
    // Remplir le formulaire de recette avec les informations de l'idée
    document.getElementById('recipe-name').value = window.currentIdea.title;
    document.getElementById('recipe-category').value = window.currentIdea.category;
    document.getElementById('recipe-yield-quantity').value = 1;
    document.getElementById('recipe-yield-unit').value = 'pieces';
    document.getElementById('recipe-time').value = 60;
    document.getElementById('recipe-instructions').value = window.currentIdea.description + '\n\nTechnique signature: ' + window.currentIdea.technique;
    
    // Vider les ingrédients existants
    document.getElementById('ingredients-container').innerHTML = '';
    
    // Ajouter les ingrédients suggérés
    window.currentIdea.ingredients.forEach(ingredient => {
        addIngredientRow();
    });
    
    // Ouvrir la modale de recette
    document.getElementById('recipe-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Changer le titre de la modale
    const modalTitle = document.querySelector('#recipe-modal .modal-header h3');
    modalTitle.textContent = 'Créer une recette à partir de l\'inspiration';
}

// Obtenir le nom d'une catégorie à partir de sa valeur
function getCategoryName(category) {
    const categories = {
        'patisserie': 'Pâtisserie',
        'boulangerie': 'Boulangerie',
        'viennoiserie': 'Viennoiserie',
        'snacking': 'Snacking',
        'farine': 'Farines',
        'sucre': 'Sucres',
        'produit-laitier': 'Produits laitiers',
        'fruit': 'Fruits',
        'chocolat': 'Chocolats',
        'autre': 'Autres'
    };

    return categories[category] || category;
}

// Obtenir les produits de saison pour un mois donné
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

// Obtenir le nom d'un mois à partir de son numéro
function getMonthName(month) {
    const months = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];

    return months[month - 1] || '';
}