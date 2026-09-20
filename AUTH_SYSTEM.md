# Sistema di Autenticazione - Documentazione

## Panoramica

L'accesso admin usa **Supabase Auth con Google OAuth**. L'app pubblica (generatore squadre e
votazioni) resta accessibile a tutti senza login: l'autenticazione serve solo a gestire i giocatori
e a chiudere le votazioni.

Fino a febbraio 2026 il login avveniva via magic link email (OTP). È stato sostituito da Google
OAuth a settembre 2026.

## ⚠️ La lista admin vive in due posti

Questo è il punto che fa perdere più tempo, quindi viene prima di tutto il resto.

| Dove | Cosa decide | Effetto se manca |
|------|-------------|------------------|
| `ADMIN_EMAILS` in [js/supabase.js](js/supabase.js) | Cosa **mostra** l'interfaccia | L'account fa login ma non vede la schermata admin |
| `public.is_admin()` su Supabase | Cosa si può **davvero scrivere** (RLS) | L'account vede la schermata admin ma ogni salvataggio fallisce |

Le due liste devono restare allineate. Aggiornare solo la prima è la modalità di guasto peggiore,
perché l'interfaccia sembra funzionare e gli errori arrivano solo al momento del salvataggio.

Entrambe confrontano l'email **in minuscolo**, così un claim JWT con maiuscole si comporta allo
stesso modo da tutte e due le parti.

### Aggiungere un admin

1. Aggiungi l'indirizzo a `ADMIN_EMAILS` in [js/supabase.js](js/supabase.js)
2. Aggiorna la funzione su Supabase:

   ```sql
   create or replace function public.is_admin()
   returns boolean
   language sql
   stable
   set search_path = ''
   as $$
     select lower(coalesce(auth.jwt() ->> 'email', '')) in (
       'stebarto@gmail.com',
       'scheke07@gmail.com',
       'nuovo@gmail.com'
     );
   $$;
   ```

3. **Se la consent screen Google è in modalità _Testing_**, aggiungi l'indirizzo come Test user su
   https://console.cloud.google.com/auth/audience — altrimenti Google rifiuta il login prima ancora
   che Supabase entri in gioco. In modalità _Testing_ Google ammette al massimo 100 Test user.

## Dove sta la sicurezza vera

**Nelle policy RLS, non nel codice JavaScript.**

Il client è codice pubblico: chiunque può aprire i devtools e chiamare `adminUI.showManageScreen()`
a mano. Il check `isAdmin()` in JavaScript serve solo a non mostrare un'interfaccia inutile a chi
non potrebbe salvare nulla — non protegge i dati.

A proteggere i dati sono le policy RLS su Supabase, che girano sul server e validano il JWT firmato:

```
giocatori  "Allow public read"           select  true
giocatori  "Allow admin insert"          insert  is_admin()
giocatori  "Allow admin update"          update  is_admin()
giocatori  "Allow admin delete"          delete  is_admin()
matches    "Allow admin update matches"  update  is_admin()
```

Conseguenza pratica: con Google abilitato **chiunque abbia un account Google può autenticarsi** al
progetto Supabase (si crea una riga in `auth.users`), ma senza essere in `is_admin()` non può
scrivere niente. È accettabile. Per bloccare l'accesso già al login servirebbe un Auth Hook.

## Flusso di login

1. L'utente preme "Accedi con Google" → `supabase.signInWithGoogle()`
2. Redirect del browser a `/auth/v1/authorize?provider=google&redirect_to=...`
3. Supabase manda a Google, Google torna sul callback Supabase, Supabase rimanda all'app
4. I token arrivano **nel frammento dell'URL**: `#access_token=...&refresh_token=...&expires_in=...`
5. `getSession()` legge l'hash, salva la sessione in `localStorage`, ripulisce l'URL
6. `checkAuth()` decodifica il JWT, legge la claim `email` e decide cosa mostrare

Se l'utente annulla, Google rimanda `#error=access_denied` nello stesso posto dei token:
`parseOAuthError()` lo intercetta e mostra un messaggio invece di lasciare la schermata muta.

### Perché i token arrivano nell'hash

L'app chiama `/authorize` direttamente col browser, senza SDK e senza `code_challenge`. In questa
modalità Supabase completa lo scambio del codice lato server e restituisce i token nel frammento.
Il `response_type=code` che si vede nell'URL verso Google riguarda il dialogo Supabase ↔ Google,
non quello Supabase ↔ app.

