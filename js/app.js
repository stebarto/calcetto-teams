// Stato applicazione
const state = {
    players: [],
    selectedPlayers: [],
    teams: null,
    balance: null
};

// Elementi DOM
const selectionScreen = document.getElementById('selectionScreen');
const resultScreen = document.getElementById('resultScreen');
const playersList = document.getElementById('playersList');
const selectedCount = document.getElementById('selectedCount');
const generateBtn = document.getElementById('generateBtn');
const resetBtn = document.getElementById('resetBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const confirmMatchBtn = document.getElementById('confirmMatchBtn');

// Inizializzazione
async function init() {
    state.players = await supabase.getPlayers();
    renderPlayersList();
    updateTotalPlayers();
    setupEventListeners();
}

// Aggiorna contatore totale giocatori
function updateTotalPlayers() {
    const totalPlayersEl = document.getElementById('totalPlayers');
    if (totalPlayersEl) {
        totalPlayersEl.textContent = state.players.length;
    }
}

// Render lista giocatori
function renderPlayersList() {
    playersList.innerHTML = '';
    
    state.players.forEach(player => {
        const isSelected = state.selectedPlayers.includes(player.id);
        const isDisabled = !isSelected && state.selectedPlayers.length >= 10;
        
        const item = document.createElement('div');
        item.className = `player-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`;
        item.innerHTML = `
            <div class="player-info">
                <div class="player-name">${player.nome}</div>
                <span class="role-badge role-${player.ruolo.toLowerCase()}">${getRoleLabel(player.ruolo)}</span>
            </div>
        `;
        
        if (!isDisabled) {
            item.addEventListener('click', () => togglePlayer(player.id));
        }
        
        playersList.appendChild(item);
    });
}

// Helper per label ruoli
function getRoleLabel(ruolo) {
    const labels = {
        'DIF': 'Difensore',
        'CEN': 'Centrocampista',
        'ATT': 'Attaccante',
        'JOLLY': 'Jolly'
    };
    return labels[ruolo] || ruolo;
}

// Toggle selezione giocatore
function togglePlayer(playerId) {
    const index = state.selectedPlayers.indexOf(playerId);
    
    if (index > -1) {
        state.selectedPlayers.splice(index, 1);
    } else if (state.selectedPlayers.length < 10) {
        state.selectedPlayers.push(playerId);
    }
    
    updateUI();
}

// Aggiorna UI
function updateUI() {
    selectedCount.textContent = state.selectedPlayers.length;
    generateBtn.disabled = state.selectedPlayers.length !== 10;
    renderPlayersList();
}

// Genera squadre
function generateTeams() {
    const selectedPlayerObjects = state.players.filter(p => 
        state.selectedPlayers.includes(p.id)
    );
    
    const result = generator.generateTeams(selectedPlayerObjects);
    state.teams = result;
    state.balance = result.balance;
    
    showResultScreen();
}

// Mostra schermata risultato
function showResultScreen() {
    renderTeams();
    selectionScreen.classList.remove('active');
    resultScreen.classList.add('active');
}

// Render squadre
function renderTeams() {
    const { teamA, teamB, balance } = state.teams;
    
    // Aggiorna punteggi
    const scoreA = generator.getTeamScore(teamA).toFixed(1);
    const scoreB = generator.getTeamScore(teamB).toFixed(1);
    
    document.getElementById('teamAScore').textContent = scoreA;
    document.getElementById('teamBScore').textContent = scoreB;
    
    // Aggiorna equilibrio con nuovo design
    const balanceIndicator = document.getElementById('balanceIndicator');
    document.getElementById('balanceValue').textContent = balance;
    
    balanceIndicator.className = 'balance-indicator-large';
    if (balance >= 90) {
        balanceIndicator.classList.add('excellent');
    } else if (balance >= 80) {
        balanceIndicator.classList.add('good');
    } else {
        balanceIndicator.classList.add('poor');
    }
    
    // Render giocatori
    renderTeamPlayers('teamAPlayers', teamA);
    renderTeamPlayers('teamBPlayers', teamB);
}

// Render giocatori squadra
function renderTeamPlayers(containerId, team) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    team.forEach(player => {
        const div = document.createElement('div');
        div.className = 'result-player';
        div.innerHTML = `
            <div class="result-player-name">
                <span>${player.nome}</span>
            </div>
            <div class="result-player-role">${player.ruolo}</div>
        `;
        container.appendChild(div);
    });
}

