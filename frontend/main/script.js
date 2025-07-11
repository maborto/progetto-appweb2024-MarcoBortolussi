document.addEventListener("DOMContentLoaded", async () => {
    // Riferimenti agli elementi del DOM per il modal di aggiunta ricetta
    const bottoneMenuGiorno = document.getElementById("menu-btn");

    // Riferimenti agli elementi del DOM per la ricerca principale
    const searchInput = document.getElementById("search-input"); 
    const searchButton = document.getElementById("search-button"); 

    // Riferimenti per il bottone "I Miei Preferiti"
    const favoritesLinkBtn = document.getElementById("favorites-link-btn");

    
    // --- Funzionalità di Ricerca ---
    async function performSearch() {
        const query = searchInput ? searchInput.value.trim() : '';

        // Se la query è vuota, reindirizza per mostrare tutti i piatti.
        if (query.length === 0) {
            window.location.href = `/search-results`; 
            return;
        }

        // Altrimenti, reindirizza alla pagina dei risultati di ricerca con la query
        window.location.href = `/search-results?q=${encodeURIComponent(query)}`;
    }


    // --- Listener di Eventi ---

    // Listener per il bottone "Aggiungi Piatto"
    if (bottoneMenuGiorno) {
        bottoneMenuGiorno.addEventListener("click", function() {
            // Reindirizza l'utente alla pagina menu_del_giorno.html
            window.location.href = "/menu-del-giorno/index.html";
    });
}

    // Listener per il bottone "Cerca" e input di ricerca
    if (searchButton && searchInput) {
        
        searchButton.addEventListener("click", performSearch);

        searchInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                performSearch();
            }
        });
    }

    // Listener per il bottone "I Miei Preferiti"
    if (favoritesLinkBtn) {
        favoritesLinkBtn.addEventListener("click", () => {
            window.location.href = "/preferiti";
        });
    }


});
