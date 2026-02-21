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
            // In locale usa l'URL completo corrente
            redirectTo = window.location.origin + window.location.pathname;
        } else {
            // In produzione usa l'URL fisso di GitHub Pages
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
            console.log('🔄 Loading players from Supabase...');
            
            const response = await fetch(`${this.url}/rest/v1/giocatori?attivo=eq.true&select=*&order=nome.asc`, {
                headers: this.headers
            });
            
            if (!response.ok) {
                console.error('❌ Supabase error:', response.status, response.statusText);
                throw new Error(`HTTP ${response.status}`);
            }
            
            const players = await response.json();
            console.log('✅ Loaded', players.length, 'players from Supabase');
            
            const mappedPlayers = players.map(p => this.mapPlayer(p));
            console.log('✅ Players mapped successfully');
            return mappedPlayers;
            
        } catch (error) {
            console.error('❌ Supabase connection failed:', error.message);
            console.log('🔄 Using mock data as fallback...');
            
            const mockPlayers = this.getMockPlayers();
            console.log('✅ Loaded', mockPlayers.length, 'mock players');
            return mockPlayers;
        }
    }

    // Dati mock per fallback
    getMockPlayers() {
        return [
            { id: 1, nome: 'Mario Rossi', ruolo: 'ATT', forma: 8, difesa: 5, passaggi: 7, attacco: 9, dribbling: 8, attivo: true },
            { id: 2, nome: 'Luigi Bianchi', ruolo: 'DIF', forma: 7, difesa: 9, passaggi: 6, attacco: 4, dribbling: 5, attivo: true },
            { id: 3, nome: 'Paolo Verdi', ruolo: 'CEN', forma: 8, difesa: 6, passaggi: 8, attacco: 7, dribbling: 7, attivo: true },
            { id: 4, nome: 'Marco Neri', ruolo: 'ATT', forma: 9, difesa: 4, passaggi: 6, attacco: 9, dribbling: 9, attivo: true },
            { id: 5, nome: 'Andrea Gialli', ruolo: 'DIF', forma: 7, difesa: 8, passaggi: 7, attacco: 5, dribbling: 6, attivo: true },
            { id: 6, nome: 'Luca Blu', ruolo: 'CEN', forma: 8, difesa: 7, passaggi: 9, attacco: 6, dribbling: 7, attivo: true },
            { id: 7, nome: 'Stefano Rosa', ruolo: 'JOLLY', forma: 8, difesa: 7, passaggi: 7, attacco: 7, dribbling: 8, attivo: true },
            { id: 8, nome: 'Giovanni Viola', ruolo: 'ATT', forma: 7, difesa: 5, passaggi: 6, attacco: 8, dribbling: 7, attivo: true },
            { id: 9, nome: 'Francesco Arancio', ruolo: 'DIF', forma: 6, difesa: 8, passaggi: 6, attacco: 4, dribbling: 5, attivo: true },
            { id: 10, nome: 'Antonio Marrone', ruolo: 'CEN', forma: 7, difesa: 6, passaggi: 8, attacco: 6, dribbling: 6, attivo: true },
            { id: 11, nome: 'Alessandro Azzurro', ruolo: 'ATT', forma: 8, difesa: 4, passaggi: 7, attacco: 9, dribbling: 8, attivo: true },
            { id: 12, nome: 'Matteo Grigio', ruolo: 'DIF', forma: 7, difesa: 9, passaggi: 5, attacco: 3, dribbling: 4, attivo: true }
        ];
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
                avatar: player.avatar,
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
                ruolo: player.ruolo,
                avatar: player.avatar
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
            avatar: dbPlayer.avatar,
            attivo: dbPlayer.attivo
        };
    }
}

const supabase = new SupabaseClient();
