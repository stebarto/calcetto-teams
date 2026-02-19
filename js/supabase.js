// Configurazione Supabase
const SUPABASE_URL = 'https://kiksqvcqqzmawjhpgkzs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpa3NxdmNxcXptYXdqaHBna3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMDE2NjksImV4cCI6MjA4Njg3NzY2OX0.TY9pthRK4c89yIpxFu2VwLOyd243Wk2ukSbNUgEC1-w';

class SupabaseClient {
    constructor() {
        this.url = SUPABASE_URL;
        this.key = SUPABASE_ANON_KEY;
        this.headers = {
            'apikey': this.key,
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json'
        };
        this.session = null;
    }

    // Auth methods
    async signInWithOtp(email) {
        // Determina l'URL di redirect in base all'ambiente
        let redirectTo;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            redirectTo = 'http://localhost:3000/';
        } else {
            redirectTo = 'https://stebarto.github.io/calcetto-teams/';
        }
        
        const response = await fetch(`${this.url}/auth/v1/otp`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
                email,
                options: {
                    emailRedirectTo: redirectTo
                }
            })
        });
        return response.json();
    }

    async getSession() {
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            
            if (accessToken) {
                this.session = { access_token: accessToken, refresh_token: refreshToken };
                localStorage.setItem('supabase_session', JSON.stringify(this.session));
                window.location.hash = '';
                return this.session;
            }
        }
        
        const stored = localStorage.getItem('supabase_session');
        if (stored) {
            this.session = JSON.parse(stored);
        }
        return this.session;
    }

    async signOut() {
        this.session = null;
        localStorage.removeItem('supabase_session');
    }

    getAuthHeaders() {
        if (this.session) {
            return {
                ...this.headers,
                'Authorization': `Bearer ${this.session.access_token}`
            };
        }
        return this.headers;
    }

    async getPlayers() {
        try {
            const response = await fetch(`${this.url}/rest/v1/giocatori?attivo=eq.true&select=*&order=nome.asc`, {
                headers: this.headers
            });
            
            if (!response.ok) {
                throw new Error('Errore nel caricamento giocatori');
            }
            
            const players = await response.json();
            return players.map(p => this.mapPlayer(p));
        } catch (error) {
            console.error('Errore Supabase:', error);
            return [];
        }
    }

    async addPlayer(player) {
        const response = await fetch(`${this.url}/rest/v1/giocatori`, {
            method: 'POST',
            headers: {
                ...this.getAuthHeaders(),
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                nome: player.nome,
                forma: player.forma,
                difesa: player.difesa,
                passaggi: player.passaggi,
                attacco: player.attacco,
                dribbling: player.dribbling,
                ruolo: player.ruolo,
                attivo: true
            })
        });
        
        if (!response.ok) {
            throw new Error('Errore nell\'aggiunta del giocatore');
        }
        
        const data = await response.json();
        return this.mapPlayer(data[0]);
    }

    async updatePlayer(id, player) {
        const response = await fetch(`${this.url}/rest/v1/giocatori?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                ...this.getAuthHeaders(),
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                nome: player.nome,
                forma: player.forma,
                difesa: player.difesa,
                passaggi: player.passaggi,
                attacco: player.attacco,
                dribbling: player.dribbling,
                ruolo: player.ruolo
            })
        });
        
        if (!response.ok) {
            throw new Error('Errore nell\'aggiornamento del giocatore');
        }
        
        const data = await response.json();
        return this.mapPlayer(data[0]);
    }

    async deletePlayer(id) {
        const response = await fetch(`${this.url}/rest/v1/giocatori?id=eq.${id}`, {
            method: 'PATCH',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ attivo: false })
        });
        
        if (!response.ok) {
            throw new Error('Errore nella cancellazione del giocatore');
        }
    }

    mapPlayer(dbPlayer) {
        return {
            id: dbPlayer.id,
            nome: dbPlayer.nome,
            forma: dbPlayer.forma,
            difesa: dbPlayer.difesa,
            passaggi: dbPlayer.passaggi,
            attacco: dbPlayer.attacco,
            dribbling: dbPlayer.dribbling,
            ruolo: dbPlayer.ruolo,
            attivo: dbPlayer.attivo
        };
    }
}

const supabase = new SupabaseClient();
