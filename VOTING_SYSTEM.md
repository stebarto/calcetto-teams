# Sistema di Votazione - Documentazione

## Panoramica

Il sistema di votazione trasforma l'app da semplice generatore di squadre a piattaforma dinamica con storico partite e aggiornamento valori giocatori basato su performance reali.

## Architettura Database

### Tabella `matches`
Storico partite generate.

```sql
- id (UUID)
- data_partita (timestamp)
- votazione_aperta (boolean)
- team_a_score (decimal)
- team_b_score (decimal)
- balance_percentage (int)
- creata_il (timestamp)
```

### Tabella `match_players`
Giocatori per ogni partita con snapshot valori.

```sql
- id
- match_id (FK matches)
- player_id (FK giocatori)
- team ('A' o 'B')
- player_overall (snapshot)
- created_at
```

### Tabella `match_votes`
Voti ricevuti da ogni giocatore.

```sql
- id
- match_id (FK matches)
- player_id (FK giocatori)
- voto_forma (1-10)
- voto_prestazione (1-10)
- creato_il
```

### Tabella `match_voters`
Controllo voti multipli (anonimo).

```sql
- id
- match_id (FK matches)
- voter_token (unique per match)
- voted_at
```

## Flusso Utente

### 1. Generazione Squadre (Admin)
1. Seleziona 10 giocatori
2. Genera squadre
3. Clicca "Conferma Formazione"
4. Sistema crea record in `matches` e `match_players`
5. Riceve link condivisibile

### 2. Votazione (Pubblico Anonimo)
1. Apre link `match.html?id=UUID`
2. Vede squadre congelate
3. Vota ogni giocatore (forma + prestazione)
4. Invia votazioni
5. Sistema salva in `match_votes` e `match_voters`

### 3. Controllo Voti Multipli
- Token generato lato client e salvato in localStorage
- Verifica in `match_voters` prima di mostrare form
- Se già votato: messaggio "Hai già votato"

## Sicurezza e Privacy

### RLS Policies
- **Lettura pubblica**: tutti possono vedere matches e giocatori
- **Scrittura matches**: solo admin autenticato
- **Scrittura voti**: pubblico anonimo (no auth richiesta)

### Anonimato
- Nessun login richiesto per votare
- Token locale non tracciabile a persona fisica
- Voti aggregati senza identificazione votante

## Prossimi Step (Non Implementati)

### Chiusura Votazione
```javascript
// Admin può chiudere manualmente
UPDATE matches 
SET votazione_aperta = false 
WHERE id = 'match_id';
```

### Aggiornamento Valori Giocatori
Logica da implementare:

```javascript
// Calcola media voti per giocatore
SELECT 
  player_id,
  AVG(voto_forma) as avg_forma,
  AVG(voto_prestazione) as avg_prestazione
FROM match_votes
WHERE match_id = 'match_id'
GROUP BY player_id;

// Applica aggiornamento controllato
forma_new = forma_old + (avg_forma - forma_old) * 0.3
altre_skill = skill_old + (avg_prestazione - 5) * 0.05
```

### Dashboard Statistiche
- Storico prestazioni giocatore
- Andamento forma nel tempo
- MVP partita/settimana
- Classifica stagionale

## File Modificati

### Nuovi File
- `match.html` - Pagina votazione pubblica
- `js/match.js` - Logica votazione
- `VOTING_SYSTEM.md` - Questa documentazione

### File Modificati
- `index.html` - Aggiunto bottone "Conferma Formazione"
- `js/app.js` - Logica creazione match e link condivisione
- `css/styles.css` - Stili sistema votazione
- Database Supabase - 4 nuove tabelle con RLS

## Testing

### Test Locale
1. Genera squadre
2. Conferma formazione
3. Copia link match
4. Apri in incognito
5. Vota tutti i giocatori
6. Verifica salvataggio
7. Riapri link → deve mostrare "già votato"

### Test Produzione
1. Deploy su GitHub Pages
2. Condividi link WhatsApp
3. Verifica votazioni multiple persone
4. Controlla dati in Supabase dashboard

## Note Tecniche

- Token votante salvato in localStorage (persistente)
- Nessuna autenticazione richiesta per votare
- Link match pubblici ma non indicizzabili
- Votazioni obbligatorie per tutti i 10 giocatori
- Sistema scalabile per future funzionalità

## Limitazioni Attuali

- Nessuna chiusura automatica votazioni
- Nessun aggiornamento automatico valori giocatori
- Nessuna dashboard statistiche
- Nessuna notifica votazioni completate

Queste funzionalità saranno implementate in iterazioni future.
