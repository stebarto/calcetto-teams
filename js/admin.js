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
        
        // Menu hamburger
        document.getElementById('adminMenuBtn').addEventListener('click', () => this.toggleMenu());
        document.getElementById('adminMenuOverlay').addEventListener('click', () => this.closeMenu());
        
        // Menu items
        document.querySelectorAll('.admin-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.target.closest('.admin-menu-item').dataset.section;
                this.switchSection(section);
                this.closeMenu();
            });
        });
        
        // Apply suggestions button
        document.getElementById('applySuggestionsBtn').addEventListener('click', () => this.applySuggestions());
    },
    
    toggleMenu() {
        document.getElementById('adminMenu').classList.toggle('open');
        document.getElementById('adminMenuOverlay').classList.toggle('open');
    },
    
    closeMenu() {
        document.getElementById('adminMenu').classList.remove('open');
        document.getElementById('adminMenuOverlay').classList.remove('open');
    },
    
    switchSection(sectionName) {
        // Update menu items
        document.querySelectorAll('.admin-menu-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionName);
        });
        
        // Update sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        
        if (sectionName === 'players') {
            document.getElementById('playersSection').classList.add('active');
        } else if (sectionName === 'stats') {
            document.getElementById('statsSection').classList.add('active');
            this.loadAllPlayerStats();
        } else if (sectionName === 'history') {
            document.getElementById('historySection').classList.add('active');
            this.loadMatchHistory();
        }
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
        
        // Verifica email autorizzata
        if (email !== 'stebarto@gmail.com') {
            messageEl.className = 'alert alert-danger';
            messageEl.textContent = 'Email non autorizzata. Solo l\'admin può accedere.';
            messageEl.style.display = 'block';
            return;
        }
        
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
                    <button class="btn btn-stats" data-id="${player.id}" title="Statistiche">
                        <i class="bi bi-graph-up"></i>
                    </button>
                    <button class="btn btn-edit" data-id="${player.id}">
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button class="btn btn-delete" data-id="${player.id}">
                        <i class="bi bi-trash-fill"></i>
                    </button>
                </div>
            `;

            item.querySelector('.btn-stats').addEventListener('click', () => this.showPlayerStats(player));
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

    async editPlayer(player) {
        this.currentPlayer = player;
        document.getElementById('modalTitle').textContent = 'Modifica Giocatore';
        document.getElementById('playerId').value = player.id;
        document.getElementById('playerName').value = player.nome;
        document.getElementById('playerRole').value = player.ruolo;
        
        // Gestisci avatar null o undefined
        const avatarValue = player.avatar || 'moro';
        document.getElementById('playerAvatar').value = avatarValue;
        
        document.getElementById('playerForma').value = player.forma;
        document.getElementById('playerDifesa').value = player.difesa;
        document.getElementById('playerPassaggi').value = player.passaggi;
        document.getElementById('playerAttacco').value = player.attacco;
        document.getElementById('playerDribbling').value = player.dribbling;
        
        // Carica suggerimenti basati su voti recenti
        await this.loadPlayerSuggestions(player);
        
        this.modal.show();
    },
    
    async loadPlayerSuggestions(player) {
        const suggestionsBox = document.getElementById('playerSuggestions');
        const suggestionsContent = document.getElementById('suggestionsContent');
        
        try {
            // Carica ultimi 5-10 voti del giocatore con data partita
            const response = await fetch(
                `${supabase.url}/rest/v1/match_votes?player_id=eq.${player.id}&select=*,matches(data_partita)&order=match_id.desc&limit=10`,
                { headers: supabase.headers }
            );
            
            if (!response.ok) {
                console.error('Supabase error:', response.status);
                suggestionsBox.style.display = 'none';
                return;
            }
            
            const votes = await response.json();
            
            // Verifica che votes sia un array
            if (!Array.isArray(votes) || votes.length === 0) {
                suggestionsBox.style.display = 'none';
                return;
            }
            
            // Calcola medie recenti (ultime 5 partite)
            const recentVotes = votes.slice(0, 5);
            let formaSum = 0;
            let prestazioneSum = 0;
            
            recentVotes.forEach(vote => {
                formaSum += vote.voto_forma;
                prestazioneSum += vote.voto_prestazione;
            });
            
            const avgForma = formaSum / recentVotes.length;
            const avgPrestazione = prestazioneSum / recentVotes.length;
            
            // Calcola suggerimenti
            // Forma: media tra valore attuale e media voti * 3 (per scalare da 1-3 a 1-10)
            const suggestedForma = Math.round((player.forma + avgForma * 3) / 2);
            const clampedForma = Math.max(1, Math.min(10, suggestedForma));
            
            // Salva suggerimenti per applySuggestions
            this.currentSuggestions = {
                forma: clampedForma
            };
            
            // Mostra suggerimenti
            const formaClass = avgForma >= 2.5 ? 'good' : avgForma >= 2 ? 'average' : 'poor';
            const prestazioneClass = avgPrestazione >= 4 ? 'good' : avgPrestazione >= 3 ? 'average' : 'poor';
            
            suggestionsContent.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
                    <div style="background: white; padding: 8px; border-radius: 6px; border: 2px solid #ddd;">
                        <div style="font-size: 10px; color: #666; font-weight: 700;">MEDIA FORMA (ultime ${recentVotes.length})</div>
                        <div style="font-size: 18px; font-weight: 900;" class="${formaClass}">${avgForma.toFixed(1)}/3</div>
                    </div>
                    <div style="background: white; padding: 8px; border-radius: 6px; border: 2px solid #ddd;">
                        <div style="font-size: 10px; color: #666; font-weight: 700;">MEDIA PRESTAZIONE</div>
                        <div style="font-size: 18px; font-weight: 900;" class="${prestazioneClass}">${avgPrestazione.toFixed(1)}/5</div>
                    </div>
                </div>
                <div style="margin-top: 12px; padding: 10px; background: white; border-radius: 6px; border: 2px solid #4CAF50;">
                    <div style="font-size: 11px; color: #666; font-weight: 700; margin-bottom: 4px;">FORMA SUGGERITA</div>
                    <div style="font-size: 24px; font-weight: 900; color: #4CAF50;">${clampedForma}/10</div>
                    <div style="font-size: 10px; color: #666; margin-top: 4px;">Attuale: ${player.forma}/10</div>
                </div>
            `;
            
            suggestionsBox.style.display = 'block';
            
        } catch (error) {
            console.error('Errore caricamento suggerimenti:', error);
            suggestionsBox.style.display = 'none';
        }
    },
    
    applySuggestions() {
        if (!this.currentSuggestions) return;
        
        // Applica i suggerimenti ai campi del form
        if (this.currentSuggestions.forma) {
            document.getElementById('playerForma').value = this.currentSuggestions.forma;
        }
        
        // Feedback visivo
        const formaInput = document.getElementById('playerForma');
        formaInput.style.background = '#C8F35A';
        setTimeout(() => {
            formaInput.style.background = 'white';
        }, 500);
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
            avatar: document.getElementById('playerAvatar').value || 'moro',
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
            await customAlert('Errore nel salvataggio del giocatore');
            console.error(error);
        }
    },

    async deletePlayer(id) {
        const confirmed = await customConfirm('Sei sicuro di voler eliminare questo giocatore?');
        if (!confirmed) {
            return;
        }

        try {
            await supabase.deletePlayer(id);
            await this.loadManagePlayers();
        } catch (error) {
            await customAlert('Errore nella cancellazione del giocatore');
            console.error(error);
        }
    },
    
    async showPlayerStats(player) {
        try {
            // Carica voti del giocatore
            const response = await fetch(
                `${supabase.url}/rest/v1/match_votes?player_id=eq.${player.id}&select=*,matches(data_partita)&order=matches(data_partita).desc&limit=10`,
                { headers: supabase.headers }
            );
            
            const votes = await response.json();
            
            if (!votes || votes.length === 0) {
                await customAlert(`
                    <div class="no-stats">
                        <i class="bi bi-graph-up"></i>
                        <p><strong>${player.nome}</strong></p>
                        <p>Nessuna statistica disponibile.<br>Le statistiche appariranno dopo le prime votazioni.</p>
                    </div>
                `);
                return;
            }
            
            // Calcola statistiche
            let formaSum = 0;
            let prestazioneSum = 0;
            votes.forEach(vote => {
                formaSum += vote.voto_forma;
                prestazioneSum += vote.voto_prestazione;
            });
            
            const avgForma = (formaSum / votes.length).toFixed(1);
            const avgPrestazione = (prestazioneSum / votes.length).toFixed(1);
            const formaClass = avgForma >= 2.5 ? 'good' : avgForma >= 2 ? 'average' : 'poor';
            const prestazioneClass = avgPrestazione >= 4 ? 'good' : avgPrestazione >= 3 ? 'average' : 'poor';
            
            // Crea HTML per il popup
            const statsHtml = `
                <div class="player-stats-popup">
                    <div class="stat-card-header">
                        <div class="stat-player-name">${player.nome}</div>
                        <div class="stat-matches">${votes.length} partite</div>
                    </div>
                    <div class="stat-grid">
                        <div class="stat-item">
                            <div class="stat-label">Media Forma</div>
                            <div class="stat-value ${formaClass}">${avgForma}/3</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Media Prestazione</div>
                            <div class="stat-value ${prestazioneClass}">${avgPrestazione}/5</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Forma Attuale</div>
                            <div class="stat-value">${player.forma}/10</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Partite Totali</div>
                            <div class="stat-value">${votes.length}</div>
                        </div>
                    </div>
                    <div class="stat-history">
                        <div class="stat-label" style="margin-bottom: 8px;">Ultime Partite</div>
                        ${votes.slice(0, 5).map(vote => `
                            <div class="stat-history-item">
                                <span>Forma: <strong class="${vote.voto_forma >= 2.5 ? 'good' : vote.voto_forma >= 2 ? 'average' : 'poor'}">${vote.voto_forma}/3</strong></span>
                                <span>Prestazione: <strong class="${vote.voto_prestazione >= 4 ? 'good' : vote.voto_prestazione >= 3 ? 'average' : 'poor'}">${vote.voto_prestazione}/5</strong></span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            await customAlert(statsHtml);
            
        } catch (error) {
            console.error('Errore caricamento statistiche giocatore:', error);
            await customAlert('Errore nel caricamento delle statistiche');
        }
    },
    
    async loadAllPlayerStats() {
        const container = document.getElementById('playerStatsView');
        container.innerHTML = '<div class="text-center p-4"><div class="spinner-border"></div><p>Caricamento statistiche...</p></div>';
        
        try {
            // Carica tutti i voti con i dati dei giocatori
            const response = await fetch(
                `${supabase.url}/rest/v1/match_votes?select=*,giocatori(id,nome,forma,avatar)`,
                { headers: supabase.headers }
            );
            
            const votes = await response.json();
            
            if (!votes || votes.length === 0) {
                container.innerHTML = `
                    <div class="no-stats">
                        <i class="bi bi-graph-up"></i>
                        <p>Nessuna statistica disponibile.<br>Le statistiche appariranno dopo le prime votazioni.</p>
                    </div>
                `;
                return;
            }
            
            // Raggruppa voti per giocatore
            const playerStats = {};
            votes.forEach(vote => {
                const playerId = vote.player_id;
                if (!playerStats[playerId]) {
                    playerStats[playerId] = {
                        player: vote.giocatori,
                        votes: [],
                        formaSum: 0,
                        prestazioneSum: 0,
                        count: 0
                    };
                }
                playerStats[playerId].votes.push(vote);
                playerStats[playerId].formaSum += vote.voto_forma;
                playerStats[playerId].prestazioneSum += vote.voto_prestazione;
                playerStats[playerId].count++;
            });
            
            // Render statistiche
            container.innerHTML = '';
            Object.values(playerStats).forEach(stat => {
                const avgForma = (stat.formaSum / stat.count).toFixed(1);
                const avgPrestazione = (stat.prestazioneSum / stat.count).toFixed(1);
                const currentForma = stat.player.forma;
                
                // Suggerisci nuovo valore forma basato sulla media
                const suggestedForma = Math.round((currentForma + parseFloat(avgForma) * 3) / 2);
                const clampedForma = Math.max(1, Math.min(10, suggestedForma));
                
                const formaClass = avgForma >= 2.5 ? 'good' : avgForma >= 2 ? 'average' : 'poor';
                const prestazioneClass = avgPrestazione >= 4 ? 'good' : avgPrestazione >= 3 ? 'average' : 'poor';
                
                const card = document.createElement('div');
                card.className = 'stat-card';
                card.innerHTML = `
                    <div class="stat-card-header">
                        <div class="stat-player-name">${stat.player.nome}</div>
                        <div class="stat-matches">${stat.count} partite</div>
                    </div>
                    <div class="stat-grid">
                        <div class="stat-item">
                            <div class="stat-label">Media Forma</div>
                            <div class="stat-value ${formaClass}">${avgForma}/3</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Media Prestazione</div>
                            <div class="stat-value ${prestazioneClass}">${avgPrestazione}/5</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Forma Attuale</div>
                            <div class="stat-value">${currentForma}/10</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Forma Suggerita</div>
                            <div class="stat-value ${clampedForma > currentForma ? 'good' : clampedForma < currentForma ? 'poor' : ''}">${clampedForma}/10</div>
                        </div>
                    </div>
                    <div class="stat-actions">
                        <button class="btn-apply-stats" data-player-id="${stat.player.id}" data-new-forma="${clampedForma}" ${clampedForma === currentForma ? 'disabled' : ''}>
                            <i class="bi bi-check-circle"></i> Applica Forma Suggerita (${clampedForma})
                        </button>
                    </div>
                `;
                
                const applyBtn = card.querySelector('.btn-apply-stats');
                if (!applyBtn.disabled) {
                    applyBtn.addEventListener('click', () => this.applyStatsSuggestion(stat.player.id, clampedForma));
                }
                
                container.appendChild(card);
            });
            
        } catch (error) {
            console.error('Errore caricamento statistiche:', error);
            container.innerHTML = `
                <div class="alert alert-danger m-3">
                    Errore nel caricamento delle statistiche
                </div>
            `;
        }
    },
    
    async applyStatsSuggestion(playerId, newForma) {
        const confirmed = await customConfirm(`Aggiornare il valore Forma a ${newForma}?`);
        if (!confirmed) return;
        
        try {
            // Carica il giocatore corrente
            const response = await fetch(
                `${supabase.url}/rest/v1/giocatori?id=eq.${playerId}`,
                { headers: supabase.headers }
            );
            const players = await response.json();
            const player = players[0];
            
            // Aggiorna solo la forma
            const playerData = {
                nome: player.nome,
                ruolo: player.ruolo,
                avatar: player.avatar,
                forma: newForma,
                difesa: player.difesa,
                passaggi: player.passaggi,
                attacco: player.attacco,
                dribbling: player.dribbling
            };
            
            await supabase.updatePlayer(playerId, playerData);
            await customAlert('Forma aggiornata con successo!');
            await this.loadPlayerStats();
            
        } catch (error) {
            console.error('Errore aggiornamento:', error);
            await customAlert('Errore nell\'aggiornamento del giocatore');
        }
    },
    
    async loadMatchHistory() {
        const container = document.getElementById('matchHistory');
        container.innerHTML = '<div class="text-center p-4"><div class="spinner-border"></div><p>Caricamento storico...</p></div>';
        
        try {
            // Carica tutte le partite ordinate per data
            const matchesResponse = await fetch(
                `${supabase.url}/rest/v1/matches?select=*&order=data_partita.desc`,
                { headers: supabase.headers }
            );
            
            const matches = await matchesResponse.json();
            
            if (!matches || matches.length === 0) {
                container.innerHTML = `
                    <div class="no-stats">
                        <i class="bi bi-clock-history"></i>
                        <p>Nessuna partita nello storico.<br>Le partite appariranno dopo la prima conferma.</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = '';
            
            for (const match of matches) {
                // Conta i voti per questa partita
                const votesResponse = await fetch(
                    `${supabase.url}/rest/v1/match_votes?match_id=eq.${match.id}&select=id`,
                    { headers: supabase.headers }
                );
                const votes = await votesResponse.json();
                const voteCount = votes.length;
                
                const date = new Date(match.data_partita);
                const dateStr = date.toLocaleDateString('it-IT', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const balanceClass = match.balance_percentage >= 90 ? 'excellent' : 
                                    match.balance_percentage >= 80 ? 'good' : 'poor';
                
                const card = document.createElement('div');
                card.className = 'match-card';
                card.innerHTML = `
                    <div class="match-card-header">
                        <div class="match-date">${dateStr}</div>
                        <div class="match-balance ${balanceClass}">${match.balance_percentage}%</div>
                    </div>
                    <div class="match-teams-preview">
                        <div class="match-team-preview team-a">
                            <div class="match-team-name">Squadra A</div>
                            <div class="match-team-score">${match.team_a_score}</div>
                        </div>
                        <div class="match-team-preview team-b">
                            <div class="match-team-name">Squadra B</div>
                            <div class="match-team-score">${match.team_b_score}</div>
                        </div>
                    </div>
                    <div class="match-votes-count">
                        <i class="bi bi-star-fill"></i> ${voteCount} voti ricevuti
                    </div>
                `;
                
                card.addEventListener('click', () => this.showMatchDetail(match.id));
                container.appendChild(card);
            }
            
        } catch (error) {
            console.error('Errore caricamento storico:', error);
            container.innerHTML = `
                <div class="alert alert-danger m-3">
                    Errore nel caricamento dello storico
                </div>
            `;
        }
    },
    
    async showMatchDetail(matchId) {
        try {
            // Carica giocatori e voti della partita
            const playersResponse = await fetch(
                `${supabase.url}/rest/v1/match_players?match_id=eq.${matchId}&select=*,giocatori(nome,ruolo,avatar)`,
                { headers: supabase.headers }
            );
            const players = await playersResponse.json();
            
            const votesResponse = await fetch(
                `${supabase.url}/rest/v1/match_votes?match_id=eq.${matchId}&select=*`,
                { headers: supabase.headers }
            );
            const votes = await votesResponse.json();
            
            // Raggruppa voti per giocatore
            const playerVotes = {};
            votes.forEach(vote => {
                if (!playerVotes[vote.player_id]) {
                    playerVotes[vote.player_id] = {
                        formaSum: 0,
                        prestazioneSum: 0,
                        count: 0
                    };
                }
                playerVotes[vote.player_id].formaSum += vote.voto_forma;
                playerVotes[vote.player_id].prestazioneSum += vote.voto_prestazione;
                playerVotes[vote.player_id].count++;
            });
            
            // Separa squadre
            const teamA = players.filter(p => p.team === 'A');
            const teamB = players.filter(p => p.team === 'B');
            
            // Crea HTML per il dettaglio
            const renderTeam = (team, teamName, teamClass) => {
                return `
                    <div class="match-detail-team ${teamClass}">
                        <div class="match-detail-team-header">${teamName}</div>
                        ${team.map(p => {
                            const pVotes = playerVotes[p.player_id];
                            const avgForma = pVotes ? (pVotes.formaSum / pVotes.count).toFixed(1) : '-';
                            const avgPrestazione = pVotes ? (pVotes.prestazioneSum / pVotes.count).toFixed(1) : '-';
                            const voteCount = pVotes ? pVotes.count : 0;
                            
                            const formaClass = avgForma >= 2.5 ? 'good' : avgForma >= 2 ? 'average' : 'poor';
                            const prestazioneClass = avgPrestazione >= 4 ? 'good' : avgPrestazione >= 3 ? 'average' : 'poor';
                            
                            return `
                                <div class="match-player-vote">
                                    <div class="match-player-info">
                                        <div class="match-player-name">${p.giocatori.nome}</div>
                                        <div class="match-player-role">${p.giocatori.ruolo}</div>
                                    </div>
                                    <div class="match-player-votes">
                                        <div class="vote-badge">
                                            <div class="vote-badge-label">Forma</div>
                                            <div class="vote-badge-value ${formaClass}">${avgForma}</div>
                                        </div>
                                        <div class="vote-badge">
                                            <div class="vote-badge-label">Prestaz.</div>
                                            <div class="vote-badge-value ${prestazioneClass}">${avgPrestazione}</div>
                                        </div>
                                        <div class="vote-badge">
                                            <div class="vote-badge-label">Voti</div>
                                            <div class="vote-badge-value">${voteCount}</div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            };
            
            const modalContent = `
                <div class="match-detail">
                    <div class="match-detail-teams">
                        ${renderTeam(teamA, 'Squadra A', 'team-a')}
                        ${renderTeam(teamB, 'Squadra B', 'team-b')}
                    </div>
                </div>
            `;
            
            // Mostra in un modal custom
            await customAlert(modalContent);
            
        } catch (error) {
            console.error('Errore caricamento dettaglio:', error);
            await customAlert('Errore nel caricamento del dettaglio partita');
        }
    }
};
