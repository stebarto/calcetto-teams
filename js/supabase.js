// Configurazione Supabase
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

class SupabaseClient {
    constructor() {
        this.url = SUPABASE_URL;
        this.key = SUPABASE_ANON_KEY;
        this.headers = {
            'apikey': this.key,
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json'
        };
    }

    async getPlayers() {
        try {
            const response = await fetch(`${this.url}/rest/v1/giocatori?attivo=eq.true&select=*`, {
                headers: this.headers
            });
            
            if (!response.ok) {
                throw new Error('Errore nel caricamento giocatori');
            }
            
            const players = await response.json();
            return players.map(p => this.mapPlayer(p));
        } catch (error) {
            console.error('Errore Supabase:', error);
            return this.getMockPlayers();
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

    // Dati mock per sviluppo/demo
    getMockPlayers() {
        return [
            { id: 1, nome: 'Marco Rossi', forma: 8, difesa: 7, passaggi: 8, attacco: 6, dribbling: 7, ruolo: 'CEN', attivo: true },
            { id: 2, nome: 'Luca Bianchi', forma: 7, difesa: 9, passaggi: 6, attacco: 5, dribbling: 6, ruolo: 'DIF', attivo: true },
            { id: 3, nome: 'Andrea Verdi', forma: 9, difesa: 5, passaggi: 7, attacco: 9, dribbling: 8, ruolo: 'ATT', attivo: true },
            { id: 4, nome: 'Paolo Neri', forma: 6, difesa: 8, passaggi: 7, attacco: 6, dribbling: 5, ruolo: 'DIF', attivo: true },
            { id: 5, nome: 'Giovanni Gialli', forma: 8, difesa: 6, passaggi: 9, attacco: 7, dribbling: 7, ruolo: 'CEN', attivo: true },
            { id: 6, nome: 'Stefano Blu', forma: 7, difesa: 6, passaggi: 6, attacco: 8, dribbling: 9, ruolo: 'ATT', attivo: true },
            { id: 7, nome: 'Matteo Viola', forma: 9, difesa: 7, passaggi: 8, attacco: 7, dribbling: 6, ruolo: 'JOLLY', attivo: true },
            { id: 8, nome: 'Davide Arancio', forma: 6, difesa: 9, passaggi: 5, attacco: 6, dribbling: 5, ruolo: 'DIF', attivo: true },
            { id: 9, nome: 'Simone Rosa', forma: 8, difesa: 5, passaggi: 7, attacco: 9, dribbling: 8, ruolo: 'ATT', attivo: true },
            { id: 10, nome: 'Federico Grigio', forma: 7, difesa: 7, passaggi: 8, attacco: 6, dribbling: 7, ruolo: 'CEN', attivo: true },
            { id: 11, nome: 'Alessandro Marrone', forma: 8, difesa: 8, passaggi: 7, attacco: 7, dribbling: 6, ruolo: 'JOLLY', attivo: true },
            { id: 12, nome: 'Roberto Azzurro', forma: 6, difesa: 6, passaggi: 9, attacco: 7, dribbling: 8, ruolo: 'CEN', attivo: true }
        ];
    }
}

const supabase = new SupabaseClient();
