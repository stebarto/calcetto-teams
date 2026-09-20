// Configurazione Supabase
const SUPABASE_URL = 'https://kiksqvcqqzmawjhpgkzs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpa3NxdmNxcXptYXdqaHBna3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMDE2NjksImV4cCI6MjA4Njg3NzY2OX0.TY9pthRK4c89yIpxFu2VwLOyd243Wk2ukSbNUgEC1-w';
const PRODUCTION_URL = 'https://stebarto.github.io/calcetto-teams/';
// Deve restare allineata alla funzione public.is_admin() su Supabase:
// qui decide solo cosa mostrare, le policy RLS decidono cosa si può salvare.
const ADMIN_EMAILS = ['stebarto@gmail.com', 'scheke07@gmail.com'];
// Rinnova la sessione poco prima della scadenza reale, per non farsi cogliere a metà richiesta
const EXPIRY_SKEW_SECONDS = 60;

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
    // Decodifica il payload di un JWT senza verificarne la firma.
    // La firma la verifica Supabase lato server: qui serve solo a leggere le claim per la UI.
    decodeJwt(token) {
        if (!token || typeof token !== 'string') return null;

        const parts = token.split('.');
        if (parts.length !== 3) return null;

        try {
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const json = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(json);
        } catch (error) {
            return null;
        }
    }

    getUserEmail() {
        if (!this.session) return null;

        const payload = this.decodeJwt(this.session.access_token);
        if (!payload || !payload.email) return null;

        return payload.email.toLowerCase();
    }

    parseSessionFromHash(hash) {
        if (!hash) return null;

        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const accessToken = params.get('access_token');
        if (!accessToken) return null;

        const expiresIn = parseInt(params.get('expires_in'), 10);
        return {
            access_token: accessToken,
            refresh_token: params.get('refresh_token'),
            expires_at: Math.floor(Date.now() / 1000) + (Number.isFinite(expiresIn) ? expiresIn : 0)
        };
    }

    // Google rimanda indietro gli errori nell'hash, esattamente come i token
    parseOAuthError(hash) {
        if (!hash) return null;

        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const error = params.get('error');
        if (!error) return null;

        return {
            error,
            description: params.get('error_description') || ''
        };
    }

    isAdmin() {
        const email = this.getUserEmail();
        return email !== null && ADMIN_EMAILS.includes(email);
    }

    isSessionExpired() {
        if (!this.session || !this.session.expires_at) return true;

        const now = Math.floor(Date.now() / 1000);
        return now >= this.session.expires_at - EXPIRY_SKEW_SECONDS;
    }

    getRedirectUrl() {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        return isLocal
            ? window.location.origin + window.location.pathname
            : PRODUCTION_URL;
    }

    buildGoogleAuthUrl(redirectTo) {
        return `${this.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
    }

    signInWithGoogle() {
        window.location.href = this.buildGoogleAuthUrl(this.getRedirectUrl());
    }

    setSession(session) {
        this.session = session;
        localStorage.setItem('supabase_session', JSON.stringify(session));
    }

    clearSession() {
        this.session = null;
        localStorage.removeItem('supabase_session');
    }

    async getSession() {
        // Ritorno da Google: i token arrivano nell'hash dell'URL
        const fromHash = this.parseSessionFromHash(window.location.hash);
        if (fromHash) {
            this.setSession(fromHash);
            window.location.hash = '';
            return this.session;
        }

        if (!this.session) {
            const stored = localStorage.getItem('supabase_session');
            if (stored) {
                try {
                    this.session = JSON.parse(stored);
                } catch (error) {
                    this.clearSession();
                }
            }
        }

        if (!this.session) return null;

        if (this.isSessionExpired()) {
            if (this.session.refresh_token) {
                return await this.refreshSession();
            }
            this.clearSession();
            return null;
        }

        return this.session;
    }

    async refreshSession() {
        if (!this.session || !this.session.refresh_token) {
            this.clearSession();
            return null;
        }

        try {
            const response = await fetch(`${this.url}/auth/v1/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({ refresh_token: this.session.refresh_token })
            });

            if (!response.ok) {
                this.clearSession();
                return null;
            }

            const data = await response.json();
            if (!data.access_token) {
                this.clearSession();
                return null;
            }

            this.setSession({
                access_token: data.access_token,
                refresh_token: data.refresh_token || this.session.refresh_token,
                expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 0)
            });
            return this.session;

        } catch (error) {
            console.error('❌ Refresh sessione fallito:', error.message);
            this.clearSession();
            return null;
        }
    }

    async signOut() {
        const token = this.session && this.session.access_token;

        // La sessione locale va via comunque, anche se la chiamata al server fallisce
        this.clearSession();
        if (!token) return;

        try {
            await fetch(`${this.url}/auth/v1/logout`, {
                method: 'POST',
                headers: {
                    ...this.headers,
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.warn('⚠️ Logout lato server fallito, sessione locale comunque rimossa');
        }
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
