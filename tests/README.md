# 🧪 KickSplit Test Suite

Sistema di test automatici per prevenire regressioni e garantire la qualità del codice.

## 📁 Struttura Test

```
tests/
├── README.md              # Questa documentazione
├── test-runner.html       # Interface web per eseguire i test
├── supabase.test.js       # Test per connessione database
└── generator.test.js      # Test per generazione squadre
```

## 🚀 Come Eseguire i Test

### Metodo 1: Interface Web (Raccomandato)
1. Apri `tests/test-runner.html` nel browser
2. Clicca "🚀 Esegui Tutti i Test"
3. Visualizza i risultati in tempo reale

### Metodo 2: Console Browser
1. Apri la console del browser su `index.html`
2. Esegui `window.runQuickTests()` per test rapidi

### Metodo 3: Automatico (Development)
I test vengono eseguiti automaticamente in modalità development (localhost).

## 📊 Tipi di Test

### 🗄️ Test Supabase
- **Connection Test**: Verifica connettività API
- **Get Players**: Test caricamento giocatori
- **Player Structure**: Validazione struttura dati
- **Player Mapping**: Test mapping database → app
- **Mock Fallback**: Test dati di fallback

### ⚽ Test Generator
- **Calculate Overall**: Test calcolo punteggio giocatore
- **Generate Teams**: Test generazione squadre bilanciate
- **Generate Random**: Test generazione casuale
- **Shuffle**: Test algoritmo di mescolamento
- **Calculate Balance**: Test calcolo equilibrio squadre
- **Edge Cases**: Test casi limite e errori

## 🎯 Obiettivi Test

1. **Prevenire Regressioni**: Catturare errori prima del deploy
2. **Validare Connessioni**: Assicurare funzionamento database
3. **Testare Algoritmi**: Verificare logica generazione squadre
4. **Documentare Comportamenti**: Esempi di uso corretto

## 📈 Interpretazione Risultati

- **✅ Verde**: Test passato
- **❌ Rosso**: Test fallito
- **📊 Statistiche**: Percentuale successo complessivo

### Soglie di Qualità
- **100%**: Eccellente - Deploy sicuro
- **90-99%**: Buono - Verificare test falliti
- **<90%**: Attenzione - Non deployare

## 🔧 Aggiungere Nuovi Test

### Esempio Test Supabase
```javascript
async testNuovaFunzione() {
    try {
        const result = await supabase.nuovaFunzione();
        
        this.assert(
            result !== null,
            'Nuova Funzione - Not Null',
            'Il risultato non dovrebbe essere null'
        );
        
    } catch (error) {
        this.assert(
            false,
            'Nuova Funzione - Error',
            `Errore: ${error.message}`
        );
    }
}
```

### Esempio Test Generator
```javascript
testNuovoAlgoritmo() {
    try {
        const result = this.generator.nuovoAlgoritmo(this.mockPlayers);
        
        this.assert(
            Array.isArray(result),
            'Nuovo Algoritmo - Array',
            'Dovrebbe restituire un array'
        );
        
    } catch (error) {
        this.assert(
            false,
            'Nuovo Algoritmo - Error',
            `Errore: ${error.message}`
        );
    }
}
```

## 🚨 Troubleshooting

### Test Supabase Falliscono
1. Verifica connessione internet
2. Controlla credenziali Supabase
3. Verifica CORS settings

### Test Generator Falliscono
1. Controlla dati mock
2. Verifica algoritmi matematici
3. Controlla edge cases

### Performance Lenti
1. Riduci numero iterazioni nei test
2. Usa mock data più piccoli
3. Ottimizza algoritmi

## 📝 Best Practices

1. **Esegui test prima di ogni commit**
2. **Aggiungi test per nuove funzionalità**
3. **Mantieni test semplici e focalizzati**
4. **Usa nomi descrittivi per i test**
5. **Documenta comportamenti attesi**

## 🔄 Integrazione CI/CD

Per integrare con GitHub Actions o altri sistemi CI/CD:

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Tests
        run: |
          # Avvia server locale
          python -m http.server 8000 &
          # Esegui test con headless browser
          npx playwright test tests/
```

---

**💡 Tip**: Esegui sempre i test dopo modifiche importanti per garantire che tutto funzioni correttamente!