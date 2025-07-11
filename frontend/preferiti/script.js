document.addEventListener("DOMContentLoaded", async () => {
    // Riferimenti agli elementi del DOM
    const ricetteListContainer = document.getElementById("ricette-list-container");
    const loginPrompt = document.getElementById("login-prompt");
    const noFavoritesMessageDisplay = document.getElementById("no-favorites-message-display");

    // Variabili di stato (la paginazione è rimossa)
    let allFavoriteRecipes = [];

    // Funzione per ottenere il token di autenticazione da localStorage
    function getAuthToken() {
        return localStorage.getItem('authToken');
    }

    // Funzione per mostrare un messaggio specifico e nascondere gli altri
    function showMessage(elementToShow, message, type = 'info') {
        // Nascondi tutti i contenitori principali
        if (loginPrompt) loginPrompt.style.display = 'none';
        if (noFavoritesMessageDisplay) noFavoritesMessageDisplay.style.display = 'none';
        if (ricetteListContainer) ricetteListContainer.style.display = 'none'; // Nascondi le sezioni delle ricette

        if (elementToShow) {
            elementToShow.textContent = message;
            elementToShow.className = `message-box ${type}`; // Imposta classi per lo stile
            elementToShow.style.display = 'block';
        }
    }

    async function loadFavoriteRecipes() {
        const authToken = getAuthToken();
        if (!authToken) {
            showMessage(loginPrompt, 'Effettua il login per visualizzare e gestire i tuoi preferiti.');
            allFavoriteRecipes = [];
            return;
        }

        // Se autenticato, nascondi il prompt di login e mostra il caricamento
        if (loginPrompt) loginPrompt.style.display = 'none';
        if (noFavoritesMessageDisplay) noFavoritesMessageDisplay.style.display = 'none';
        
        if (ricetteListContainer) {
            ricetteListContainer.style.display = 'flex'; // Mostra il contenitore principale per le sezioni
            ricetteListContainer.innerHTML = '<p class="loading-message" style="width:100%; text-align:center;">Caricamento preferiti...</p>';
        }

        try {
            const favoritesResponse = await fetch('/api/favorites', {
                headers: { 'X-Auth-Token': authToken }
            });

            if (!favoritesResponse.ok) {
                const errorData = await favoritesResponse.json();
                showMessage(noFavoritesMessageDisplay, `Errore nel caricamento dei preferiti: ${errorData.message || 'Errore sconosciuto'}`, 'error');
                allFavoriteRecipes = [];
                return;
            }

            const favoritesData = await favoritesResponse.json();
            const favoriteIds = favoritesData.favorites || [];

            if (favoriteIds.length === 0) {
                showMessage(noFavoritesMessageDisplay, 'Non hai ancora ricette preferite. Aggiungine alcune dalla pagina dei piatti!');
                allFavoriteRecipes = [];
                return;
            }

            const recipePromises = favoriteIds.map(id =>
                fetch(`/api/ricette/${id}`).then(res => {
                    if (!res.ok) {
                        return null;
                    }
                    return res.json();
                })
            );
            const recipes = await Promise.all(recipePromises);

            allFavoriteRecipes = recipes.filter(recipe => recipe && recipe.id);

            // Se ci sono ricette, assicurati che il messaggio "non preferiti" sia nascosto
            if (noFavoritesMessageDisplay) noFavoritesMessageDisplay.style.display = 'none';
            if (ricetteListContainer) ricetteListContainer.style.display = 'flex'; // Assicurati che il contenitore sia visibile

            displayFavoriteRecipes();

        } catch (error) {
            showMessage(noFavoritesMessageDisplay, 'Si è verificato un errore di rete durante il caricamento dei preferiti.', 'error');
            allFavoriteRecipes = [];
        }
    }

    // Funzione modificata per visualizzare le ricette raggruppate per categoria
    function displayFavoriteRecipes() {
        if (!ricetteListContainer) return;
        ricetteListContainer.innerHTML = ''; // Pulisci il contenitore

        if (allFavoriteRecipes.length === 0) {
            showMessage(noFavoritesMessageDisplay, 'Non hai ancora ricette preferite. Aggiungine alcune dalla pagina dei piatti!');
            return;
        }

        // Definisci l'ordine delle categorie desiderato
        const orderedCategories = ['Antipasto', 'Primo', 'Secondo', 'Dolce'];
        const groupedRecipes = {};

        // Inizializza i gruppi per le categorie ordinate
        orderedCategories.forEach(cat => {
            groupedRecipes[cat] = [];
        });

        // Raggruppa tutte le ricette per categoria
        allFavoriteRecipes.forEach(recipe => {
            const category = recipe.categoria;
            if (orderedCategories.includes(category)) {
                groupedRecipes[category].push(recipe);
            } 
        });

        // Itera sulle categorie ordinate e crea le sezioni solo se ci sono ricette
        orderedCategories.forEach(category => {
            if (groupedRecipes[category].length > 0) {
                const categorySection = document.createElement("div");
                categorySection.className = "category-section";
                categorySection.innerHTML = `<h2>${category}</h2><div class="category-cards-wrapper"></div>`;
                const categoryCardsWrapper = categorySection.querySelector(".category-cards-wrapper");

                groupedRecipes[category].forEach(piatto => {
                    const card = document.createElement("div");
                    card.className = "recipe-card";
                    card.dataset.id = piatto.id;
                    card.innerHTML = `
                        <img src="${piatto.immagine}" alt="${piatto.nome}" onerror="this.onerror=null;this.src='placeholder.jpg';" />
                        <h3>${piatto.nome}</h3>
                        <p class="card-description">${piatto.descrizione || ''}</p>
                        <p><small>${piatto.tempo} min · ${piatto.calorie} kcal</small></p>
                        <button class="remove-favorite-btn" data-id="${piatto.id}">Rimuovi</button>
                    `;
                    // Listener per reindirizzare alla pagina del piatto al click sulla card
                    card.querySelector('img').addEventListener("click", () => {
                        window.location.href = `/piatti/index.html?id=${piatto.id}`;
                    });
                    card.querySelector('h3').addEventListener("click", () => {
                        window.location.href = `/piatti/index.html?id=${piatto.id}`;
                    });

                    // Listener per il bottone "Rimuovi"
                    const removeBtn = card.querySelector('.remove-favorite-btn');
                    if (removeBtn) {
                        removeBtn.addEventListener('click', (event) => {
                            event.stopPropagation(); // Impedisce che il click sulla card si propaghi
                            removeFavorite(parseInt(removeBtn.dataset.id));
                        });
                    }
                    categoryCardsWrapper.appendChild(card);
                });
                ricetteListContainer.appendChild(categorySection);
            }
        });
    }

    async function removeFavorite(recipeId) {
        const authToken = getAuthToken();
        if (!authToken) {
            showCustomMessage("Devi effettuare il login per rimuovere dai preferiti.", type = 'error', autoHide = true, duration = 3000)
            return;
        }

        try {
            const response = await fetch(`/api/favorites/${recipeId}`, {
                method: 'DELETE',
                headers: { 'X-Auth-Token': authToken }
            });

            if (response.ok) {
                showCustomMessage("Ricetta rimossa dai preferiti!", type = 'success', autoHide = true, duration = 3000)
                allFavoriteRecipes = allFavoriteRecipes.filter(recipe => recipe.id !== recipeId);
                displayFavoriteRecipes(); // Ricarica la visualizzazione con la lista aggiornata
            } else {
                const errorData = await response.json();
                showCustomMessage(`Errore nella rimozione: ${errorData.message}`, type = 'error', autoHide = true, duration = 3000)
            }
        } catch (error) {
            showCustomMessage("Errore di rete durante la rimozione dai preferiti.", type = 'error', autoHide = true, duration = 3000)
        }
    }

    // --- Inizializzazione ---
    window.addEventListener('authStatusChanged', loadFavoriteRecipes);
    loadFavoriteRecipes(); // Carica i preferiti all'avvio della pagina
});