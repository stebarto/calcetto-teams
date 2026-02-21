// Unit Test per Team Generator
// Test per prevenire problemi nella generazione squadre

class GeneratorTests {
    constructor() {
        this.results = [];
        this.generator = new TeamGenerator();
        this.mockPlayers = this.createMockPlayers();
    }

    createMockPlayers() {
        return [
            { id: 1, nome: 'Player1', forma: 8, difesa: 7, passaggi: 6, attacco: 9, dribbling: 8, ruolo: 'ATT' },
            { id: 2, nome: 'Player2', forma: 7, difesa: 9, passaggi: 6, attacco: 4, dribbling: 5, ruolo: 'DIF' },
            { id: 3, nome: 'Player3', forma: 8, difesa: 6, passaggi: 8, attacco: 7, dribbling: 7, ruolo: 'CEN' },
            { id: 4, nome: 'Player4', forma: 9, difesa: 4, passaggi: 6, attacco: 9, dribbling: 9, ruolo: 'ATT' },
            { id: 5, nome: 'Player5', forma: 7, difesa: 8, passaggi: 7, attacco: 5, dribbling: 6, ruolo: 'DIF' },
            { id: 6, nome: 'Player6', forma: 8, difesa: 7, passaggi: 9, attacco: 6, dribbling: 7, ruolo: 'CEN' },
            { id: 7, nome: 'Player7', forma: 8, difesa: 7, passaggi: 7, attacco: 7, dribbling: 8, ruolo: 'JOLLY' },
            { id: 8, nome: 'Player8', forma: 7, difesa: 5, passaggi: 6, attacco: 8, dribbling: 7, ruolo: 'ATT' },
            { id: 9, nome: 'Player9', forma: 6, difesa: 8, passaggi: 6, attacco: 4, dribbling: 5, ruolo: 'DIF' },
            { id: 10, nome: 'Player10', forma: 7, difesa: 6, passaggi: 8, attacco: 6, dribbling: 6, ruolo: 'CEN' }
        ];
    }

    async runAllTests() {
        console.log('🧪 Avvio test Generator...');
        
        this.testCalculateOverall();
        this.testGenerateTeams();
        this.testGenerateRandomTeams();
        this.testShuffle();
        this.testCalculateBalance();
        this.testEdgeCases();
        
        this.printResults();
        return this.results;
    }

    testCalculateOverall() {
        try {
            const player = this.mockPlayers[0];
            const overall = this.generator.calculateOverall(player);
            
            this.assert(
                typeof overall === 'number',
                'Calculate Overall - Type',
                'Overall dovrebbe essere un numero'
            );
            
            this.assert(
                overall >= 1 && overall <= 10,
                'Calculate Overall - Range',
                'Overall dovrebbe essere tra 1 e 10'
            );
            
            // Test calcolo specifico
            const expected = (8 * 0.25) + (7 * 0.20) + (6 * 0.20) + (9 * 0.20) + (8 * 0.15);
            this.assert(
                Math.abs(overall - expected) < 0.01,
                'Calculate Overall - Formula',
                'Formula di calcolo dovrebbe essere corretta'
            );
            
        } catch (error) {
            this.assert(
                false,
                'Calculate Overall - Error',
                `Errore nel calcolo overall: ${error.message}`
            );
        }
    }

    testGenerateTeams() {
        try {
            const result = this.generator.generateTeams(this.mockPlayers);
            
            this.assert(
                result.hasOwnProperty('teamA'),
                'Generate Teams - TeamA',
                'Risultato dovrebbe contenere teamA'
            );
            
            this.assert(
                result.hasOwnProperty('teamB'),
                'Generate Teams - TeamB',
                'Risultato dovrebbe contenere teamB'
            );
            
            this.assert(
                result.hasOwnProperty('balance'),
                'Generate Teams - Balance',
                'Risultato dovrebbe contenere balance'
            );
            
            this.assert(
                result.teamA.length === 5,
                'Generate Teams - TeamA Size',
                'TeamA dovrebbe avere 5 giocatori'
            );
            
            this.assert(
                result.teamB.length === 5,
                'Generate Teams - TeamB Size',
                'TeamB dovrebbe avere 5 giocatori'
            );
            
            this.assert(
                result.balance >= 0 && result.balance <= 100,
                'Generate Teams - Balance Range',
                'Balance dovrebbe essere tra 0 e 100'
            );
            
        } catch (error) {
            this.assert(
                false,
                'Generate Teams - Error',
                `Errore nella generazione squadre: ${error.message}`
            );
        }
    }

