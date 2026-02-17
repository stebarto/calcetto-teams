# design.md

## Obiettivo UX/UI
L'app deve essere:

- velocissima da usare prima di una partita
- leggibile a colpo d'occhio
- ottimizzata per iPhone
- visivamente moderna, ispirata allo screenshot di riferimento
- NON con look Bootstrap standard

Priorità: velocità > effetti grafici.

---

## Principi UX

### Flusso ideale
1. Apri app
2. Seleziona presenti
3. Premi Genera
4. Vedi squadre e equilibrio
5. Rigenera o reset

Massimo 2 tocchi per azione importante.

---

## Schermate principali

### 1. Selezione giocatori

Contenuti:
- lista giocatori scrollabile
- checkbox/toggle grande
- ruolo visibile
- overall piccolo
- contatore selezionati
- bottone Genera fisso in basso

Layout Bootstrap:

- container-fluid
- list-group custom
- sticky-bottom per CTA

Regole:
- disabilitare selezione oltre 10
- bottone disabilitato se != 10

---

### 2. Risultato squadre (riferimento screenshot)

Layout split verticale:

```
| Squadra A | Squadra B |
```

Due colonne 50/50.

Bootstrap:
- row g-0
- col-6

Colori differenti per separazione immediata.

Contenuti per colonna:
- nome squadra
- forza totale
- lista giocatori

Riga giocatore senza foto:

```
Nome Cognome        8.4
RUOLO
```

Punteggi allineati a destra.

---

## Header risultato

Minimal:

- titolo: 5 vs 5
- equilibrio percentuale con colore stato

Esempio:

```
Equilibrio 93% 🟢
```

---

## Footer azioni

Barra fissa in basso:

- Bottone cestino (reset squadre)
- Bottone rigenera

Bootstrap:
- d-flex
- gap-2
- sticky-bottom

---

## Sistema colori (custom)

NON usare colori di default Bootstrap.

Ispirazione:
- verde lime sportivo
- contrasto chiaro/scuro
- look energia calcetto

### Palette consigliata

- primary lime: #C8F35A
- dark panel: #171717
- light panel: #F2F2F2
- text dark: #121212
- text light: #FFFFFF
- accent success: #2ECC71
- accent warning: #F39C12
- accent danger: #E74C3C

Uso:
- header lime
- colonna sinistra scura
- colonna destra chiara

---

## Tipografia

Consigliato:
- Inter oppure system-ui

Regole:
- numeri punteggio più grandi
- ruoli piccoli e secondari
- alta leggibilità

---

## Customizzazione Bootstrap

Bootstrap solo per griglia e utilità.

Override in `styles.css`:

- border-radius più marcati
- ombre leggere
- niente blu bootstrap
- bottoni custom

Esempio:

```css
.btn-primary {
  background: #C8F35A;
  border: none;
  color: #121212;
}
```

---

## Componenti UI chiave

### Player row
- altezza comoda per tap
- padding verticale ampio
- feedback al tap

### Genera button
- grande
- full width
- sticky bottom

### Equilibrio indicator
- badge colorato:
  - verde >= 90
  - giallo 80-89
  - rosso < 80

---

## Responsive design

Target principale:
- iPhone (viewport stretta)

Regole:
- niente tabelle
- testo sempre leggibile
- bottoni grandi
- no hover dependency

Tablet:
- stesso layout, più spazio verticale.

---

## Animazioni leggere

Solo micro interazioni:
- fade-in squadre dopo generazione
- transizione 200-300ms
- no animazioni pesanti

---

## Accessibilità minima

- contrasto elevato
- target touch minimo 44px
- font non troppo piccolo

---

## Errori da evitare

- stile bootstrap puro
- troppe informazioni
- icone decorative inutili
- popup frequenti

---

## Feeling finale

Deve sembrare:
- sportiva
- veloce
- pulita
- quasi nativa su iPhone
