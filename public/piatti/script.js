document.addEventListener("DOMContentLoaded", async () => {
    // Ottiene l'ID del piatto e i parametri dalla URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    let categoria = params.get("categoria") || ""; // Categoria per navigazione basata su categoria

    // PARAMETRI PER LA NAVIGAZIONE DA RICERCA
    const source = params.get("source") || ""; // 'search' o vuoto
    const searchQuery = params.get("searchQuery") || "";
    const searchResultIdsParam = params.get("searchResultIds") || "";
    let searchResultIds = searchResultIdsParam ? searchResultIdsParam.split(',').map(Number) : [];
    let searchCurrentIndex = params.has("currentIndex") ? parseInt(params.get("currentIndex")) : -1;

    // Riferimenti ai bottoni di navigazione piatto
    const prevDishBtn = document.getElementById("prev-dish-btn");
    const nextDishBtn = document.getElementById("next-dish-btn");
    // Bottone Preferiti e icona SVG
    const favoriteBtn = document.getElementById("favorite-btn");
    const heartIcon =  favoriteBtn.querySelector('.heart-icon');

    let allCategoryRecipes = []; // Usato per navigazione per categoria
    let currentDishIndex = -1; // Indice del piatto corrente nell'array di categoria

    let isCurrentDishFavorite = false; // Stato del preferito per il piatto corrente


    // Se l'ID del piatto non è presente nell'URL, mostra un errore e disabilita i bottoni
    if (!id) {
        document.getElementById("nome").innerText = "Errore: ID piatto mancante";
        document.getElementById("procedura").innerText = "Impossibile caricare il piatto. ID non specificato nella URL.";
        document.getElementById("immagine").src = "/img/placeholder.jpg";
        updateDishNavigationButtons(); // Disabilita i bottoni
        if (favoriteBtn) favoriteBtn.disabled = true;
        if (heartIcon) heartIcon.style.fill = '#D3D3D3'; // Grigio per errore ID
        return;
    }

    try {
        // 1. Fetch del piatto specifico
        const response = await fetch(`/api/ricette/${id}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Errore sconosciuto" }));
            document.getElementById("nome").innerText = "Piatto Non Trovato";
            document.getElementById("procedura").innerText = `Ci dispiace, la ricetta con ID ${id} non è stata trovata. ${errorData.message || ''}`;
            document.getElementById("immagine").src = "/img/placeholder.jpg";
            updateDishNavigationButtons(); // Disabilita i bottoni
            if (favoriteBtn) favoriteBtn.disabled = true;
            if (heartIcon) heartIcon.style.fill = '#D3D3D3'; // Grigio per piatto non trovato
            return;
        }
        const piatto = await response.json();

        // 2. Popola i dettagli del piatto nella pagina
        if (piatto && piatto.nome) {
            document.getElementById("nome").innerText = piatto.nome;
            document.getElementById("immagine").src = piatto.immagine;
            document.getElementById("immagine").alt = piatto.nome;
            document.getElementById("immagine").onerror = function() { this.onerror=null; this.src='/img/placeholder.jpg'; };

            document.getElementById("procedura").innerText = piatto.istruzioni || "Nessuna procedura disponibile.";
            document.getElementById("tempo").innerText = piatto.tempo;
            document.getElementById("calorie").innerText = piatto.calorie;

            const lista = document.getElementById("ingredienti");
            lista.innerHTML = "";
            const ingredientiArray = Array.isArray(piatto.ingredienti)
                ? piatto.ingredienti
                : (piatto.ingredienti ? String(piatto.ingredienti).split(',').map(item => item.trim()).filter(item => item !== '') : []);

            if (ingredientiArray.length > 0) {
                ingredientiArray.forEach(ingrediente => {
                    const li = document.createElement("li");
                    li.innerText = ingrediente;
                    lista.appendChild(li);
                });
            } else {
                lista.innerHTML = "<li>Nessun ingrediente disponibile.</li>";
            }

            // 3. Se non siamo arrivati da una ricerca, carichiamo le ricette della categoria per la navigazione
            if (source !== 'search' && categoria) {
                const categoryUrl = `/api/ricette?categoria=${encodeURIComponent(categoria)}&limit=9999&offset=0`;
                const categoryResponse = await fetch(categoryUrl);
                const categoryData = await categoryResponse.json();

                if (categoryResponse.ok && categoryData.results) {
                    allCategoryRecipes = categoryData.results;
                    allCategoryRecipes.sort((a, b) => a.id - b.id); // Ordina per ID per navigazione coerente
                    currentDishIndex = allCategoryRecipes.findIndex(r => String(r.id) === String(id));
                } else {
                }
            } else if (source === 'search') {
                // Se siamo da ricerca, searchResultIds e searchCurrentIndex sono già popolati
                // Non è necessario rifare il fetch qui, i dati sono già nell'URL
            } 

            // 4. Aggiorna lo stato iniziale dei bottoni di navigazione
            updateDishNavigationButtons();

            // --- Inizializzazione della logica Preferiti ---
            initializeFavoriteButtonLogic();

        } else {
            document.getElementById("nome").innerText = "Dati Piatto Non Validi";
            document.getElementById("procedura").innerText = "I dati ricevuti per questa ricetta non sono completi o validi.";
            document.getElementById("immagine").src = "/img/placeholder.jpg";
            updateDishNavigationButtons(); // Disabilita i bottoni
            if (favoriteBtn) favoriteBtn.disabled = true;
            if (heartIcon) heartIcon.style.fill = '#D3D3D3';
        }

    } catch (err) {
        document.getElementById("nome").innerText = "Errore di Caricamento";
        document.getElementById("procedura").innerText = "Si è verificato un errore di rete durante il caricamento della ricetta.";
        document.getElementById("immagine").src = "/img/placeholder.jpg";
        updateDishNavigationButtons(); // Disabilita i bottoni
        if (favoriteBtn) favoriteBtn.disabled = true;
        if (heartIcon) heartIcon.style.fill = '#D3D3D3';
    }

    // --- Listener per l'evento di cambio stato di autenticazione ---
    // Questo evento verrà emesso dallo script comune di autenticazione (common/auth.js)
    window.addEventListener('authStatusChanged', initializeFavoriteButtonLogic);

    // Aggiungi listener ai bottoni di navigazione (assicurati che siano aggiunti una sola volta)
    if (prevDishBtn) {
        prevDishBtn.addEventListener("click", () => navigateDish(-1));
    }
    if (nextDishBtn) {
        nextDishBtn.addEventListener("click", () => navigateDish(1));
    }



        // Funzione per aggiornare lo stato visivo del bottone Preferiti
    function updateFavoriteButtonState() {
        if (favoriteBtn && heartIcon) {
            if (isCurrentDishFavorite) {
                favoriteBtn.classList.add('is-favorite');
                heartIcon.style.fill = '#FF0000'; // Rosso vivo
            } else {
                favoriteBtn.classList.remove('is-favorite');
                heartIcon.style.fill = '#e6ddd4'; // Colore del body 
            }
        }
    }

    // Funzione per aggiornare lo stato dei bottoni di navigazione (Precedente/Prossimo Piatto)
    function updateDishNavigationButtons() {
        let totalItems = 0; // numero di piatti
        let currentIndex = -1; // indice del piatto corrente

        if (source === 'search' && searchResultIds.length > 0) {
            totalItems = searchResultIds.length;
            currentIndex = searchCurrentIndex;
        } else if (categoria && allCategoryRecipes.length > 0) {
            totalItems = allCategoryRecipes.length;
            currentIndex = currentDishIndex;
        } 

        if (prevDishBtn) {
            prevDishBtn.disabled = (currentIndex <= 0 || totalItems === 0);
        }
        if (nextDishBtn) {
            nextDishBtn.disabled = (currentIndex >= totalItems - 1 || totalItems === 0);
        }

        // Nascondi i bottoni se non c'è navigazione possibile (es. piatto singolo o errore)
        if (totalItems <= 1) {
            if (prevDishBtn) prevDishBtn.style.display = 'none';
            if (nextDishBtn) nextDishBtn.style.display = 'none';
        } else {
            if (prevDishBtn) prevDishBtn.style.display = 'inline-block';
            if (nextDishBtn) nextDishBtn.style.display = 'inline-block';
        }
    }

    // Funzione per navigare al piatto precedente o successivo
    async function navigateDish(direction) {
        let nextDishId;
        let newUrl;

        if (source === 'search' && searchResultIds.length > 0) {
            const newIndex = searchCurrentIndex + direction;
            
            if (newIndex >= 0 && newIndex < searchResultIds.length) {
                nextDishId = searchResultIds[newIndex];
                // Ricostruisci l'URL mantenendo tutti i parametri della ricerca
                newUrl = `/piatti/index.html?id=${nextDishId}&source=search&searchQuery=${encodeURIComponent(searchQuery)}&searchResultIds=${encodeURIComponent(searchResultIds.join(','))}&currentIndex=${newIndex}`;
                window.location.href = newUrl;
            }
        } else if (categoria && allCategoryRecipes.length > 0) {
            const newIndex = currentDishIndex + direction;
            if (newIndex >= 0 && newIndex < allCategoryRecipes.length) {
                nextDishId = allCategoryRecipes[newIndex].id;
                newUrl = `/piatti/index.html?id=${nextDishId}&categoria=${encodeURIComponent(categoria)}`;
                window.location.href = newUrl;
            } else {
            }
        } 
    }

    // --- Inizializza la logica del bottone Preferiti ---
    async function initializeFavoriteButtonLogic() {
        const authToken = getAuthToken();


        if (favoriteBtn && heartIcon) { // Assicurati che gli elementi esistano
            if (authToken) {
                favoriteBtn.disabled = false;
                try {
                    const favoritesResponse = await fetch('/api/favorites', {
                        headers: { 'X-Auth-Token': authToken }
                    });
                    if (favoritesResponse.ok) {
                        const favoritesData = await favoritesResponse.json();
                        isCurrentDishFavorite = favoritesData.favorites.includes(parseInt(id));
                        updateFavoriteButtonState();
                    } else {
                        
                        favoriteBtn.disabled = true;
                        heartIcon.style.fill = '#D3D3D3'; // Grigio per errore
                    }
                } catch (favFetchError) {
                    
                    favoriteBtn.disabled = true;
                    heartIcon.style.fill = '#D3D3D3'; // Grigio per errore
                }

                // Aggiungi il listener per il click sul bottone Preferiti
                favoriteBtn.addEventListener('click', handleFavoriteButtonClick);

            }  else {
                // Se non c'è un token di autenticazione, disabilita il bottone e imposta il colore grigio
                favoriteBtn.disabled = true;
                heartIcon.style.fill = '#D3D3D3'; // Grigio quando non loggato
                favoriteBtn.title = 'Devi effettuare il login per aggiungerla tra i preferiti'; // Imposta il tooltip
                isCurrentDishFavorite = false; // Reset dello stato
                updateFavoriteButtonState(); // Aggiorna l'aspetto 
            }
        } 
    }

    // --- Gestore del click sul bottone Preferiti ---
    async function handleFavoriteButtonClick() {
        const authToken = getAuthToken();
        
        if (!authToken) {
            return;
        }

        const method = isCurrentDishFavorite ? 'DELETE' : 'POST';
        const url = isCurrentDishFavorite ? `/api/favorites/${id}` : '/api/favorites';
        const body = isCurrentDishFavorite ? null : JSON.stringify({ recipeId: parseInt(id) });

        try {
            const favResponse = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': authToken
                },
                body: body
            });

            if (favResponse.ok) {
                isCurrentDishFavorite = !isCurrentDishFavorite; // Inverti lo stato del preferito
                updateFavoriteButtonState(); // Aggiorna l'aspetto del bottone

                showCustomMessage(
                    isCurrentDishFavorite
                        ? "Ricetta aggiunta ai preferiti!"
                        : "Ricetta rimossa dai preferiti!",
                    'success',
                    true,
                    3000
                );
            } else {
                const errorData = await favResponse.json();
                showCustomMessage(
                    `Errore nell'operazione preferiti: ${errorData.message}`,
                    'error',
                    false
                );
            }
            } catch (favError) {
                showCustomMessage(
                    "Errore di rete durante l'operazione preferiti.",
                    'error',
                    false
                );
            }
    }
});


