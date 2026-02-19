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
    
    console.log('renderTeams called with:', {
        teamA: teamA.map(p => p.nome),
        teamB: teamB.map(p => p.nome),
        balance
    });
    
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
    console.log('Rendering teamAPlayers...');
    renderTeamPlayers('teamAPlayers', teamA);
    console.log('Rendering teamBPlayers...');
    renderTeamPlayers('teamBPlayers', teamB);
    console.log('Render complete');
}

// Render giocatori squadra
function renderTeamPlayers(containerId, team) {
    const container = document.getElementById(containerId);
    console.log(`renderTeamPlayers for ${containerId}:`, team.map(p => p.nome));
    console.log('Container found:', container);
    
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
    
    console.log(`${containerId} innerHTML updated:`, container.innerHTML.substring(0, 100));
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
    console.log('Regenerate called');
    console.log('Selected players:', state.selectedPlayers);
    
    const selectedPlayerObjects = state.players.filter(p => 
        state.selectedPlayers.includes(p.id)
    );
    
    console.log('Selected player objects:', selectedPlayerObjects);
    
    // Usa il metodo random per generare una nuova combinazione
    const result = generator.generateRandomTeams(selectedPlayerObjects);
    console.log('New result:', result);
    console.log('Team A players:', result.teamA.map(p => p.nome));
    console.log('Team B players:', result.teamB.map(p => p.nome));
    console.log('Balance:', result.balance);
    
    state.teams = result;
    state.balance = result.balance;
    
    console.log('State updated, rendering...');
    renderTeams();
    console.log('Render complete');
}

// Event listeners
function setupEventListeners() {
    generateBtn.addEventListener('click', generateTeams);
    resetBtn.addEventListener('click', reset);
    regenerateBtn.addEventListener('click', regenerate);
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
