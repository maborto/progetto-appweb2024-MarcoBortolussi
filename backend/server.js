const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Middleware per parse del body delle richieste in formato JSON
app.use(express.json());

// Middleware di autenticazione per le rotte protette
function authenticateToken(req, res, next) {
    const authHeader = req.headers['x-auth-token'];
    if (!authHeader) {
        return res.status(401).json({ message: "Accesso negato. Token di autenticazione mancante." });
    }

    // il token è l'userId
    req.userId = authHeader; // Aggiunge l'userId all'oggetto richiesta
    
    // verifica se l'userId esiste effettivamente nel tuo array di utenti
    const userExists = users.some(u => u.id === req.userId);
    if (!userExists) {
        return res.status(403).json({ message: "Token di autenticazione non valido o utente non esistente." });
    }
    next();
}

// Serve i file statici (CSS, JS, immagini ecc.) dalla cartella 'frontend'
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/docs', express.static('docs'));


// --- Gestione Utenti e Autenticazione ---
let users = [];
const usersFilePath = path.join(__dirname,'..', 'data', 'users.json');
const favoritesFilePath = path.join(__dirname,'..',  'data', 'favorites.json');

// Carica gli utenti all'avvio del server
fs.readFile(usersFilePath, 'utf8', (err, data) => {
    if (!err) {
        try {
            users = JSON.parse(data);
        } catch (parseErr) {
        }
    }
});

// Funzione per salvare gli utenti nel file JSON
function saveUsers() {
    fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf8', (err) => {
        if (err) {
            console.error("Errore nella scrittura di users.json:", err);
        } 
    });
}

// Funzione per salvare i preferiti nel file JSON
function saveFavorites(favoritesData) {
    fs.writeFile(favoritesFilePath, JSON.stringify(favoritesData, null, 2), 'utf8', (err) => {
        if (err) {
            console.error("Errore nella scrittura di favorites.json:", err);
        }
    });
}

// Endpoint POST /login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        // Usiamo l'ID dell'utente come token.
        res.json({ message: "Login effettuato con successo!", authToken: user.id });
    } else {
        res.status(401).json({ message: "Credenziali non valide." });
    }
});

// ENDPOINT: POST /register
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username e password sono obbligatori." });
    }

    // Controlla se l'username esiste già (case-insensitive)
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(409).json({ message: "Username già in uso. Scegliere un altro username." });
    }

    // Genera un nuovo ID per l'utente (semplice incremento)
    const newId = users.length > 0 ? Math.max(...users.map(u => parseInt(u.id.replace('user', '')) || 0)) + 1 : 1;
    const newUser = { id: `user${newId}`, username, password }; // ID come "user1", "user2"

    users.push(newUser);
    saveUsers(); // Salva l'array aggiornato su users.json

    res.status(201).json({ message: "Registrazione avvenuta con successo!", userId: newUser.id });
});


// --- Fine Gestione Utenti e Autenticazione ---


// Rotte per servire le pagine HTML
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, '..', 'frontend', 'main', 'index.html');
    res.sendFile(filePath);
});

app.get('/search-results', (req, res) => {
    const filePath = path.join(__dirname, '..', 'frontend', 'search-result', 'index.html');
    res.sendFile(filePath);
});

// Rotta per la pagina dei preferiti
app.get('/preferiti', (req, res) => {
    const filePath = path.join(__dirname, '..', 'frontend', 'preferiti', 'index.html');
    res.sendFile(filePath);
});

// Rotta per la pagina del singolo piatto
app.get('/piatti/:id', (req, res) => { 
    const filePath = path.join(__dirname, '..', 'frontend', 'piatti', 'index.html');
    res.sendFile(filePath);
});

// Rotta per la pagina delle categorie 
app.get('/categoria/:category', (req, res) => {
    const filePath = path.join(__dirname, '..', 'frontend', 'categoria', 'index.html');
    res.sendFile(filePath);
});


