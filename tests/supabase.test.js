// Unit Test per Supabase Connection
// Test per prevenire problemi di connessione database

class SupabaseTests {
    constructor() {
        this.results = [];
        this.supabase = null;
    }

    async runAllTests() {
        console.log('🧪 Avvio test Supabase...');
        
        // Inizializza Supabase per i test
        this.supabase = new SupabaseClient();
        
        await this.testConnection();
        await this.testGetPlayers();
        await this.testPlayerMapping();
        await this.testMockFallback();
        
        this.printResults();
        return this.results;
    }

    async testConnection() {
        try {
            const response = await fetch(`${this.supabase.url}/rest/v1/giocatori?select=count`, {
                headers: this.supabase.headers
            });
            
            this.assert(
                response.ok, 
                'Connection Test', 
                'Supabase API dovrebbe essere raggiungibile'
            );
            
        } catch (error) {
            this.assert(
                false, 
                'Connection Test', 
                `Errore connessione: ${error.message}`
            );
        }
    }

    async testGetPlayers() {
        try {
            const players = await this.supabase.getPlayers();
            
            this.assert(
                Array.isArray(players), 
                'Get Players - Array', 
                'getPlayers() dovrebbe restituire un array'
            );
            
            this.assert(
                players.length > 0, 
                'Get Players - Count', 
                'Dovrebbero esserci almeno 1 giocatore'
            );
            
            if (players.length > 0) {
                const player = players[0];
                this.assert(
                    player.hasOwnProperty('id'), 
                    'Player Structure - ID', 
                    'Ogni giocatore dovrebbe avere un ID'
                );
                
                this.assert(
                    player.hasOwnProperty('nome'), 
                    'Player Structure - Nome', 
                    'Ogni giocatore dovrebbe avere un nome'
                );
                
                this.assert(
                    player.hasOwnProperty('ruolo'), 
                    'Player Structure - Ruolo', 
                    'Ogni giocatore dovrebbe avere un ruolo'
                );
                
                this.assert(
                    ['DIF', 'CEN', 'ATT', 'JOLLY'].includes(player.ruolo), 
                    'Player Structure - Ruolo Valido', 
                    'Il ruolo dovrebbe essere valido'
                );
            }
            
        } catch (error) {
            this.assert(
                false, 
                'Get Players - Error', 
                `Errore nel caricamento giocatori: ${error.message}`
            );
        }
    }

    async testPlayerMapping() {
        try {
            const mockDbPlayer = {
                id: 1,
                nome: 'Test Player',
                forma: 8,
                difesa: 7,
                passaggi: 6,
                attacco: 9,
                dribbling: 8,
                ruolo: 'ATT',
                attivo: true
            };
            
            const mappedPlayer = this.supabase.mapPlayer(mockDbPlayer);
            
            this.assert(
                mappedPlayer.id === mockDbPlayer.id, 
                'Player Mapping - ID', 
                'ID dovrebbe essere mappato correttamente'
            );
            
            this.assert(
                mappedPlayer.nome === mockDbPlayer.nome, 
                'Player Mapping - Nome', 
                'Nome dovrebbe essere mappato correttamente'
            );
            
            this.assert(
                typeof mappedPlayer.forma === 'number', 
                'Player Mapping - Forma Type', 
                'Forma dovrebbe essere un numero'
            );
            
        } catch (error) {
            this.assert(
                false, 
                'Player Mapping - Error', 
                `Errore nel mapping: ${error.message}`
            );
        }
    }

    async testMockFallback() {
        try {
            const mockPlayers = this.supabase.getMockPlayers();
            
            this.assert(
                Array.isArray(mockPlayers), 
                'Mock Fallback - Array', 
                'Mock players dovrebbe essere un array'
            );
            
            this.assert(
                mockPlayers.length === 12, 
                'Mock Fallback - Count', 
                'Dovrebbero esserci 12 mock players'
            );
            
            this.assert(
                mockPlayers.every(p => p.hasOwnProperty('nome')), 
                'Mock Fallback - Structure', 
                'Tutti i mock players dovrebbero avere la struttura corretta'
            );
            
        } catch (error) {
            this.assert(
                false, 
                'Mock Fallback - Error', 
                `Errore nei mock data: ${error.message}`
            );
        }
    }

    assert(condition, testName, message) {
        const result = {
            test: testName,
            passed: condition,
            message: message,
            timestamp: new Date().toISOString()
        };
        
        this.results.push(result);
        
        if (condition) {
            console.log(`✅ ${testName}: ${message}`);
        } else {
            console.error(`❌ ${testName}: ${message}`);
        }
    }

    printResults() {
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        
        console.log(`\n📊 Test Results: ${passed}/${total} passed`);
        
        if (passed === total) {
            console.log('🎉 Tutti i test sono passati!');
        } else {
            console.warn('⚠️ Alcuni test sono falliti. Controlla i log sopra.');
        }
        
        return { passed, total, success: passed === total };
    }
}

// Esporta per uso globale
window.SupabaseTests = SupabaseTests;