// Reset
function reset() {
    state.selectedPlayers = [];
    state.teams = null;
    state.balance = null;
    
    resultScreen.classList.remove('active');
    selectionScreen.classList.add('active');
    updateUI();
}

// Rigenera
function regenerate() {
    const selectedPlayerObjects = state.players.filter(p => 
        state.selectedPlayers.includes(p.id)
    );
    
    // Usa il metodo random per generare una nuova combinazione
    const result = generator.generateRandomTeams(selectedPlayerObjects);
    state.teams = result;
    state.balance = result.balance;
    
    renderTeams();
}

// Event listeners
function setupEventListeners() {
    generateBtn.addEventListener('click', generateTeams);
    resetBtn.addEventListener('click', reset);
    regenerateBtn.addEventListener('click', regenerate);
    confirmMatchBtn.addEventListener('click', confirmMatch);
}

// Avvia app
document.addEventListener('DOMContentLoaded', () => {
    init();
    adminUI.init();
});

// Service Worker per PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .catch(err => console.log('SW registration failed:', err));
    });
}


// Conferma formazione e crea match
async function confirmMatch() {
    if (!state.teams) return;

    if (!confirm('Confermare questa formazione e aprire le votazioni?')) {
        return;
    }

    try {
        confirmMatchBtn.disabled = true;
        confirmMatchBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creazione...';

        // Crea match
        const matchData = {
            team_a_score: generator.getTeamScore(state.teams.teamA).toFixed(1),
            team_b_score: generator.getTeamScore(state.teams.teamB).toFixed(1),
            balance_percentage: state.balance,
            votazione_aperta: true
        };

        const matchResponse = await fetch(`${supabase.url}/rest/v1/matches`, {
            method: 'POST',
            headers: {
                ...supabase.headers,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(matchData)
        });

        if (!matchResponse.ok) {
            throw new Error('Errore nella creazione del match');
        }

        const matches = await matchResponse.json();
        const matchId = matches[0].id;

        // Salva giocatori squadra A
        const teamAPlayers = state.teams.teamA.map(p => ({
            match_id: matchId,
            player_id: p.id,
            team: 'A',
            player_overall: p.overall
        }));

        // Salva giocatori squadra B
        const teamBPlayers = state.teams.teamB.map(p => ({
            match_id: matchId,
            player_id: p.id,
            team: 'B',
            player_overall: p.overall
        }));

        await fetch(`${supabase.url}/rest/v1/match_players`, {
            method: 'POST',
            headers: supabase.headers,
            body: JSON.stringify([...teamAPlayers, ...teamBPlayers])
        });

        // Mostra link condivisibile
        const matchUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}match.html?id=${matchId}`;
        
        showMatchLink(matchUrl);

    } catch (error) {
        console.error('Errore:', error);
        alert('Errore nella creazione del match. Riprova.');
        confirmMatchBtn.disabled = false;
        confirmMatchBtn.innerHTML = '<i class="bi bi-check-circle"></i> Conferma Formazione';
    }
}

// Mostra link match
function showMatchLink(url) {
    const actionsBar = document.querySelector('.actions-bar');
    actionsBar.innerHTML = `
        <div class="match-link-container">
            <div class="alert alert-success mb-3">
                <i class="bi bi-check-circle-fill"></i> Formazione confermata!
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Link per votare:</label>
                <div class="input-group">
                    <input type="text" class="form-control" value="${url}" id="matchLinkInput" readonly>
                    <button class="btn btn-primary" onclick="copyMatchLink()">
                        <i class="bi bi-clipboard"></i> Copia
                    </button>
                </div>
            </div>
            <button class="btn btn-success w-100" onclick="shareMatchLink('${url}')">
                <i class="bi bi-whatsapp"></i> Condividi su WhatsApp
            </button>
        </div>
    `;
}

// Copia link
function copyMatchLink() {
    const input = document.getElementById('matchLinkInput');
    input.select();
    document.execCommand('copy');
    
    const btn = event.target.closest('button');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-check"></i> Copiato!';
    setTimeout(() => {
        btn.innerHTML = originalHtml;
    }, 2000);
}

// Condividi su WhatsApp
function shareMatchLink(url) {
    const text = encodeURIComponent(`Vota la partita di calcetto! ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}
