// Runner Node per i test che non richiedono un browser reale.
// Carica gli stessi file usati da test-runner.html dentro un contesto con
// gli stub minimi del browser (window, localStorage, fetch).

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

function makeLocalStorage() {
    const store = new Map();
    return {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
        clear: () => store.clear()
    };
}

function makeContext() {
    const localStorage = makeLocalStorage();
    const window = {
        location: {
            hostname: 'stebarto.github.io',
            origin: 'https://stebarto.github.io',
            pathname: '/calcetto-teams/',
            hash: '',
            href: 'https://stebarto.github.io/calcetto-teams/'
        },
        localStorage
    };
    const sandbox = {
        window,
        localStorage,
        console,
        fetch,
        URLSearchParams,
        TextEncoder,
        TextDecoder,
        atob: (b64) => Buffer.from(b64, 'base64').toString('binary'),
        btoa: (str) => Buffer.from(str, 'binary').toString('base64')
    };
    sandbox.globalThis = sandbox;
    return vm.createContext(sandbox);
}

function load(context, relPath, exportsLine = '') {
    const src = fs.readFileSync(path.join(root, relPath), 'utf8');
    vm.runInContext(src + '\n' + exportsLine, context, { filename: relPath });
}

async function main() {
    const context = makeContext();

    load(context, 'js/supabase.js', 'globalThis.SupabaseClient = SupabaseClient;');
    load(context, 'tests/auth.test.js');
    load(context, 'tests/supabase.test.js');

    const results = [];

    console.log('\n🔐 === TEST AUTH ===');
    results.push(...(await new context.window.AuthTests().runAllTests()));

    console.log('\n🗄️ === TEST SUPABASE ===');
    results.push(...(await new context.window.SupabaseTests().runAllTests()));

    const failed = results.filter((r) => !r.passed);
    if (failed.length > 0) {
        console.error(`\n${failed.length} test falliti`);
        process.exit(1);
    }
    console.log(`\nTutti i ${results.length} test passati`);
}

main().catch((err) => {
    console.error('Runner error:', err.message);
    process.exit(1);
});
