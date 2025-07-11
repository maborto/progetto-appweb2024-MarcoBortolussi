Chef Per Caso

Ricettario Personale WebApp
Descrizione del Progetto

"Chef Per Caso" è un'applicazione web full-stack sviluppata per fungere da ricettario personale. Il progetto è stato realizzato seguendo i principi dell'architettura RESTful, con un back-end robusto in Node.js/Express.js e un front-end interattivo costruito con HTML, CSS e JavaScript puro. L'applicazione permette agli utenti di esplorare ricette, effettuare ricerche avanzate, gestire i propri preferiti e autenticarsi per un'esperienza personalizzata.

Istruzioni per l'Installazione e l'Esecuzione

    Clona la repository (se applicabile) o scarica i file del progetto.

    Naviga nella directory principale del progetto tramite il terminale:

    cd /percorso-alla-tua-cartella/Chef_Per_Caso

    Installa le dipendenze Node.js:

    npm install

    Questo installerà Express.js.

    Avvia il server:

    node backend/server.js

    Accedi all'applicazione: Apri il tuo browser web e naviga a:

    http://localhost:3000




Descrizione delle Route Principali
Pagine HTML (servite come file statici):

    GET /: Homepage del ricettario (servirà public/main/index.html).

    GET /categoria/:category: Pagina per visualizzare le ricette per categoria (servirà public/categoria/index.html).

    GET /preferiti: Pagina per visualizzare le ricette preferite dall'utente autenticato (servirà public/preferiti/index.html).

    GET /piatti/:id: Pagina di dettaglio per una singola ricetta (servirà public/piatti/index.html).

    GET /search-results: Pagina per visualizzare i risultati di ricerca (servirà public/search-results/index.html).

API REST:

    Autenticazione e Utenti:

        POST /register: Registra un nuovo utente.

            Request Body: { "username": "string", "password": "string" }

            Response: { "message": "...", "userId": "..." } (201 Created)

        POST /login: Effettua il login di un utente.

            Request Body: { "username": "string", "password": "string" }

            Response: { "message": "...", "authToken": "..." } (200 OK)

        GET /api/users/current: Ottiene i dati dell'utente autenticato.

            Headers: X-Auth-Token: <authToken>

            Response: { "id": "...", "username": "..." } (200 OK)

        PUT /api/users/:userId: Aggiorna il profilo utente.

            Headers: X-Auth-Token: <authToken>

            Request Body: { "username": "string", "currentPassword": "string", "newPassword": "string" } (username e newPassword sono opzionali)

            Response: { "message": "..." } (200 OK)

        DELETE /api/users/:userId: Elimina l'account utente.

            Headers: X-Auth-Token: <authToken>

            Response: { "message": "..." } (200 OK)

    Ricette (solo lettura):

        GET /api/ricette: Ottiene un elenco di ricette.

            Query Params: q (stringa di ricerca), categoria (filtro categoria), limit (numero max risultati, default 10), offset (indice di partenza, default 0).

            Response: { "results": [], "total": 0 } (200 OK)

        GET /api/ricette/:id: Ottiene i dettagli di una singola ricetta.

            Response: { "id": ..., "nome": "...", ... } (200 OK)

    Preferiti:

        GET /api/favorites: Ottiene le ricette preferite dell'utente autenticato.

            Headers: X-Auth-Token: <authToken>

            Response: { "favorites": [] } (200 OK)

        POST /api/favorites: Aggiunge una ricetta ai preferiti.

            Headers: X-Auth-Token: <authToken>

            Request Body: { "recipeId": "number" }

            Response: { "message": "..." } (200 OK)

        DELETE /api/favorites/:recipeId: Rimuove una ricetta dai preferiti.

            Headers: X-Auth-Token: <authToken>

            Response: { "message": "..." } (200 OK)


Esempi di Richieste API
Registrazione Utente:

curl -X POST -H "Content-Type: application/json" -d '{"username": "testuser", "password": "password123"}' http://localhost:3000/register
Risposta:
{"message":"Registrazione avvenuta con successo!","userId":"user6"}


Login Utente:

curl -X POST -H "Content-Type: application/json" -d '{"username": "testuser", "password": "password123"}' http://localhost:3000/login
Risposta:
{"message":"Login effettuato con successo!","authToken":"user6"}


Ottenere Ricette:

curl http://localhost:3000/api/ricette/1
Risposta:

{"id":1,"categoria":"Antipasto","nome":"Bruschetta al Pomodoro","descrizione":"Quale miglior piatto per una calda estate se non la Bruschetta al Pomodoro, un classico intramontabile della cucina italiana, perfetto per iniziare un pasto o come spuntino leggero e saporito. La sua semplicità esalta la freschezza degli ingredienti.","immagine":"/img/bruschetta.jpg","ingredienti":["pane casereccio a fette","pomodori maturi","aglio fresco","olio extravergine d'oliva di qualità","foglie di basilico fresco","sale fino"],"istruzioni":"Per prima cosa, procurati del buon pane casereccio e taglialo a fette non troppo sottili. Tosta le fette di pane in una padella antiaderente, su una griglia, o in forno fino a che non saranno leggermente dorate e croccanti. Prendi uno spicchio d'aglio e strofinalo energicamente su tutta la superficie di ogni fetta di pane ancora calda, in modo da insaporirla bene. In una ciotola, taglia i pomodori maturi a cubetti piccoli e regolari. Condisci i pomodori con abbondante olio extravergine d'oliva, un pizzico di sale e le foglie di basilico fresco spezzettate a mano. Mescola bene il tutto. Infine, distribuisci generosamente il composto di pomodori sulle fette di pane tostato e servi immediatamente. Puoi aggiungere un ulteriore filo d'olio a crudo prima di servire per un tocco in più.","calorie":150,"tempo":10}


Aggiungere un Preferito:

curl -X POST -H "Content-Type: application/json" -H "X-Auth-Token: user6" -d '{"recipeId": 1}' http://localhost:3000/api/favorites
Risposta:
{"message":"Ricetta aggiunta ai preferiti con successo!"}

