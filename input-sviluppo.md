# indicazioni-sviluppo.md

## Obiettivo
Realizzare una Progressive Web App (PWA) per generare squadre di calcetto 5 vs 5, ospitata su GitHub Pages e con database esterno (Supabase).  
L'app deve permettere:

- gestione giocatori con valori da 1 a 10
- selezione dei presenti prima della partita
- generazione automatica di due squadre bilanciate
- calcolo percentuale di equilibrio
- reset e rigenerazione squadre

---

## Stack tecnico

### Frontend
- HTML + CSS + JavaScript
- Bootstrap 5 (layout responsive)
- Bootstrap Icons (opzionale)
- Nessun backend server (hosting statico)

### Hosting
- GitHub Pages

### Database
- Supabase (PostgreSQL + API REST)

### PWA
- manifest.json
- service worker (cache base)
- installabile su iPhone da Safari

---

## Setup progetto (struttura cartelle)

```
/project-root
  /css
    styles.css
  /js
    app.js
    supabase.js
    generator.js
  /assets
    icons/
  index.html
  manifest.json
  service-worker.js
  README.md
```

---

## Installazione locale

1. Clona repository
2. Apri con un server locale (es. VSCode Live Server)
3. Configura Supabase

Dipendenze CDN consigliate:

```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
```

---

## Configurazione Supabase

Creare progetto Supabase e usare:

- SUPABASE_URL
- SUPABASE_ANON_KEY (pubblica)

Attenzione:
- NON usare SERVICE ROLE KEY nel frontend
- Abilitare Row Level Security (RLS)

### Tabella: giocatori

Campi consigliati:

| campo | tipo |
|---|---|
| id | bigint (pk) |
| nome | text |
| forma | int |
| difesa | int |
| passaggi | int |
| attacco | int |
| dribbling | int |
| ruolo | text |
| attivo | boolean |
| created_at | timestamp |

Valori sempre nel range 1..10.

### Policy RLS suggerite
- SELECT: consentito
- INSERT/UPDATE/DELETE: solo utenti autenticati (admin)

---

## Modello dati lato app

```js
Player = {
  id: number,
  nome: string,
  forma: number,
  difesa: number,
  passaggi: number,
  attacco: number,
  dribbling: number,
  ruolo: "DIF" | "CEN" | "ATT" | "JOLLY",
  attivo: boolean
}
```

---

## Calcolo overall

Calcolare automaticamente:

```js
overall =
  forma * 0.25 +
  difesa * 0.20 +
  passaggi * 0.20 +
  attacco * 0.20 +
  dribbling * 0.15
```

Non salvare overall nel DB, calcolarlo in runtime.

---

## Regole di selezione giocatori

- massimo 10 giocatori selezionati
- 5 per squadra
- se raggiunti 10, disabilitare selezioni extra
- bottone Genera attivo solo con 10 selezionati

Contatore UI:

```
X / 10 selezionati
```

---

## Algoritmo generazione squadre

### Obiettivo
Bilanciare forza totale e ruoli.

### Procedura base
1. Calcolare overall di ogni giocatore
2. Ordinare per overall decrescente
3. Assegnare ogni giocatore alla squadra con punteggio minore
4. Verificare dimensione massima 5 giocatori per team

Pseudo:

```js
for (player of sortedPlayers) {
  if (teamA.score <= teamB.score && teamA.length < 5) {
    teamA.push(player)
  } else {
    teamB.push(player)
  }
}
```

### Miglioramento consigliato
Ripetere la generazione più volte (es. 50 iterazioni random) e tenere il risultato con equilibrio migliore.

---

## Percentuale di equilibrio

```
equilibrio = (min(A, B) / max(A, B)) * 100
```

Interpretazione:
- 95-100 ottimo
- 85-94 buono
- 75-84 accettabile
- <75 sbilanciato

---

## Flow applicazione

1. Carica giocatori dal DB
2. Schermata selezione presenti
3. Click su Genera
4. Mostra squadre (split view)
5. Azioni:
   - Rigenera (stessi giocatori)
   - Cestino (reset squadre e ritorno selezione)

---

## Stato applicazione suggerito

```js
state = {
  players: [],
  selectedPlayers: [],
  teams: null,
  balance: null
}
```

---

## PWA setup minimo

### manifest.json
- name
- short_name
- display: standalone
- start_url: /
- icons

### service-worker.js
- cache file statici
- fallback offline base

---

## Note implementative

- Evitare logica complessa lato UI
- Separare moduli:
  - accesso DB
  - logica generazione
  - rendering
- Usare classi Bootstrap solo per layout, non per stile finale

---

## Deploy GitHub Pages

1. Push su repository
2. Settings > Pages
3. Deploy branch main / root
4. Verificare path relativi per PWA

