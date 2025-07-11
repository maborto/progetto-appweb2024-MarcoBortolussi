document.addEventListener("DOMContentLoaded", async () => {
    // Riferimenti agli elementi del DOM
    const dailyMenuSectionsContainer = document.getElementById("daily-menu-sections");
    const generateNewMenuBtn = document.getElementById("generate-new-menu-btn");
    const loadingMessage = document.getElementById("loading-message");
    const errorMessage = document.getElementById("error-message");

    const menuCategories = ['Antipasto', 'Primo', 'Secondo', 'Dolce'];

    // Funzione per mostrare/nascondere messaggi
    function showMessage(element, message, type = 'info') {
        if (element) {
            element.textContent = message;
            element.className = `message-box ${type}`;
            element.style.display = 'block';
        }
    }

    function hideMessage(element) {
        if (element) {
            element.style.display = 'none';
        }
    }

    // Funzione per recuperare un piatto casuale per una data categoria
    async function fetchRandomDish(category) {
        try {
            // Ottieni tutte le ricette per la categoria specificata
            const response = await fetch(`/api/ricette?categoria=${encodeURIComponent(category)}&limit=9999`);
            const data = await response.json();

            if (!response.ok || !data.results || data.results.length === 0) {
                return null; // Nessun piatto disponibile per questa categoria
            }

            // Scegli una ricetta casuale dall'array
            const randomIndex = Math.floor(Math.random() * data.results.length);
            return data.results[randomIndex];

        } catch (error) {
            return null;
        }
    }

    // Funzione per generare e visualizzare il menu del giorno
    async function generateDailyMenu() {
        hideMessage(errorMessage);
        hideMessage(loadingMessage);
        dailyMenuSectionsContainer.innerHTML = ''; // Pulisci il contenitore

        const menuDishes = {};
        let allCategoriesFound = true;

        for (const category of menuCategories) {
            const dish = await fetchRandomDish(category);
            menuDishes[category] = dish;
            if (!dish) {
                allCategoriesFound = false;
            }
        }

        dailyMenuSectionsContainer.style.display = 'block'; // Mostra il contenitore dopo il caricamento

        if (!allCategoriesFound) {
            showMessage(errorMessage, 'Non è stato possibile trovare piatti per tutte le categorie. Potresti voler aggiungere più ricette.', 'info');
        }

        // Visualizza i piatti nel DOM
        menuCategories.forEach(category => {
            const dish = menuDishes[category];
            const categorySection = document.createElement("div");
            categorySection.className = "menu-section";
            categorySection.id = `${category.toLowerCase()}-section`;

            if (dish) {
                categorySection.innerHTML = `
                    <h2>${category}</h2>
                    <div class="dish-card">
                        <img src="${dish.immagine}" alt="${dish.nome}" class="dish-image" onerror="this.onerror=null;this.src='placeholder.jpg';">
                        <h3 class="dish-name">${dish.nome}</h3>
                        <p class="dish-description">${dish.descrizione || 'Nessuna descrizione disponibile.'}</p>
                        <p class="dish-details"><small>Tempo: ${dish.tempo || 'N/D'} min · Calorie: ${dish.calorie || 'N/D'} kcal</small></p>
                        <a href="/piatti/index.html?id=${dish.id}&categoria=${encodeURIComponent(category)}" class="view-recipe-btn">Vedi Ricetta</a>
                    </div>
                `;
            } else {
                // Se non c'è un piatto per la categoria, mostra un messaggio nella sezione
                categorySection.innerHTML = `
                    <h2>${category}</h2>
                    <p class="no-dish-message">Nessun piatto disponibile per questa categoria.</p>
                `;
                
            }
            dailyMenuSectionsContainer.appendChild(categorySection);
        });
    }

    // --- Listener di Eventi ---
    if (generateNewMenuBtn) {
        generateNewMenuBtn.addEventListener('click', generateDailyMenu);
    }

    // --- Inizializzazione ---
    generateDailyMenu(); // Genera il menu all'avvio della pagina
});