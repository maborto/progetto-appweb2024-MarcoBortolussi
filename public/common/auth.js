
// Funzione per ottenere un parametro dalla URL.
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function getAuthToken() {
    return localStorage.getItem('authToken');
}

function showCustomMessage(message, type = 'info', autoHide = true, duration = 3000) {
    const messageBox = document.getElementById('customMessageBox');
    const messageTextElement = document.getElementById('customMessageText');
    const okButton = document.getElementById('customMessageOkButton');

    if (!messageBox || !messageTextElement || !okButton) {
        alert(`[${type.toUpperCase()}]: ${message}`); 
        return;
    }

    // Pulisci classi precedenti e imposta il testo
    messageBox.className = 'custom-message-box'; // Resetta tutte le classi
    messageTextElement.textContent = message; // Imposta il testo nello span dedicato

    // Aggiungi la classe del tipo di messaggio
    messageBox.classList.add(type);

    // Mostra il messaggio con l'animazione
    messageBox.classList.add('show');
    messageBox.style.display = 'flex'; // Usa flex per la nuova layout

    // Gestione del pulsante OK
    okButton.onclick = () => {
        messageBox.classList.remove('show');
        // Aspetta che l'animazione di fade-out finisca prima di nascondere completamente
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 300); // Durata della transizione CSS
    };

    // Se autoHide è true, imposta un timeout per nascondere il messaggio
    if (autoHide) {
        setTimeout(() => {
            messageBox.classList.remove('show');
            setTimeout(() => {
                messageBox.style.display = 'none';
            }, 300); // Durata della transizione CSS
        }, duration);
    }
}

// Funzione per notificare le altre parti dell'applicazione del cambio stato auth
function dispatchAuthStatusChanged() {
    window.dispatchEvent(new CustomEvent('authStatusChanged'));
}


