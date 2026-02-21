const CACHE_NAME = 'kicksplit-v' + new Date().toISOString().slice(0,10).replace(/-/g,'');
const urlsToCache = [
    './',
    './index.html',
    './match.html',
    './css/styles.css',
    './js/app.js',
    './js/supabase.js',
    './js/generator.js',
    './js/admin.js',
    './js/match.js',
    './version.js',
    './manifest.json',
    './assets/favicon_io/favicon.ico',
    './assets/favicon_io/android-chrome-192x192.png',
    './assets/favicon_io/android-chrome-512x512.png',
    './assets/favicon_io/apple-touch-icon.png',
    './assets/votazioni/1.affanno.png',
    './assets/votazioni/2.neutro.png',
    './assets/votazioni/3.in-forma.png',
    './assets/giocatori/barba.png',
    './assets/giocatori/biondo.png',
    './assets/giocatori/moro.png',
    './assets/giocatori/pelato.png'
];

// Installa service worker
self.addEventListener('install', event => {
    console.log('🔧 Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('✅ Service Worker: Installation complete');
                // Forza l'attivazione immediata
                return self.skipWaiting();
            })
    );
});

// Attiva service worker e pulisci cache vecchie
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker: Activation complete');
            // Prendi controllo di tutte le pagine
            return self.clients.claim();
        })
    );
});

// Intercetta richieste di rete
self.addEventListener('fetch', event => {
    // Skip per richieste non-GET o esterne
    if (event.request.method !== 'GET' || 
        !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Restituisci dalla cache se disponibile
                if (response) {
                    console.log('📦 Service Worker: Serving from cache:', event.request.url);
                    return response;
                }

                // Altrimenti fetch dalla rete
                console.log('🌐 Service Worker: Fetching from network:', event.request.url);
                return fetch(event.request).then(response => {
                    // Non cachare se la risposta non è valida
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clona la risposta per la cache
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
    );
});

// Gestisci messaggi dal client
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('⏭️ Service Worker: Skip waiting requested');
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: CACHE_NAME,
            timestamp: new Date().toISOString()
        });
    }
});
