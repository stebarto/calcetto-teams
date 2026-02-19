const CACHE_NAME = 'kicksplit-v5';
const urlsToCache = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/supabase.js',
  './js/generator.js',
  './js/admin.js',
  './manifest.json',
  './assets/favicon_io/favicon.ico',
  './assets/favicon_io/android-chrome-192x192.png',
  './assets/favicon_io/android-chrome-512x512.png',
  './assets/favicon_io/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