Il frammento non viene mai inviato al server nelle richieste HTTP, ma resta nella cronologia del
browser: per questo `getSession()` lo azzera appena letto.

## Gestione della sessione

- La sessione è salvata in `localStorage` sotto la chiave `supabase_session`
- Insieme ai token si salva `expires_at`, un timestamp assoluto in secondi (non `expires_in`, che
  è relativo al momento del rilascio e diventa inutile dopo un reload)
- `isSessionExpired()` considera scaduta anche una sessione che scade entro 60 secondi
  (`EXPIRY_SKEW_SECONDS`), per non farsi cogliere a metà richiesta
- Se la sessione è scaduta ma c'è un `refresh_token`, `refreshSession()` la rinnova via
  `/auth/v1/token?grant_type=refresh_token`
- Se il rinnovo fallisce, o manca il refresh token, la sessione locale viene cancellata
- `signOut()` cancella sempre la sessione locale **e poi** chiama `/auth/v1/logout` per invalidarla
  anche lato server; se la chiamata fallisce il logout locale resta comunque valido

**Limite noto:** il rinnovo scatta solo al caricamento della pagina. Lasciando l'admin aperto oltre
la scadenza del token, un salvataggio può restituire 401. Si risolve chiamando `getSession()` prima
delle scritture.

## Configurazione

### Google Cloud

https://console.cloud.google.com/auth/clients — OAuth 2.0 Client ID, tipo *Web application*.

- Authorized JavaScript origins: `https://stebarto.github.io`, più la porta usata in locale
- Authorized redirect URIs: **solo** `https://kiksqvcqqzmawjhpgkzs.supabase.co/auth/v1/callback`

Il redirect URI punta a Supabase, non all'app: è Supabase a ricevere il codice da Google.

### Supabase

- **Providers** → Google: abilitato, con Client ID e Secret di Google Cloud.
  Il toggle va acceso *e* salvato: senza Save la configurazione non viene applicata.
- **URL Configuration** → Site URL `https://stebarto.github.io/calcetto-teams/`,
  Redirect URLs `https://stebarto.github.io/calcetto-teams/**` e `http://localhost:*/**`

Il Client Secret vive solo su Supabase e non deve finire nel repository.

## Verifica rapida

Provider attivi (nessuna autenticazione necessaria, endpoint pubblico):

```bash
curl -s "https://kiksqvcqqzmawjhpgkzs.supabase.co/auth/v1/settings" \
  -H "apikey: <SUPABASE_ANON_KEY>" | jq .external.google
```

Funzione admin, simulando la claim email di un JWT:

```sql
select (
  select public.is_admin()
  from (select set_config('request.jwt.claims','{"email":"nuovo@gmail.com"}',true)) s
);
```

## Troubleshooting

| Sintomo | Causa probabile |
|---------|-----------------|
| `400 Unsupported provider: provider is not enabled` | Provider Google non salvato su Supabase, oppure configurato sul progetto sbagliato |
| Dopo il login si atterra sul Site URL invece che su localhost | `http://localhost:*/**` manca dai Redirect URLs Supabase |
| Google mostra "Accesso bloccato" prima del consenso | Consent screen in *Testing* e indirizzo non incluso fra i Test user |
| Schermata admin visibile ma i salvataggi danno 401/403 | L'indirizzo è in `ADMIN_EMAILS` ma non in `public.is_admin()` |
| Login riuscito ma si torna sempre alla schermata pubblica | L'indirizzo è in `is_admin()` ma non in `ADMIN_EMAILS` |
| Dopo il deploy si vede ancora la vecchia schermata di login | `CACHE_NAME` in [service-worker.js](service-worker.js) non è stato aggiornato: la PWA serve `index.html` dalla cache |

## Test

```bash
node tests/run-node.js        # da terminale, senza browser
open tests/test-runner.html   # nel browser, suite completa
```

[tests/auth.test.js](tests/auth.test.js) copre la logica pura: costruzione dell'URL OAuth, scelta
del redirect, decodifica del JWT, scadenza e rinnovo della sessione, check admin, parsing
dell'hash di ritorno e degli errori OAuth.

Il giro OAuth completo **non è coperto dai test**: richiede un browser e un account Google reale,
quindi va provato a mano dopo ogni modifica al flusso di login.
