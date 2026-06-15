const CACHE = 'reminder-buddy-v1';
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

// Cache-first: the app is fully self-contained, so serve from cache and fall
// back to the network (then cache the response) for anything not yet stored.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((resp) => {
      const copy = resp.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return resp;
    }).catch(() => caches.match('index.html')))
  );
});
