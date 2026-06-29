/* Zehn Service Worker — v1 */
const CACHE = 'zehn-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/favicon.ico',
  '/favicon-192.png',
  '/favicon-512.png',
  '/apple-touch-icon.png',
  '/manifest.json',
  '/og-image.png',
];

/* Install: precache shell assets */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

/* Activate: clean up old caches */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Fetch: network-first for HTML, cache-first for assets */
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  /* Only handle same-origin requests */
  if (url.origin !== self.location.origin) return;

  if (request.destination === 'document') {
    /* Network-first for HTML pages */
    e.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
  } else {
    /* Cache-first for everything else (fonts, images, etc.) */
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
          return res;
        });
      })
    );
  }
});