// Endpoint per ottenere le ricette (con filtro categoria, ricerca e paginazione)
app.get('/api/ricette', (req, res) => {
    const recipesFilePath = path.join(__dirname,'..', 'data', 'ricette.json');

    if (!fs.existsSync(recipesFilePath)) {
        return res.json({ results: [], total: 0 });
    }

    fs.readFile(recipesFilePath, 'utf8', (err, rawData) => {
        if (err) {
            return res.status(500).json({ message: "Errore interno del server durante la lettura del file ricette." });
        }

        let ricette = [];
        try {
            ricette = JSON.parse(rawData);
        } catch (parseErr) {
            return res.status(500).json({ message: "Errore di formato nel file ricette.json. Controlla il JSON." });
        }

        const categoriaRichiesta = req.query.categoria;
        let filteredRicette = ricette;

        if (categoriaRichiesta) {
            filteredRicette = filteredRicette.filter(r => r.categoria.toLowerCase() === categoriaRichiesta.toLowerCase());
        }

        const searchQuery = req.query.q ? req.query.q.toLowerCase() : '';

        if (searchQuery) {
            filteredRicette = filteredRicette.filter(r =>
                r.nome.toLowerCase().includes(searchQuery) ||
                (r.descrizione && r.descrizione.toLowerCase().includes(searchQuery)) || r.categoria.toLowerCase().includes(searchQuery)
            );
        }

        const totalResults = filteredRicette.length;
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;

        const paginatedRicette = filteredRicette.slice(offset, offset + limit);

        res.json({
            results: paginatedRicette,
            total: totalResults
        });
    });
});


// Endpoint per cercare una ricetta per ID
app.get('/api/ricette/:id', (req, res) => {
    const recipesFilePath = path.join(__dirname,'..',  'data', 'ricette.json');
    const requestedId = parseInt(req.params.id);

    if (isNaN(requestedId)) {
        return res.status(400).json({ message: "ID ricetta non valido." });
    }

    fs.readFile(recipesFilePath, 'utf8', (err, rawData) => {
        if (err) {
            return res.status(500).json({ message: "Errore interno del server." });
        }

        let ricette = [];
        try {
            ricette = JSON.parse(rawData);
        } catch (parseErr) {
            return res.status(500).json({ message: "Errore di formato nel file ricette.json." });
        }

        const foundRecipe = ricette.find(r => r.id === requestedId);

        if (foundRecipe) {
            res.json(foundRecipe);
        } else {
            res.status(404).json({ message: "Ricetta non trovata." });
        }
    });
});

// --- ENDPOINT PER I PREFERITI (Con authenticateToken) ---

// GET /api/favorites - Ottiene gli ID dei preferiti dell'utente autenticato
app.get('/api/favorites', authenticateToken, (req, res) => {
    const userId = req.userId;

    fs.readFile(favoritesFilePath, 'utf8', (err, rawData) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // Se il file non esiste
                return res.json({ favorites: [] });
            }
            return res.status(500).json({ message: "Errore interno del server." });
        }

        let favorites = {};
        try {
            favorites = JSON.parse(rawData);
        } catch (parseErr) {
            return res.status(500).json({ message: "Errore di formato nel file favorites.json. Controlla il JSON." });
        }

        // Restituisce l'array di preferiti per l'userId corrente, o un array vuoto se non esiste
        res.json({ favorites: favorites[userId] || [] });
    });
});

// POST /api/favorites - Aggiunge un piatto ai preferiti dell'utente autenticato
app.post('/api/favorites', authenticateToken, (req, res) => {
    const userId = req.userId;
    const { recipeId } = req.body;

    if (!recipeId) {
        return res.status(400).json({ message: "ID ricetta mancante nel corpo della richiesta." });
    }

    fs.readFile(favoritesFilePath, 'utf8', (err, rawData) => {
        let favorites = {};
        if (err) {
            if (err.code === 'ENOENT') {
                favorites = {}; // Inizializza oggetto vuoto se il file non esiste
            } else {
                return res.status(500).json({ message: "Errore interno del server." });
            }
        } else {
            try {
                favorites = JSON.parse(rawData);
            } catch (parseErr) {
                return res.status(500).json({ message: "Errore di formato nel file favorites.json." });
            }
        }

        // Assicurati che l'array dei preferiti per l'utente esista
        if (!favorites[userId]) {
            favorites[userId] = [];
        }

        // Aggiungi l'ID della ricetta solo se non è già presente
        if (!favorites[userId].includes(recipeId)) {
            favorites[userId].push(recipeId);
        } else {
            return res.status(409).json({ message: "Ricetta già presente nei preferiti." });
        }

        fs.writeFile(favoritesFilePath, JSON.stringify(favorites, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ message: "Errore interno del server durante il salvataggio dei preferiti." });
            }
            res.status(200).json({ message: "Ricetta aggiunta ai preferiti con successo!" });
        });
    });
});