    testGenerateRandomTeams() {
        try {
            const result1 = this.generator.generateRandomTeams(this.mockPlayers);
            const result2 = this.generator.generateRandomTeams(this.mockPlayers);
            
            this.assert(
                result1.teamA.length === 5 && result1.teamB.length === 5,
                'Generate Random - Team Sizes',
                'Squadre random dovrebbero avere 5 giocatori ciascuna'
            );
            
            // Test che la randomizzazione funzioni (probabilità molto bassa di squadre identiche)
            const team1Names = result1.teamA.map(p => p.nome).sort().join(',');
            const team2Names = result2.teamA.map(p => p.nome).sort().join(',');
            
            this.assert(
                team1Names !== team2Names,
                'Generate Random - Randomness',
                'Generazioni multiple dovrebbero produrre squadre diverse'
            );
            
        } catch (error) {
            this.assert(
                false,
                'Generate Random - Error',
                `Errore nella generazione random: ${error.message}`
            );
        }
    }

    testShuffle() {
        try {
            const original = [1, 2, 3, 4, 5];
            const shuffled = this.generator.shuffle(original);
            
            this.assert(
                shuffled.length === original.length,
                'Shuffle - Length',
                'Array shuffled dovrebbe mantenere la stessa lunghezza'
            );
            
            this.assert(
                shuffled.every(item => original.includes(item)),
                'Shuffle - Elements',
                'Array shuffled dovrebbe contenere gli stessi elementi'
            );
            
            // Test che l'array originale non sia modificato
            this.assert(
                JSON.stringify(original) === JSON.stringify([1, 2, 3, 4, 5]),
                'Shuffle - Immutability',
                'Array originale non dovrebbe essere modificato'
            );
            
        } catch (error) {
            this.assert(
                false,
                'Shuffle - Error',
                `Errore nello shuffle: ${error.message}`
            );
        }
    }

    testCalculateBalance() {
        try {
            const teamA = this.mockPlayers.slice(0, 5);
            const teamB = this.mockPlayers.slice(5, 10);
            
            const balance = this.generator.calculateBalance(teamA, teamB);
            
            this.assert(
                typeof balance === 'number',
                'Calculate Balance - Type',
                'Balance dovrebbe essere un numero'
            );
            
            this.assert(
                balance >= 0 && balance <= 100,
                'Calculate Balance - Range',
                'Balance dovrebbe essere tra 0 e 100'
            );
            
            // Test con squadre identiche (dovrebbe essere 100)
            const perfectBalance = this.generator.calculateBalance(teamA, teamA);
            this.assert(
                perfectBalance === 100,
                'Calculate Balance - Perfect',
                'Squadre identiche dovrebbero avere balance 100'
            );
            
        } catch (error) {
            this.assert(
                false,
                'Calculate Balance - Error',
                `Errore nel calcolo balance: ${error.message}`
            );
        }
    }

    testEdgeCases() {
        try {
            // Test con numero sbagliato di giocatori
            let errorThrown = false;
            try {
                this.generator.generateTeams([]);
            } catch (e) {
                errorThrown = true;
            }
            
            this.assert(
                errorThrown,
                'Edge Cases - Wrong Count',
                'Dovrebbe lanciare errore con numero sbagliato di giocatori'
            );
            
            // Test con giocatori con valori estremi
            const extremePlayers = this.mockPlayers.map((p, i) => ({
                ...p,
                forma: i < 5 ? 10 : 1,
                difesa: i < 5 ? 10 : 1,
                passaggi: i < 5 ? 10 : 1,
                attacco: i < 5 ? 10 : 1,
                dribbling: i < 5 ? 10 : 1
            }));
            
            const result = this.generator.generateTeams(extremePlayers);
            this.assert(
                result.balance >= 0 && result.balance <= 100,
                'Edge Cases - Extreme Values',
                'Dovrebbe gestire valori estremi correttamente'
            );
            
        } catch (error) {
            this.assert(
                false,
                'Edge Cases - Error',
                `Errore nei test edge cases: ${error.message}`
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
        
        console.log(`\n📊 Generator Test Results: ${passed}/${total} passed`);
        
        if (passed === total) {
            console.log('🎉 Tutti i test Generator sono passati!');
        } else {
            console.warn('⚠️ Alcuni test Generator sono falliti. Controlla i log sopra.');
        }
        
        return { passed, total, success: passed === total };
    }
}

// Esporta per uso globale
window.GeneratorTests = GeneratorTests;