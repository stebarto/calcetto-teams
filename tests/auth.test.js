// Unit Test per Autenticazione Google OAuth
// Test sulla logica pura: costruzione URL, decodifica JWT, scadenza sessione, check admin

class AuthTests {
    constructor() {
        this.results = [];
        this.supabase = null;
    }

    async runAllTests() {
        console.log('🧪 Avvio test Auth...');

        this.supabase = new SupabaseClient();

        this.testGoogleAuthUrl();
        this.testRedirectUrl();
        this.testDecodeJwt();
        this.testGetUserEmail();
        this.testIsAdmin();
        this.testSessionExpiry();
        this.testParseSessionFromHash();
        await this.testGetSession();
        await this.testRefreshSession();
        this.testOAuthError();

        this.printResults();
        return this.results;
    }

    testGoogleAuthUrl() {
        const redirectTo = 'https://stebarto.github.io/calcetto-teams/';
        const authUrl = this.supabase.buildGoogleAuthUrl(redirectTo);

        this.assert(
            authUrl.startsWith(`${this.supabase.url}/auth/v1/authorize`),
            'Google Auth URL - Endpoint',
            'L\'URL dovrebbe puntare all\'endpoint authorize di Supabase'
        );

        this.assert(
            authUrl.includes('provider=google'),
            'Google Auth URL - Provider',
            'L\'URL dovrebbe specificare provider=google'
        );

        this.assert(
            authUrl.includes(`redirect_to=${encodeURIComponent(redirectTo)}`),
            'Google Auth URL - Redirect Encoded',
            'Il redirect_to dovrebbe essere URL-encoded'
        );
    }

    testRedirectUrl() {
        const originalLocation = window.location;

        window.location = {
            hostname: 'localhost',
            origin: 'http://localhost:5500',
            pathname: '/index.html'
        };
        this.assert(
            this.supabase.getRedirectUrl() === 'http://localhost:5500/index.html',
            'Redirect URL - Localhost',
            'In locale dovrebbe usare origin + pathname correnti'
        );

        window.location = {
            hostname: 'stebarto.github.io',
            origin: 'https://stebarto.github.io',
            pathname: '/calcetto-teams/'
        };
        this.assert(
            this.supabase.getRedirectUrl() === 'https://stebarto.github.io/calcetto-teams/',
            'Redirect URL - Produzione',
            'In produzione dovrebbe usare l\'URL fisso di GitHub Pages'
        );

        window.location = originalLocation;
    }