// DELETE /api/favorites/:recipeId - Rimuove un piatto dai preferiti dell'utente autenticato
app.delete('/api/favorites/:recipeId', authenticateToken, (req, res) => {
    const userId = req.userId;
    const recipeIdToRemove = parseInt(req.params.recipeId);

    if (isNaN(recipeIdToRemove)) {
        return res.status(400).json({ message: "ID ricetta non valido." });
    }

    fs.readFile(favoritesFilePath, 'utf8', (err, rawData) => {
        let favorites = {};
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).json({ message: "Nessun preferito trovato per questo utente." });
            }
            return res.status(500).json({ message: "Errore interno del server." });
        }

        try {
            favorites = JSON.parse(rawData);
        } catch (parseErr) {
            return res.status(500).json({ message: "Errore di formato nel file favorites.json." });
        }

        if (!favorites[userId]) {
            return res.status(404).json({ message: "Nessun preferito trovato per questo utente." });
        }

        const initialLength = favorites[userId].length;
        favorites[userId] = favorites[userId].filter(id => id !== recipeIdToRemove);

        if (favorites[userId].length === initialLength) {
            return res.status(404).json({ message: "Ricetta non trovata nei preferiti dell'utente." });
        }

        fs.writeFile(favoritesFilePath, JSON.stringify(favorites, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ message: "Errore interno del server durante il salvataggio dei preferiti." });
            }
            res.status(200).json({ message: "Ricetta rimossa dai preferiti con successo." });
        });
    });
});


// GET /api/users/current - Ottiene i dati dell'utente corrente
app.get('/api/users/current', authenticateToken, (req, res) => {
    const userId = req.userId;
    const user = users.find(u => u.id === userId);

    if (user) {
        const { password, ...userData } = user;
        res.json(userData);
    } else {
        res.status(404).json({ message: "Utente non trovato." });
    }
});

// PUT /api/users/:userId - Aggiorna il profilo utente
app.put('/api/users/:userId', authenticateToken, (req, res) => {
    const userId = req.params.userId;
    const { username, currentPassword, newPassword } = req.body;

    if (req.userId !== userId) { // Assicurati che l'utente stia modificando il proprio profilo
        return res.status(403).json({ message: "Non autorizzato a modificare questo profilo." });
    }

    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ message: "Utente non trovato." });
    }

    const user = users[userIndex];

    // Verifica la password attuale
    if (user.password !== currentPassword) {
        return res.status(401).json({ message: "Password attuale errata." });
    }

    // Aggiorna username se fornito e diverso
    if (username && username !== user.username) {
        // Controlla se il nuovo username è già in uso da un altro utente
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase() && u.id !== userId)) {
            return res.status(409).json({ message: "Il nuovo username è già in uso." });
        }
        user.username = username;
    }

    // Aggiorna password se fornita
    if (newPassword) {
        if (newPassword.length < 3) {
            return res.status(400).json({ message: "La nuova password deve essere di almeno 3 caratteri." });
        }
        user.password = newPassword;
    }

    users[userIndex] = user;
    saveUsers(); // Salva gli utenti aggiornati

    res.json({ message: "Profilo aggiornato con successo!" });
});


// NUOVO ENDPOINT: DELETE /api/users/:userId - Elimina l'account utente
app.delete('/api/users/:userId', authenticateToken, (req, res) => {
    const userIdToDelete = req.params.userId;

    // Assicurati che l'utente stia cercando di eliminare il proprio account
    if (req.userId !== userIdToDelete) {
        return res.status(403).json({ message: "Non autorizzato a eliminare questo account." });
    }

    const initialUsersLength = users.length;
    users = users.filter(u => u.id !== userIdToDelete);

    if (users.length === initialUsersLength) {
        return res.status(404).json({ message: "Utente non trovato." });
    }

    saveUsers(); // Salva l'array di utenti aggiornato

    // Rimuovi anche i preferiti dell'utente dal file favorites.json
    fs.readFile(favoritesFilePath, 'utf8', (err, rawData) => {
        if (!err) {
            try {
                let favorites = JSON.parse(rawData);
                delete favorites[userIdToDelete]; // Rimuovi la voce dell'utente
                saveFavorites(favorites); // Chiama la funzione saveFavorites
            } catch (parseErr) {
                // Non bloccare la risposta, l'utente è già stato eliminato
            }
        } 
    });

    res.status(200).json({ message: "Account eliminato con successo." });
});


// Avvia il server
app.listen(PORT, () => {
    console.log(`Server in ascolto su http://localhost:${PORT}`);
});
