document.addEventListener("DOMContentLoaded", async () => {

    // Riferimenti agli elementi del DOM
    const searchQueryDisplay = document.getElementById("search-query-display");
    const searchInputSecondary = document.querySelector(".search-input-secondary");
    const searchButtonSecondary = document.querySelector(".search-button-secondary");
    const ricetteListContainer = document.getElementById("ricette-list-container");
    const prevPageBtn = document.getElementById("prev-page-btn");
    const nextPageBtn = document.getElementById("next-page-btn");
    const paginationStatusSpan = document.getElementById("pagination-status");

    // Variabili di stato per la paginazione e ricerca
    let currentQuery = '';
    let currentPage = 1;
    const itemsPerPage = 10; 
    let totalRicette = 0; // Totale ricette trovate
    let allSearchRicetteIds = []; // Array per memorizzare TUTTI gli ID dei risultati della ricerca


    // Aggiorna la visualizzazione del titolo di ricerca.
    function updateSearchDisplay(query) {
        if (searchQueryDisplay) {
            const displayText = query.trim() === '' ? "tutte le ricette" : `"${query}"`;
            searchQueryDisplay.textContent = `Hai cercato: ${displayText}`;
        }
    }

    // Funzione per recuperare e visualizzare le ricette dal backend con ricerca e paginazione.
    async function fetchAndDisplayRecipes(query, page, limit) {
        const offset = (page - 1) * limit; // Calcola l'offset basato sulla pagina

        // Costruisci l'URL per la richiesta GET /api/ricette
        let url = `/api/ricette?limit=${limit}&offset=${offset}`;
        if (query) {
            url += `&q=${encodeURIComponent(query)}`;
        }

        try {
            const response = await fetch(url);
            const data = await response.json(); // Data conterra un array di oggetti ( ricette ) e la lunghezza dell'array

            if (response.ok) {
                totalRicette = data.total; // Aggiorna il totale complessivo trovato dal server
                
                // Se è la prima pagina di una nuova ricerca, recupera tutti gli ID
                if (page === 1) {
                    let allIdsUrl = `/api/ricette?limit=${totalRicette}&offset=0`; // Chiedi tutti i risultati
                    if (query) { // Aggiungi la query anche per la richiesta di tutti gli ID
                        allIdsUrl += `&q=${encodeURIComponent(query)}`;
                    }
                    const allIdsResponse = await fetch(allIdsUrl);
                    const allIdsData = await allIdsResponse.json();
                    if (allIdsResponse.ok && allIdsData.results) {
                        allSearchRicetteIds = allIdsData.results.map(r => r.id);

                    } else {
                        allSearchRicetteIds = [];
                    }
                }

                displayRecipes(data.results); // Visualizza le ricette della pagina corrente
                updatePaginationControls(data.results.length); // Aggiorna lo stato dei bottoni e testo

            } else {
                if (ricetteListContainer) {
                    ricetteListContainer.innerHTML = `<p class="error-message">Errore: ${data.message || 'Non e stato possibile caricare le ricette.'}</p>`;
                }
                totalRicette = 0; // Resetta il totale in caso di errore
                allSearchRicetteIds = []; // Resetta gli ID
                displayRecipes([]); // Pulisci la lista
                updatePaginationControls(0); // Disabilita i controlli
            }
        } catch (error) {
            if (ricetteListContainer) {
                ricetteListContainer.innerHTML = '<p class="error-message">Si e verificato un errore di rete. Riprova piu tardi.</p>';
            }
            totalRicette = 0;
            allSearchRicetteIds = [];
            displayRecipes([]);
            updatePaginationControls(0);
        }
    }

    // Funzione per visualizzare le card delle ricette nel contenitore.
    function displayRecipes(ricette) {
        if (!ricetteListContainer) return; // Controllo di sicurezza

        ricetteListContainer.innerHTML = ''; // Pulisci il contenitore attuale

        if (ricette.length === 0) {
            ricetteListContainer.innerHTML = '<p class="no-results-message">Nessuna ricetta trovata con questa ricerca.</p>';
            return;
        }

        ricette.forEach((piatto, index) => { // Aggiungi 'index' per ottenere l'indice del piatto
            const card = document.createElement("div");
            card.className = "recipe-card";
            card.dataset.id = piatto.id; // Salva l'ID sulla card per il click
            card.innerHTML = `
                <img src="${piatto.immagine}" alt="${piatto.nome}"/>
                <h3>${piatto.nome}</h3>
                <p class="card-description">${piatto.descrizione || ''}</p>
                <p><small>${piatto.tempo} minuti · ${piatto.calorie} kcal</small></p>
            `;
            
            card.addEventListener("click", () => {
                const currentDishOverallIndex = (currentPage - 1) * itemsPerPage + index; // Indice assoluto del piatto nella lista completa dei risultati

                const newUrl = `/piatti/index.html?id=${piatto.id}` +
                                `&source=search` + 
                                `&searchQuery=${encodeURIComponent(currentQuery)}` +
                                `&searchResultIds=${encodeURIComponent(allSearchRicetteIds.join(','))}` + // Passa TUTTI gli ID
                                `&currentIndex=${currentDishOverallIndex}`;
                
                window.location.href = newUrl;
            });
            ricetteListContainer.appendChild(card);
        });
    }

    /** Aggiorna lo stato dei bottoni di paginazione e il testo di stato. */
    function updatePaginationControls(currentResultsCount) {
        if (!paginationStatusSpan || !prevPageBtn || !nextPageBtn) return; // Controlli di sicurezza

        const startIndex = (currentPage - 1) * itemsPerPage + 1;
        const endIndex = startIndex + currentResultsCount - 1;

        // Aggiorna lo stato del testo
        if (totalRicette === 0) {
            paginationStatusSpan.textContent = ''; // Nessun risultato
        } else {
            paginationStatusSpan.textContent = `${startIndex}-${endIndex} di ${totalRicette}`;
        }

        // Imposta la proprieta `disabled` del bottone "Precedente" a `true` se la `currentPage` e 1 (cioe, siamo gia sulla prima pagina).
        prevPageBtn.disabled = (currentPage === 1);

        // Disabilita/abilita il bottone "Successivo"
        const maxPages = Math.ceil(totalRicette / itemsPerPage);
        nextPageBtn.disabled = (currentPage >= maxPages || totalRicette === 0);

        // Nascondi i controlli di paginazione se non ci sono risultati o solo una pagina
        if (totalRicette <= itemsPerPage && totalRicette > 0) {
            paginationStatusSpan.style.display = 'none';
            prevPageBtn.style.display = 'none';
            nextPageBtn.style.display = 'none';
        } else if (totalRicette === 0) {
            paginationStatusSpan.style.display = 'none';
            prevPageBtn.style.display = 'none';
            nextPageBtn.style.display = 'none';
        }
        else {
            paginationStatusSpan.style.display = 'inline-block';
            prevPageBtn.style.display = 'inline-block';
            nextPageBtn.style.display = 'inline-block';
        }
    }


    // Listener per il bottone di ricerca secondaria
    if (searchButtonSecondary && searchInputSecondary) {
        searchButtonSecondary.addEventListener("click", () => {
            currentQuery = searchInputSecondary.value.trim();
            currentPage = 1;
            window.history.pushState(null, '', `?q=${encodeURIComponent(currentQuery)}&page=${currentPage}`);
            fetchAndDisplayRecipes(currentQuery, currentPage, itemsPerPage);
            searchInputSecondary.value = ''; // Pulisce la barra di ricerca secondaria dopo aver cercato
            updateSearchDisplay(currentQuery); // <-- Aggiorna il display della query qui
        });

        // Listener per la pressione del tasto Invio nel campo di ricerca secondaria
        searchInputSecondary.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                searchButtonSecondary.click();
            }
        });
    } 


    // Listener per i bottoni di paginazione
    if (prevPageBtn) {
        prevPageBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                window.history.pushState(null, '', `?q=${encodeURIComponent(currentQuery)}&page=${currentPage}`);
                fetchAndDisplayRecipes(currentQuery, currentPage, itemsPerPage);
                updateSearchDisplay(currentQuery); 
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener("click", () => {
            const maxPages = Math.ceil(totalRicette / itemsPerPage);
            if (currentPage < maxPages) {
                currentPage++;
                window.history.pushState(null, '', `?q=${encodeURIComponent(currentQuery)}&page=${currentPage}`);
                fetchAndDisplayRecipes(currentQuery, currentPage, itemsPerPage);
                updateSearchDisplay(currentQuery); 
            }
        });
    }

    // --- Inizializzazione: Carica i risultati basandosi sui parametri URL all'apertura della pagina ---
    const initialQuery = getQueryParam('q') || '';
    const initialPage = parseInt(getQueryParam('page')) || 1;

    currentQuery = initialQuery;
    currentPage = initialPage;

    updateSearchDisplay(initialQuery); // Aggiorna il titolo "Hai cercato: "
    fetchAndDisplayRecipes(currentQuery, currentPage, itemsPerPage); // Avvia la ricerca iniziale
})