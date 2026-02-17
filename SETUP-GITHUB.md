# Guida Setup GitHub Repository

## Passo 1: Crea repository su GitHub

1. Vai su https://github.com/new
2. Nome repository: `calcetto-teams` (o quello che preferisci)
3. Descrizione: "PWA per generare squadre di calcetto 5v5"
4. Scegli Public
5. NON aggiungere README, .gitignore o license (già presenti)
6. Clicca "Create repository"

## Passo 2: Collega repository locale

Apri il terminale nella cartella del progetto ed esegui:

```bash
# Inizializza git (se non già fatto)
git init

# Aggiungi tutti i file
git add .

# Primo commit
git commit -m "Initial commit: Calcetto Teams PWA"

# Collega al repository remoto (sostituisci USERNAME e REPO)
git remote add origin https://github.com/USERNAME/REPO.git

# Push del codice
git branch -M main
git push -u origin main
```

## Passo 3: Attiva GitHub Pages

1. Vai su Settings del repository
2. Nella sidebar, clicca "Pages"
3. Source: "Deploy from a branch"
4. Branch: seleziona "main" e cartella "/ (root)"
5. Clicca "Save"
6. Aspetta 1-2 minuti per il deploy

L'app sarà disponibile su:
```
https://USERNAME.github.io/REPO/
```

## Passo 4: Configura Supabase (opzionale)

Se vuoi usare dati reali invece dei mock:

1. Crea progetto su https://supabase.com
2. Crea tabella `giocatori` (vedi README.md)
3. Copia URL e ANON_KEY
4. Modifica `js/supabase.js` con le tue credenziali
5. Commit e push delle modifiche

## Passo 5: Testa l'app

1. Apri l'URL di GitHub Pages da iPhone Safari
2. Tocca il pulsante "Condividi"
3. Scorri e tocca "Aggiungi a Home"
4. L'app sarà installata come PWA!

## Comandi Git utili

```bash
# Vedere stato modifiche
git status

# Aggiungere modifiche
git add .

# Commit
git commit -m "Descrizione modifiche"

# Push su GitHub
git push

# Vedere cronologia
git log --oneline
```

## Troubleshooting

### L'app non si carica su GitHub Pages
- Verifica che il branch sia "main" nelle impostazioni Pages
- Controlla che i path nei file siano relativi (no `/` iniziale)
- Aspetta qualche minuto per il deploy

### Service Worker non funziona
- Modifica i path in `service-worker.js` se il repo non è nella root
- Esempio: se l'URL è `username.github.io/calcetto-teams/`
  cambia `'/'` in `'/calcetto-teams/'`

### Icone PWA mancanti
- Crea icone 192x192 e 512x512 nella cartella `assets/`
- Usa tool come realfavicongenerator.net