    // Costruisce un JWT finto (header.payload.signature) per i test di decodifica
    fakeJwt(payload) {
        const b64url = (obj) => btoa(JSON.stringify(obj))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.firma-finta`;
    }

    testDecodeJwt() {
        const token = this.fakeJwt({ email: 'stebarto@gmail.com', exp: 1800000000 });
        const payload = this.supabase.decodeJwt(token);

        this.assert(
            payload !== null && payload.email === 'stebarto@gmail.com',
            'Decode JWT - Payload',
            'Dovrebbe estrarre le claim dal payload del JWT'
        );

        this.assert(
            this.supabase.decodeJwt('non-un-jwt') === null,
            'Decode JWT - Token Malformato',
            'Un token malformato dovrebbe restituire null invece di lanciare'
        );

        this.assert(
            this.supabase.decodeJwt(null) === null,
            'Decode JWT - Token Assente',
            'Un token assente dovrebbe restituire null'
        );
    }

    testGetUserEmail() {
        this.supabase.session = null;
        this.assert(
            this.supabase.getUserEmail() === null,
            'User Email - Nessuna Sessione',
            'Senza sessione l\'email dovrebbe essere null'
        );

        this.supabase.session = {
            access_token: this.fakeJwt({ email: 'Tizio@Example.com', exp: 1800000000 })
        };
        this.assert(
            this.supabase.getUserEmail() === 'tizio@example.com',
            'User Email - Normalizzata',
            'L\'email dovrebbe essere restituita in minuscolo'
        );

        this.supabase.session = null;
    }

    testIsAdmin() {
        this.supabase.session = null;
        this.assert(
            this.supabase.isAdmin() === false,
            'Is Admin - Nessuna Sessione',
            'Senza sessione non si dovrebbe risultare admin'
        );

        this.supabase.session = {
            access_token: this.fakeJwt({ email: 'estraneo@gmail.com', exp: 1800000000 })
        };
        this.assert(
            this.supabase.isAdmin() === false,
            'Is Admin - Email Non Autorizzata',
            'Un\'email diversa da quella admin non dovrebbe risultare admin'
        );

        this.supabase.session = {
            access_token: this.fakeJwt({ email: 'StebArto@Gmail.com', exp: 1800000000 })
        };
        this.assert(
            this.supabase.isAdmin() === true,
            'Is Admin - Email Admin',
            'L\'email admin dovrebbe risultare admin a prescindere dal maiuscolo'
        );

        this.supabase.session = {
            access_token: this.fakeJwt({ email: 'scheke07@gmail.com', exp: 1800000000 })
        };
        this.assert(
            this.supabase.isAdmin() === true,
            'Is Admin - Secondo Admin',
            'Anche il secondo indirizzo autorizzato dovrebbe risultare admin'
        );

        this.supabase.session = null;
    }

    testSessionExpiry() {
        const now = Math.floor(Date.now() / 1000);

        this.supabase.session = { access_token: 'x', expires_at: now - 10 };
        this.assert(
            this.supabase.isSessionExpired() === true,
            'Session Expiry - Scaduta',
            'Una sessione con expires_at nel passato dovrebbe risultare scaduta'
        );

        this.supabase.session = { access_token: 'x', expires_at: now + 3600 };
        this.assert(
            this.supabase.isSessionExpired() === false,
            'Session Expiry - Valida',
            'Una sessione con expires_at nel futuro non dovrebbe risultare scaduta'
        );

        this.supabase.session = { access_token: 'x', expires_at: now + 10 };
        this.assert(
            this.supabase.isSessionExpired() === true,
            'Session Expiry - Margine',
            'Una sessione in scadenza entro il margine di sicurezza dovrebbe essere rinnovata'
        );

        this.supabase.session = { access_token: 'x' };
        this.assert(
            this.supabase.isSessionExpired() === true,
            'Session Expiry - Senza Scadenza',
            'Una sessione senza expires_at dovrebbe essere trattata come scaduta'
        );

        this.supabase.session = null;
    }

    testParseSessionFromHash() {
        const hash = '#access_token=abc123&refresh_token=ref456&expires_in=3600&token_type=bearer';
        const session = this.supabase.parseSessionFromHash(hash);

        this.assert(
            session !== null && session.access_token === 'abc123',
            'Parse Hash - Access Token',
            'Dovrebbe estrarre l\'access_token dall\'hash di ritorno'
        );

        this.assert(
            session !== null && session.refresh_token === 'ref456',
            'Parse Hash - Refresh Token',
            'Dovrebbe estrarre il refresh_token dall\'hash di ritorno'
        );

        const expectedExpiry = Math.floor(Date.now() / 1000) + 3600;
        this.assert(
            session !== null && Math.abs(session.expires_at - expectedExpiry) <= 2,
            'Parse Hash - Expires At',
            'Dovrebbe convertire expires_in in un timestamp assoluto expires_at'
        );

        this.assert(
            this.supabase.parseSessionFromHash('#error=access_denied') === null,
            'Parse Hash - Errore OAuth',
            'Un hash senza access_token dovrebbe restituire null'
        );

        this.assert(
            this.supabase.parseSessionFromHash('') === null,
            'Parse Hash - Hash Vuoto',
            'Un hash vuoto dovrebbe restituire null'
        );
    }

    async testGetSession() {
        const now = Math.floor(Date.now() / 1000);

        // Ritorno da Google: i token arrivano nell'hash
        localStorage.removeItem('supabase_session');
        this.supabase.session = null;
        window.location.hash = '#access_token=tok-hash&refresh_token=ref-hash&expires_in=3600';

        const fromHash = await this.supabase.getSession();
        this.assert(
            fromHash !== null && fromHash.access_token === 'tok-hash',
            'Get Session - Da Hash',
            'Dovrebbe recuperare la sessione dai token nell\'hash'
        );

        this.assert(
            window.location.hash === '',
            'Get Session - Hash Pulito',
            'I token non dovrebbero restare nell\'URL dopo il login'
        );

        this.assert(
            JSON.parse(localStorage.getItem('supabase_session')).access_token === 'tok-hash',
            'Get Session - Persistenza',
            'La sessione dovrebbe essere salvata in localStorage'
        );

        // Sessione valida già salvata
        this.supabase.session = null;
        window.location.hash = '';
        localStorage.setItem('supabase_session', JSON.stringify({
            access_token: 'tok-salvato',
            refresh_token: 'ref-salvato',
            expires_at: now + 3600
        }));

        const restored = await this.supabase.getSession();
        this.assert(
            restored !== null && restored.access_token === 'tok-salvato',
            'Get Session - Ripristino',
            'Dovrebbe ripristinare una sessione valida da localStorage'
        );

        // Sessione scaduta senza refresh token: va buttata
        this.supabase.session = null;
        localStorage.setItem('supabase_session', JSON.stringify({
            access_token: 'tok-scaduto',
            expires_at: now - 3600
        }));

        const expired = await this.supabase.getSession();
        this.assert(
            expired === null,
            'Get Session - Scaduta',
            'Una sessione scaduta non rinnovabile non dovrebbe essere restituita'
        );

        this.assert(
            localStorage.getItem('supabase_session') === null,
            'Get Session - Pulizia Scaduta',
            'Una sessione scaduta non rinnovabile dovrebbe essere rimossa da localStorage'
        );

        this.supabase.session = null;
    }

    async testRefreshSession() {
        const now = Math.floor(Date.now() / 1000);
        const originalFetch = globalThis.fetch;

        // Rinnovo riuscito
        globalThis.fetch = async () => ({
            ok: true,
            json: async () => ({
                access_token: 'tok-nuovo',
                refresh_token: 'ref-nuovo',
                expires_in: 3600
            })
        });

        this.supabase.session = { access_token: 'tok-vecchio', refresh_token: 'ref-vecchio', expires_at: now - 10 };
        const refreshed = await this.supabase.refreshSession();

        this.assert(
            refreshed !== null && refreshed.access_token === 'tok-nuovo',
            'Refresh - Rinnovo Riuscito',
            'Dovrebbe sostituire la sessione con i token rinnovati'
        );

        this.assert(
            refreshed !== null && refreshed.expires_at > now,
            'Refresh - Nuova Scadenza',
            'La sessione rinnovata dovrebbe avere una scadenza futura'
        );

        // Refresh token rifiutato dal server
        globalThis.fetch = async () => ({ ok: false, json: async () => ({}) });

        this.supabase.session = { access_token: 'tok-vecchio', refresh_token: 'ref-invalido', expires_at: now - 10 };
        const rejected = await this.supabase.refreshSession();

        this.assert(
            rejected === null,
            'Refresh - Rifiutato',
            'Un refresh rifiutato dovrebbe restituire null'
        );

        this.assert(
            localStorage.getItem('supabase_session') === null,
            'Refresh - Pulizia Dopo Rifiuto',
            'Un refresh rifiutato dovrebbe cancellare la sessione locale'
        );

        // Rete irraggiungibile
        globalThis.fetch = async () => { throw new Error('network down'); };

        this.supabase.session = { access_token: 'tok-vecchio', refresh_token: 'ref-vecchio', expires_at: now - 10 };
        const offline = await this.supabase.refreshSession();

        this.assert(
            offline === null && this.supabase.session === null,
            'Refresh - Rete Irraggiungibile',
            'Un errore di rete non dovrebbe lasciare una sessione inconsistente'
        );

        globalThis.fetch = originalFetch;
        this.supabase.session = null;
    }

    testOAuthError() {
        const denied = this.supabase.parseOAuthError(
            '#error=access_denied&error_code=403&error_description=Utente+ha+annullato'
        );

        this.assert(
            denied !== null && denied.error === 'access_denied',
            'OAuth Error - Codice',
            'Dovrebbe estrarre il codice di errore dall\'hash'
        );

        this.assert(
            denied !== null && denied.description === 'Utente ha annullato',
            'OAuth Error - Descrizione',
            'Dovrebbe decodificare la descrizione dell\'errore'
        );

        this.assert(
            this.supabase.parseOAuthError('#access_token=abc&expires_in=3600') === null,
            'OAuth Error - Login Riuscito',
            'Un hash con i token non dovrebbe essere letto come errore'
        );

        this.assert(
            this.supabase.parseOAuthError('') === null,
            'OAuth Error - Hash Vuoto',
            'Un hash vuoto non dovrebbe produrre un errore'
        );
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
window.AuthTests = AuthTests;
