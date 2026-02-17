// Admin UI Management

const adminUI = {
    currentPlayer: null,
    modal: null,

    init() {
        this.modal = new bootstrap.Modal(document.getElementById('playerModal'));
        this.setupEventListeners();
        this.checkAuth();
    },

    setupEventListeners() {
        document.getElementById('adminFab').addEventListener('click', () => this.showLogin());
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('backToAppBtn').addEventListener('click', () => this.backToApp());
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
        document.getElementById('addPlayerBtn').addEventListener('click', () => this.showAddPlayer());
        document.getElementById('savePlayerBtn').addEventListener('click', () => this.savePlayer());
    },

    async checkAuth() {
        const session = await supabase.getSession();
        if (session) {
            this.showManageScreen();
        }
    },

    showLogin() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('loginScreen').classList.add('active');
    },

    backToApp() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('selectionScreen').classList.add('active');
    },

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('emailInput').value;
        const messageEl = document.getElementById('loginMessage');
        
        try {
            await supabase.signInWithOtp(email);
            messageEl.className = 'alert alert-success';
            messageEl.textContent = 'Magic link inviato! Controlla la tua email.';
            messageEl.style.display = 'block';
        } catch (error) {
            messageEl.className = 'alert alert-danger';
            messageEl.textContent = 'Errore nell\'invio del link. Riprova.';
            messageEl.style.display = 'block';
        }
    },

    async handleLogout() {
        await supabase.signOut();
        this.backToApp();
    },

    async showManageScreen() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('manageScreen').classList.add('active');
        await this.loadManagePlayers();
    },

    async loadManagePlayers() {
        const players = await supabase.getPlayers();
        const container = document.getElementById('managePlayers');
        container.innerHTML = '';

        players.forEach(player => {
            const overall = generator.calculateOverall(player).toFixed(1);
            const item = document.createElement('div');
            item.className = 'manage-player-item';
            item.innerHTML = `
                <div class="manage-player-info">
                    <div class="player-name">${player.nome}</div>
                    <div class="player-role">${player.ruolo} - Overall: ${overall}</div>
                </div>
                <div class="manage-player-actions">
                    <button class="btn btn-edit" data-id="${player.id}">
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button class="btn btn-delete" data-id="${player.id}">
                        <i class="bi bi-trash-fill"></i>
                    </button>
                </div>
            `;

            item.querySelector('.btn-edit').addEventListener('click', () => this.editPlayer(player));
            item.querySelector('.btn-delete').addEventListener('click', () => this.deletePlayer(player.id));

            container.appendChild(item);
        });
    },

    showAddPlayer() {
        this.currentPlayer = null;
        document.getElementById('modalTitle').textContent = 'Aggiungi Giocatore';
        document.getElementById('playerForm').reset();
        document.getElementById('playerId').value = '';
        this.modal.show();
    },

    editPlayer(player) {
        this.currentPlayer = player;
        document.getElementById('modalTitle').textContent = 'Modifica Giocatore';
        document.getElementById('playerId').value = player.id;
        document.getElementById('playerName').value = player.nome;
        document.getElementById('playerRole').value = player.ruolo;
        document.getElementById('playerForma').value = player.forma;
        document.getElementById('playerDifesa').value = player.difesa;
        document.getElementById('playerPassaggi').value = player.passaggi;
        document.getElementById('playerAttacco').value = player.attacco;
        document.getElementById('playerDribbling').value = player.dribbling;
        this.modal.show();
    },

    async savePlayer() {
        const form = document.getElementById('playerForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const playerData = {
            nome: document.getElementById('playerName').value,
            ruolo: document.getElementById('playerRole').value,
            forma: parseInt(document.getElementById('playerForma').value),
            difesa: parseInt(document.getElementById('playerDifesa').value),
            passaggi: parseInt(document.getElementById('playerPassaggi').value),
            attacco: parseInt(document.getElementById('playerAttacco').value),
            dribbling: parseInt(document.getElementById('playerDribbling').value)
        };

        try {
            const playerId = document.getElementById('playerId').value;
            if (playerId) {
                await supabase.updatePlayer(playerId, playerData);
            } else {
                await supabase.addPlayer(playerData);
            }

            this.modal.hide();
            await this.loadManagePlayers();
        } catch (error) {
            alert('Errore nel salvataggio del giocatore');
            console.error(error);
        }
    },

    async deletePlayer(id) {
        if (!confirm('Sei sicuro di voler eliminare questo giocatore?')) {
            return;
        }

        try {
            await supabase.deletePlayer(id);
            await this.loadManagePlayers();
        } catch (error) {
            alert('Errore nella cancellazione del giocatore');
            console.error(error);
        }
    }
};
