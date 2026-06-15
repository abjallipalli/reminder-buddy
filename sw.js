// Bump CACHE on every deploy so the new service worker activates and clears the old cache.
const CACHE = 'reminder-buddy-v2';
const ASSETS = [
  './', 'index.html', 'app.js', 'manifest.webmanifest',
  'fonts/instrument.woff2', 'fonts/instrument-ext.woff2',
  'fonts/instrument-italic.woff2', 'fonts/instrument-italic-ext.woff2',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isShell =
    e.request.mode === 'navigate' ||
    url.pathname.endsWith('/') ||
    /\/(index\.html|app\.js|manifest\.webmanifest)$/.test(url.pathname);

  if (isShell) {
    // Network-first for the app shell: when online you always get the latest
    // version; offline (or on failure) fall back to the cached copy.
    e.respondWith(
      fetch(e.request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return resp;
      }).catch(() => caches.match(e.request).then((hit) => hit || caches.match('index.html')))
    );
  } else {
    // Cache-first for fonts/icons — they rarely change, so prefer speed.
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return resp;
      }))
    );
  }
});