document.addEventListener("DOMContentLoaded", () => {
    // Riferimenti per il Modale di Autenticazione (Login/Registrazione)
    const headerLoginBtn = document.getElementById("header-login-btn");
    const authModal = document.getElementById("auth-modal");
    const closeButtonAuth = authModal ? authModal.querySelector(".close-button") : null;
    const customConfirmModalElement = document.getElementById('customConfirmModal');

    // Riferimenti per il form di Login
    const loginFormContainer = document.getElementById("login-form-container");
    const loginUsernameInput = document.getElementById("login-username");
    const loginPasswordInput = document.getElementById("login-password");
    const loginSubmitBtn = document.getElementById("login-submit-btn");
    const loginMessage = document.getElementById("login-message");
    const showRegisterLink = document.getElementById("show-register");

    // Riferimenti per il form di Registrazione
    const registerFormContainer = document.getElementById("register-form-container");
    const registerUsernameInput = document.getElementById("register-username");
    const registerPasswordInput = document.getElementById("register-password");
    const registerConfirmPasswordInput = document.getElementById("register-confirm-password");
    const registerSubmitBtn = document.getElementById("register-submit-btn");
    const registerMessage = document.getElementById("register-message");
    const showLoginLink = document.getElementById("show-login");

    // RIFERIMENTI per Modifica Profilo
    const editProfileBtn = document.getElementById("edit-profile-btn");
    const profileModal = document.getElementById("profile-modal");
    const profileCloseButton = profileModal ? profileModal.querySelector(".profile-close-button") : null;
    const profileUsernameInput = document.getElementById("profile-username");
    const profileCurrentPasswordInput = document.getElementById("profile-current-password");
    const profileNewPasswordInput = document.getElementById("profile-new-password");
    const profileConfirmNewPasswordInput = document.getElementById("profile-confirm-new-password");
    const profileSaveBtn = document.getElementById("profile-save-btn");
    const profileMessage = document.getElementById("profile-message");
    const deleteAccountBtn = document.getElementById("delete-account-btn");

    // Ottieni l'elemento header
    const headerElement = document.querySelector('header');


    // Funzione per mostrare un messaggio di conferma "Sì/No"
    function showConfirmMessage(message, onConfirmCallback, onCancelCallback) {
        const confirmModal = document.getElementById('customConfirmModal');
        const confirmMessageElement = document.getElementById('customConfirmMessage');
        const confirmYesButton = document.getElementById('confirmYesButton');
        const confirmNoButton = document.getElementById('confirmNoButton');

        if (!confirmModal || !confirmMessageElement || !confirmYesButton || !confirmNoButton) {
            // Fallback al confirm nativo se gli elementi non ci sono
            if (confirm(message)) {
                if (onConfirmCallback) onConfirmCallback();
            } else {
                if (onCancelCallback) onCancelCallback();
            }
            return;
        }

        confirmMessageElement.textContent = message;

        // Imposta il listener per il pulsante "Sì"
        confirmYesButton.onclick = () => {
            confirmModal.classList.remove('show'); // Avvia l'animazione di fade-out
            setTimeout(() => {
                confirmModal.style.display = 'none'; // Nascondi completamente
                if (onConfirmCallback) onConfirmCallback(); // Esegui la callback di conferma passata come argomento
                // Pulisci i listener per evitare esecuzioni multiple in futuro
                confirmYesButton.onclick = null;
                confirmNoButton.onclick = null;
            }, 300); // Corrisponde alla durata della transizione CSS
        };

        // Imposta il listener per il pulsante "No"
        confirmNoButton.onclick = () => {
            confirmModal.classList.remove('show'); // Avvia l'animazione di fade-out
            setTimeout(() => {
                confirmModal.style.display = 'none'; // Nascondi completamente
                if (onCancelCallback) onCancelCallback(); // Esegui la callback di annullamento
                // Pulisci i listener
                confirmYesButton.onclick = null;
                confirmNoButton.onclick = null;
            }, 300); // Corrisponde alla durata della transizione CSS
        };

        // Mostra la modale
        confirmModal.style.display = 'flex'; // Imposta display a flex per renderla visibile
        setTimeout(() => {
            confirmModal.classList.add('show'); // Aggiungi la classe per l'animazione di fade-in
        }, 10); 
    };

    // Listener per chiudere la modale di conferma cliccando sullo sfondo
    if (customConfirmModalElement) {
        customConfirmModalElement.addEventListener('click', (event) => {
            if (event.target === customConfirmModalElement) {
                customConfirmModalElement.classList.remove('show');
                setTimeout(() => {
                    customConfirmModalElement.style.display = 'none';
                }, 300);
            }
        });
    }

    // Funzioni per la gestione del Modale di Autenticazione 

    function openAuthModal() {
        if (authModal) authModal.style.display = "flex";
        showLoginForm(); // Mostra il form di login 
    }

    function closeAuthModal() {
        if (authModal) authModal.style.display = "none";

        // Pulisci i campi e i messaggi di stato
        if (loginUsernameInput) loginUsernameInput.value = '';
        if (loginPasswordInput) loginPasswordInput.value = '';
        if (registerUsernameInput) registerUsernameInput.value = '';
        if (registerPasswordInput) registerPasswordInput.value = '';
        if (registerConfirmPasswordInput) registerConfirmPasswordInput.value = '';
        if (loginMessage) loginMessage.textContent = '';
        if (registerMessage) registerMessage.textContent = '';
    }

    function showLoginForm() {
        if (loginFormContainer) loginFormContainer.style.display = "block";
        if (registerFormContainer) registerFormContainer.style.display = "none";
        if (loginMessage) loginMessage.textContent = '';
    }

    function showRegisterForm() {
        if (loginFormContainer) loginFormContainer.style.display = "none";
        if (registerFormContainer) registerFormContainer.style.display = "block";
        if (registerMessage) registerMessage.textContent = '';
    }

    // Aggiorna il bottone Login/Logout e Modifica Profilo nell'header
    async function updateHeaderLoginButton() {
        const token = getAuthToken();
        if (headerLoginBtn) {
            if (token) {
                headerLoginBtn.textContent = 'Logout';
                // MOSTRA IL BOTTONE MODIFICA PROFILO QUANDO LOGGATO
                if (editProfileBtn) editProfileBtn.style.display = 'inline-block';
                // AGGIUNGI CLASSE ALL'HEADER PER IL CENTRAMENTO
                if (headerElement) headerElement.classList.add('logged-in');
            } else {
                headerLoginBtn.textContent = 'Login';
                // NASCONDI IL BOTTONE MODIFICA PROFILO QUANDO NON LOGGATO
                if (editProfileBtn) editProfileBtn.style.display = 'none';
                // RIMUOVI CLASSE DALL'HEADER PER IL CENTRAMENTO
                if (headerElement) headerElement.classList.remove('logged-in');
            }
        }

        // Se l'utente è loggato, recupera l'username per pre-compilare il campo
        if (token && profileUsernameInput) {
            try {
                const response = await fetch('/api/users/current', { 
                    headers: { 'X-Auth-Token': token }
                });
                if (response.ok) {
                    const userData = await response.json();
                    profileUsernameInput.value = userData.username || '';
                } else {
                    profileUsernameInput.value = '';
                }
            } catch (error) {

                profileUsernameInput.value = '';
            }
        }
    }

    // --- Logica di Login ---
    async function handleLogin() {
        const username = loginUsernameInput ? loginUsernameInput.value.trim() : '';
        const password = loginPasswordInput ? loginPasswordInput.value.trim() : '';

        if (!username || !password) {
            if (loginMessage) loginMessage.textContent = "Per favore, inserisci username e password.";
            return;
        }

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('authToken', data.authToken);
                if (loginMessage) {
                    loginMessage.textContent = data.message;
                    loginMessage.style.color = 'green';
                }
                await updateHeaderLoginButton(); // Attendi l'aggiornamento del bottone e il recupero username
                dispatchAuthStatusChanged(); // EMETTI L'EVENTO QUI DOPO IL LOGIN
                setTimeout(closeAuthModal, 1500);
            } else {
                if (loginMessage) {
                    loginMessage.textContent = data.message || "Errore durante il login.";
                    loginMessage.style.color = 'red';
                }
            }
        } catch (error) {
            if (loginMessage) {
                loginMessage.textContent = "Errore di rete durante il login.";
                loginMessage.style.color = 'red';
            }
        }
    }

    // --- Logica di Registrazione ---
    async function handleRegister() {
        const username = registerUsernameInput ? registerUsernameInput.value.trim() : '';
        const password = registerPasswordInput ? registerPasswordInput.value.trim() : '';
        const confirmPassword = registerConfirmPasswordInput ? registerConfirmPasswordInput.value.trim() : '';

        if (!username || !password || !confirmPassword) {
            if (registerMessage) registerMessage.textContent = "Per favore, compila tutti i campi.";
            return;
        }
        if (password !== confirmPassword) {
            if (registerMessage) registerMessage.textContent = "Le password non corrispondono.";
            return;
        }
        if (password.length < 3) {
            if (registerMessage) registerMessage.textContent = "La password deve essere di almeno 3 caratteri.";
            return;
        }

        const hasNumber = /\d/.test(password);
        if (!hasNumber && registerMessage) {
            registerMessage.textContent = "La password deve contenere almeno un numero.";
            registerMessage.style.color = 'red';
            return;
        }

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (response.ok) {
                if (registerMessage) {
                    registerMessage.textContent = data.message;
                    registerMessage.style.color = 'green';
                }
                // Tenta il login automatico dopo la registrazione
                try {
                    const loginResponse = await fetch('/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    const loginData = await loginResponse.json();

                    if (loginResponse.ok) {
                        localStorage.setItem('authToken', loginData.authToken);
                        await updateHeaderLoginButton();
                        dispatchAuthStatusChanged();
                        setTimeout(closeAuthModal, 1000); // Chiudi il modale dopo un breve ritardo
                    } 
                } catch (loginError) {
                    showCustomMessage("Registrazione avvenuta con successo, ma si è verificato un errore di rete durante il login automatico. Per favor, effettua il login manualmente.", 'error', true, 3000);
                    showLoginForm(); // Reindirizza al form di login manuale
                }
            } else {
                if (registerMessage) {
                    registerMessage.textContent = data.message || "Errore durante la registrazione.";
                    registerMessage.style.color = 'red';
                }
            }
        } catch (error) {
            if (registerMessage) {
                registerMessage.textContent = "Errore di rete durante la registrazione.";
                registerMessage.style.color = 'red';
            }
        }
    }

    // --- Logica di Modifica Profilo ---
    async function openProfileModal() {
        if (profileModal) profileModal.style.display = "flex";
        if (profileMessage) profileMessage.textContent = ''; // Pulisci eventuali messaggi precedenti

        // Pulisci i campi password quando apri il modale per sicurezza
        if (profileCurrentPasswordInput) profileCurrentPasswordInput.value = '';
        if (profileNewPasswordInput) profileNewPasswordInput.value = '';
        if (profileConfirmNewPasswordInput) profileConfirmNewPasswordInput.value = '';

        await updateHeaderLoginButton(); // Questo recupera l'username e lo imposta in profileUsernameInput
    }

    function closeProfileModal() {
        if (profileModal) profileModal.style.display = "none";

        // Pulisci tutti i campi del form di modifica profilo alla chiusura
        if (profileUsernameInput) profileUsernameInput.value = '';
        if (profileCurrentPasswordInput) profileCurrentPasswordInput.value = '';
        if (profileNewPasswordInput) profileNewPasswordInput.value = '';
        if (profileConfirmNewPasswordInput) profileConfirmNewPasswordInput.value = '';
        if (profileMessage) profileMessage.textContent = '';
    }

    async function handleProfileSave() {
        const authToken = getAuthToken();
        if (!authToken) {
            showCustomMessage("Non sei autenticato. Effettua il login.", 'error');
            return;
        }

        const newUsername = profileUsernameInput ? profileUsernameInput.value.trim() : '';
        const currentPassword = profileCurrentPasswordInput ? profileCurrentPasswordInput.value.trim() : '';
        const newPassword = profileNewPasswordInput ? profileNewPasswordInput.value.trim() : '';
        const confirmNewPassword = profileConfirmNewPasswordInput ? profileConfirmNewPasswordInput.value.trim() : '';

        if (!newUsername || !currentPassword) {
            showCustomMessage("Username e Password Attuale sono obbligatori.", 'error');
            return;
        }

        if (newPassword && newPassword !== confirmNewPassword) {
            showCustomMessage("Le nuove password non corrispondono.", 'error');
            return;
        }

        if (newPassword && newPassword.length < 3) {
            showCustomMessage("La nuova password deve essere di almeno 3 caratteri.", 'error');
            return;
        }

        const hasNumber = /\d/.test(newPassword);
        if (!hasNumber && registerMessage) {
            showCustomMessage("La password deve contenere almeno un numero.", 'error');
            registerMessage.style.color = 'red';
            return;
        }

        const payload = {
            username: newUsername,
            currentPassword: currentPassword
        };
        
        if (newPassword) {
            payload.newPassword = newPassword;
        }

        try {
            const response = await fetch(`/api/users/${authToken}`, { // authToken è l'userId
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': authToken
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (response.ok) {
                showCustomMessage(data.message || "Profilo aggiornato con successo!", 'success', true);
                setTimeout(() => {
                    closeProfileModal();
                    updateHeaderLoginButton(); // Aggiorna lo stato del bottone (es. se username cambia)
                    dispatchAuthStatusChanged(); // Notifica altre pagine di un potenziale cambio di stato
                }, 1500);
            } else {
                showCustomMessage(data.message || "Errore durante l'aggiornamento del profilo.", 'error');
            }
        } catch (error) {
            showCustomMessage("Errore di rete durante l'aggiornamento del profilo.", 'error');
        }
    }

    // Gestione eliminazione account
    async function handleDeleteAccount() {
        const authToken = getAuthToken();
        if (!authToken) {
            showCustomMessage("Non sei autenticato. Effettua il login.", 'error');
            return;
        }

        // Chiedi conferma all'utente 
        showConfirmMessage(
            "Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile.",
            async () => { // Callback per "Sì" (Conferma)
                try {
                    const response = await fetch(`/api/users/${authToken}`, {
                        method: 'DELETE',
                        headers: {
                            'X-Auth-Token': authToken
                        }
                    });

                    if (response.ok) {
                        localStorage.removeItem('authToken'); // Logout automatico
                        showCustomMessage("Account eliminato con successo. Sarai reindirizzato alla homepage.", 'success', true);
                        dispatchAuthStatusChanged(); // Notifica il logout
                        setTimeout(() => {
                            closeProfileModal(); // Chiudi il modale "Modifica Profilo"
                            window.location.href = '/'; // Reindirizza alla homepage
                        }, 2500); // Aumentato il ritardo per rendere la chiusura più visibile
                    } else {
                        const errorData = await response.json();
                        showCustomMessage(errorData.message || "Errore durante l'eliminazione dell'account.", 'error');
                    }
                } catch (error) {
                    showCustomMessage("Errore di rete durante l'eliminazione dell'account.", 'error');
                }
            },
            () => { // Callback per "No" (Annulla)
                showCustomMessage("Eliminazione account annullata.", 'info', true); // Messaggio di annullamento
            }
        );
    }


    // --- Listener di Eventi per Auth Modal ---

    // Listener per il bottone Login/Logout nell'header
    if (headerLoginBtn) {
        headerLoginBtn.addEventListener('click', async () => {
            const token = getAuthToken();
            if (token) {
                localStorage.removeItem('authToken');
                await updateHeaderLoginButton(); // Attendi l'aggiornamento del bottone
                dispatchAuthStatusChanged(); // EMETTI L'EVENTO QUI DOPO IL LOGOUT
                showCustomMessage("Logout avvenuta con successo.", 'success', true);
                
            } else {
                openAuthModal();
            }
        });
    }

    // Listener per la "X" di chiusura del modale di autenticazione
    if (closeButtonAuth) {
        closeButtonAuth.addEventListener('click', closeAuthModal);
    }

    // Listener per chiudere il modale di autenticazione cliccando fuori
    if (authModal) {
        window.addEventListener('click', (event) => {
            if (event.target === authModal) {
                closeAuthModal();
            }
        });
    }

    // Listener per i bottoni di submit nel modale di autenticazione
    if (loginSubmitBtn) {
        loginSubmitBtn.addEventListener('click', handleLogin);
        if (loginPasswordInput) {
            loginPasswordInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    handleLogin();
                }
            });
        }
    }
    if (registerSubmitBtn) {
        registerSubmitBtn.addEventListener('click', handleRegister);
        if (registerConfirmPasswordInput) {
            registerConfirmPasswordInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    handleRegister();
                }
            });
        }
    }

    // Listener per passare tra login e registrazione
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterForm();
        });
    }
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }

    // --- Listener per Modifica Profilo ---
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', openProfileModal);
    }
    if (profileCloseButton) {
        profileCloseButton.addEventListener('click', closeProfileModal);
    }
    if (profileModal) {
        window.addEventListener('click', (event) => {
            if (event.target === profileModal) {
                closeProfileModal();
            }
        });
    }
    if (profileSaveBtn) {
        profileSaveBtn.addEventListener('click', handleProfileSave);
        // Aggiungi listener per Enter su campi password nel modale profilo
        if (profileConfirmNewPasswordInput) {
            profileConfirmNewPasswordInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    handleProfileSave();
                }
            });
        }
    }
    // Bottone Elimina Account
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    }


    // --- Inizializzazione ---
    updateHeaderLoginButton(); // Aggiorna lo stato iniziale del bottone Login/Logout e Modifica Profilo
});
