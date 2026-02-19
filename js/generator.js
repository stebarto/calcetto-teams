// Logica generazione squadre

class TeamGenerator {
    calculateOverall(player) {
        return (
            player.forma * 0.25 +
            player.difesa * 0.20 +
            player.passaggi * 0.20 +
            player.attacco * 0.20 +
            player.dribbling * 0.15
        );
    }

    generateTeams(players) {
        if (players.length !== 10) {
            throw new Error('Servono esattamente 10 giocatori');
        }

        // Prova multiple generazioni e scegli la migliore
        let bestResult = null;
        let bestBalance = 0;

        for (let i = 0; i < 100; i++) {
            const result = this.generateSingleAttempt([...players]);
            const balance = this.calculateBalance(result.teamA, result.teamB);
            
            if (balance > bestBalance) {
                bestBalance = balance;
                bestResult = result;
            }
        }

        return {
            teamA: bestResult.teamA,
            teamB: bestResult.teamB,
            balance: bestBalance
        };
    }

    // Genera una singola combinazione casuale (per rigenera)
    generateRandomTeams(players) {
        if (players.length !== 10) {
            throw new Error('Servono esattamente 10 giocatori');
        }

        console.log('generateRandomTeams - Input players:', players.map(p => p.nome));
        
        // Shuffle completo dei giocatori
        const shuffled = this.shuffle([...players]);
        console.log('After shuffle:', shuffled.map(p => p.nome));
        
        // Calcola overall per ogni giocatore
        const playersWithOverall = shuffled.map(p => ({
            ...p,
            overall: this.calculateOverall(p)
        }));

        // Dividi semplicemente in due gruppi da 5
        const teamA = playersWithOverall.slice(0, 5);
        const teamB = playersWithOverall.slice(5, 10);
        
        console.log('generateRandomTeams - Team A:', teamA.map(p => p.nome));
        console.log('generateRandomTeams - Team B:', teamB.map(p => p.nome));
        
        const balance = this.calculateBalance(teamA, teamB);

        return {
            teamA: teamA,
            teamB: teamB,
            balance: balance
        };
    }

    generateSingleAttempt(players) {
        // Shuffle per randomizzare
        const shuffled = this.shuffle(players);
        console.log('After shuffle:', shuffled.map(p => p.nome));
        
        // Calcola overall per ogni giocatore
        const playersWithOverall = shuffled.map(p => ({
            ...p,
            overall: this.calculateOverall(p)
        }));

        // Ordina per overall decrescente
        playersWithOverall.sort((a, b) => b.overall - a.overall);
        console.log('After sort by overall:', playersWithOverall.map(p => `${p.nome}(${p.overall.toFixed(1)})`));

        const teamA = [];
        const teamB = [];

        // Assegna giocatori bilanciando forza totale
        for (const player of playersWithOverall) {
            const scoreA = this.getTeamScore(teamA);
            const scoreB = this.getTeamScore(teamB);

            if (teamA.length < 5 && (scoreA <= scoreB || teamB.length >= 5)) {
                teamA.push(player);
            } else {
                teamB.push(player);
            }
        }

        return { teamA, teamB };
    }

    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    getTeamScore(team) {
        return team.reduce((sum, player) => sum + player.overall, 0);
    }

    calculateBalance(teamA, teamB) {
        const scoreA = this.getTeamScore(teamA);
        const scoreB = this.getTeamScore(teamB);
        const min = Math.min(scoreA, scoreB);
        const max = Math.max(scoreA, scoreB);
        return Math.round((min / max) * 100);
    }
}

const generator = new TeamGenerator();
