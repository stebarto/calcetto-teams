# Calcetto Teams

Progressive Web App per generare squadre di calcetto 5 vs 5 bilanciate.

## Caratteristiche

- ⚡ Veloce e ottimizzata per mobile
- 🎨 Design moderno con palette lime sportiva
- 📱 Installabile come app su iPhone
- ⚖️ Algoritmo di bilanciamento squadre
- 🔄 Rigenerazione multipla per risultato ottimale

## Setup

### 1. Configurazione Supabase

1. Crea un progetto su [Supabase](https://supabase.com)
2. Crea la tabella `giocatori`:

```sql
CREATE TABLE giocatori (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  forma INT CHECK (forma BETWEEN 1 AND 10),
  difesa INT CHECK (difesa BETWEEN 1 AND 10),
  passaggi INT CHECK (passaggi BETWEEN 1 AND 10),
  attacco INT CHECK (attacco BETWEEN 1 AND 10),
  dribbling INT CHECK (dribbling BETWEEN 1 AND 10),
  ruolo TEXT CHECK (ruolo IN ('DIF', 'CEN', 'ATT', 'JOLLY')),
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

3. Abilita Row Level Security e aggiungi policy per SELECT pubblico
4. Copia URL e ANON KEY del progetto
5. Modifica `js/supabase.js` con le tue credenziali

### 2. Sviluppo locale

```bash
# Usa un server locale (es. Live Server in VS Code)
# oppure
python -m http.server 8000
```

### 3. Deploy su GitHub Pages

1. Crea repository su GitHub
2. Push del codice
3. Settings > Pages > Deploy from branch main
4. L'app sarà disponibile su `https://username.github.io/repo-name`

## Struttura progetto

```
/
├── index.html
├── manifest.json
├── service-worker.js
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── supabase.js
│   └── generator.js
└── assets/
    ├── icon-192.png
    └── icon-512.png
```

## Uso

1. Seleziona 10 giocatori dalla lista
2. Premi "Genera Squadre"
3. Visualizza le squadre bilanciate
4. Rigenera o reset per ricominciare

## Tecnologie

- HTML5 + CSS3 + JavaScript vanilla
- Bootstrap 5 (solo griglia)
- Supabase (database)
- PWA (manifest + service worker)

## Note

L'app include dati mock per demo. Configura Supabase per usare dati reali.
