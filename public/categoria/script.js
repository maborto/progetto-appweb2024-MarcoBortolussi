document.addEventListener("DOMContentLoaded", () => {
  // Prendi la categoria dalla query string
  const params = new URLSearchParams(window.location.search);
  const categoria = params.get("categoria") || "";

  // Imposta titolo
  document.getElementById("titolo-categoria")
    .innerText = categoria ? `Ricette per ${categoria}` : "Tutte le ricette"; 

  const container = document.getElementById("lista");

  // Funzione per caricare e visualizzare le ricette
  async function loadAndDisplayRecipes() {
    if (!container) {
      return;
    }

    // Chiamata API
    const url = '/api/ricette' + (categoria ? `?categoria=${encodeURIComponent(categoria)}` : '');
    const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}limit=9999&offset=0`; // Per ottenere tutte le ricette della categoria

    try {
      const res = await fetch(fetchUrl);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const responseFromServer = await res.json();
      const ricette = responseFromServer.results;

      container.innerHTML = ""; // pulisci

      if (ricette.length === 0) {
        container.innerHTML = "<p>Nessuna ricetta trovata per questa categoria.</p>";
        return; // Esci se non ci sono ricette
      }

      ricette.forEach(piatto => {
        const card = document.createElement("article");
        card.className = "card";
        card.innerHTML = `
          <img src="${piatto.immagine}" alt="${piatto.nome}" onerror="this.onerror=null;this.src='/img/placeholder.jpg';">
          <div class="card-content">
            <h3>${piatto.nome}</h3>
            <p class="card-description">${piatto.descrizione || 'Nessuna descrizione disponibile.'}</p> 
            <p><small>${piatto.tempo} min · ${piatto.calorie} kcal</small></p>
          </div>
        `;
        container.appendChild(card);

        card.addEventListener("click", () => {
            const dishCategoryParam = categoria ? `&categoria=${encodeURIComponent(categoria)}` : '';
            window.location.href = `/piatti/index.html?id=${encodeURIComponent(piatto.id)}${dishCategoryParam}`;
        });
      });
    } catch (err) {
      if (container) {
        container.innerHTML = "<p>Errore nel caricamento delle ricette. Riprova più tardi.</p>";
      }
    }
  }

  // Chiamata iniziale per caricare le ricette
  loadAndDisplayRecipes();
});