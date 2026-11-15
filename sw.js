/* Holidays service worker: makes the app open with no connection.
   Online → always fetch the latest files (and refresh the offline copy).
   Offline or very slow → fall back to the saved copy. */
const CACHE = 'holidays-shell-v1';
const SHELL = [
  './',
  'index.html',
  'css/styles.css',
  'js/app.js',
  'manifest.webmanifest',
  'icons/favicon.svg',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });

    const network = fetch(req).then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    });

    if (!cached) return network;

    // Give the network a moment; on bad hotel Wi-Fi use the saved copy instead of hanging.
    const timeout = new Promise((resolve) => setTimeout(() => resolve(cached), 2500));
    return Promise.race([network.catch(() => cached), timeout]);
  })());
});
