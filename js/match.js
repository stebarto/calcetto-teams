// Match voting page logic

const matchState = {
    matchId: null,
    match: null,
    players: [],
    votes: {},
    voterToken: null,
    currentVotingPlayer: null
};

// Inizializzazione
async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    matchState.matchId = urlParams.get('id');

    if (!matchState.matchId) {
        showError('ID partita non valido');
        return;
    }

    matchState.voterToken = getOrCreateVoterToken();
    await loadMatch();
}

// Genera o recupera token votante
function getOrCreateVoterToken() {
    let token = localStorage.getItem('voter_token');
    if (!token) {
        token = 'voter_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('voter_token', token);
    }
    return token;
}

// Carica dati partita
async function loadMatch() {
    try {
        // Carica match
        const matchResponse = await fetch(
            `${supabase.url}/rest/v1/matches?id=eq.${matchState.matchId}&select=*`,
            { headers: supabase.headers }
        );
        const matches = await matchResponse.json();
        
        if (!matches || matches.length === 0) {
            showError('Partita non trovata');
            return;
        }
        
        matchState.match = matches[0];

        // Carica giocatori della partita
        const playersResponse = await fetch(
            `${supabase.url}/rest/v1/match_players?match_id=eq.${matchState.matchId}&select=*,giocatori(*)`,
            { headers: supabase.headers }
        );
        matchState.players = await playersResponse.json();

        // Verifica se ha già votato
        const hasVoted = await checkIfAlreadyVoted();
        
        if (hasVoted) {
            showAlreadyVoted();
            return;
        }

        if (!matchState.match.votazione_aperta) {
            showVotingClosed();
            return;
        }

        renderMatch();
        
    } catch (error) {
        console.error('Errore caricamento:', error);
        showError('Errore nel caricamento della partita');
    }
}

// Verifica voto già espresso
async function checkIfAlreadyVoted() {
    try {
        const response = await fetch(
            `${supabase.url}/rest/v1/match_voters?match_id=eq.${matchState.matchId}&voter_token=eq.${matchState.voterToken}`,
            { headers: supabase.headers }
        );
        const voters = await response.json();
        return voters && voters.length > 0;
    } catch (error) {
        return false;
    }
}

// Render partita
function renderMatch() {
    document.getElementById('loadingScreen').classList.remove('active');
    document.getElementById('matchScreen').classList.add('active');

    const date = new Date(matchState.match.data_partita);
    document.getElementById('matchDate').textContent = date.toLocaleDateString('it-IT');
    
    document.getElementById('teamAScore').textContent = matchState.match.team_a_score;
    document.getElementById('teamBScore').textContent = matchState.match.team_b_score;

    const teamA = matchState.players.filter(p => p.team === 'A');
    const teamB = matchState.players.filter(p => p.team === 'B');

    renderTeamPlayers('teamAPlayers', teamA);
    renderTeamPlayers('teamBPlayers', teamB);

    updateVoteCount();
}

// Render giocatori squadra
function renderTeamPlayers(containerId, players) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    players.forEach(matchPlayer => {
        const player = matchPlayer.giocatori;
        const hasVote = matchState.votes[player.id];
        
        const div = document.createElement('div');
        div.className = `vote-player ${hasVote ? 'voted' : ''}`;
        div.innerHTML = `
            <div class="vote-player-info">
                <div class="player-name">${player.nome}</div>
                <span class="role-badge role-${player.ruolo.toLowerCase()}">${getRoleLabel(player.ruolo)}</span>
            </div>
            <button class="btn-vote ${hasVote ? 'btn-voted' : ''}" data-player-id="${player.id}">
                <i class="bi ${hasVote ? 'bi-check-circle-fill' : 'bi-hand-thumbs-up'}"></i>
            </button>
        `;

        div.querySelector('.btn-vote').addEventListener('click', () => openVoteModal(player));
        container.appendChild(div);
    });
}

// Apri modal voto
function openVoteModal(player) {
    matchState.currentVotingPlayer = player;
    document.getElementById('votePlayerName').textContent = player.nome;
    
    createVoteButtons('formaButtons');
    createVoteButtons('prestazioneButtons');
    
    // Ripristina voti esistenti
    const existingVote = matchState.votes[player.id];
    if (existingVote) {
        selectVoteButton('formaButtons', existingVote.forma);
        selectVoteButton('prestazioneButtons', existingVote.prestazione);
    }
    
    new bootstrap.Modal(document.getElementById('voteModal')).show();
}

// Crea bottoni voto 1-10
function createVoteButtons(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement('button');
        btn.className = 'vote-btn';
        btn.textContent = i;
        btn.dataset.value = i;
        btn.addEventListener('click', () => {
            container.querySelectorAll('.vote-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            checkVoteComplete();
        });
        container.appendChild(btn);
    }
}

// Seleziona bottone voto
function selectVoteButton(containerId, value) {
    const container = document.getElementById(containerId);
    const btn = container.querySelector(`[data-value="${value}"]`);
    if (btn) btn.classList.add('selected');
}

// Verifica voto completo
function checkVoteComplete() {
    const forma = document.querySelector('#formaButtons .vote-btn.selected');
    const prestazione = document.querySelector('#prestazioneButtons .vote-btn.selected');
    document.getElementById('saveVoteBtn').disabled = !(forma && prestazione);
}

// Salva voto singolo
document.getElementById('saveVoteBtn').addEventListener('click', () => {
    const forma = document.querySelector('#formaButtons .vote-btn.selected')?.dataset.value;
    const prestazione = document.querySelector('#prestazioneButtons .vote-btn.selected')?.dataset.value;
    
    if (forma && prestazione) {
        matchState.votes[matchState.currentVotingPlayer.id] = {
            forma: parseInt(forma),
            prestazione: parseInt(prestazione)
        };
        
        bootstrap.Modal.getInstance(document.getElementById('voteModal')).hide();
        renderMatch();
    }
});

// Aggiorna contatore voti
function updateVoteCount() {
    const count = Object.keys(matchState.votes).length;
    document.getElementById('votedCount').textContent = count;
    document.getElementById('submitVotesBtn').disabled = count !== 10;
}

// Invia tutte le votazioni
document.getElementById('submitVotesBtn').addEventListener('click', async () => {
    if (Object.keys(matchState.votes).length !== 10) {
        alert('Devi votare tutti i 10 giocatori');
        return;
    }

    try {
        // Salva voti
        const votesData = Object.entries(matchState.votes).map(([playerId, vote]) => ({
            match_id: matchState.matchId,
            player_id: parseInt(playerId),
            voto_forma: vote.forma,
            voto_prestazione: vote.prestazione
        }));

        await fetch(`${supabase.url}/rest/v1/match_votes`, {
            method: 'POST',
            headers: supabase.headers,
            body: JSON.stringify(votesData)
        });

        // Registra votante
        await fetch(`${supabase.url}/rest/v1/match_voters`, {
            method: 'POST',
            headers: supabase.headers,
            body: JSON.stringify({
                match_id: matchState.matchId,
                voter_token: matchState.voterToken
            })
        });

        showSuccess();
        
    } catch (error) {
        console.error('Errore invio voti:', error);
        alert('Errore nell\'invio dei voti. Riprova.');
    }
});

// UI helpers
function showAlreadyVoted() {
    document.getElementById('loadingScreen').classList.remove('active');
    document.getElementById('matchScreen').classList.add('active');
    document.getElementById('voteActions').style.display = 'none';
    document.getElementById('alreadyVoted').style.display = 'block';
    
    const date = new Date(matchState.match.data_partita);
    document.getElementById('matchDate').textContent = date.toLocaleDateString('it-IT');
}

function showVotingClosed() {
    document.getElementById('loadingScreen').classList.remove('active');
    document.getElementById('matchScreen').classList.add('active');
    document.getElementById('voteActions').style.display = 'none';
    document.getElementById('votingClosed').style.display = 'block';
}

function showSuccess() {
    document.getElementById('voteActions').innerHTML = `
        <div class="alert alert-success m-3">
            <i class="bi bi-check-circle-fill"></i> Votazioni inviate con successo! Grazie.
        </div>
    `;
}

function showError(message) {
    document.getElementById('loadingScreen').innerHTML = `
        <div class="alert alert-danger m-3">${message}</div>
    `;
}

function getRoleLabel(ruolo) {
    const labels = { 'DIF': 'Difensore', 'CEN': 'Centrocampista', 'ATT': 'Attaccante', 'JOLLY': 'Jolly' };
    return labels[ruolo] || ruolo;
}

// Avvia
document.addEventListener('DOMContentLoaded', init);
