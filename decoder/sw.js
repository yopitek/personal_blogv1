const CACHE_NAME = 'decoder-v3';
const ASSETS = [
  '/decoder/',
  '/decoder/index.html',
  '/decoder/manifest.json',
  '/decoder/assets/index-DztHIU44.js',
  '/decoder/assets/index-B9O8-oZP.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k.startsWith('decoder-') && k !== CACHE_NAME).map((k) => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isHtml = url.pathname.endsWith('/') || url.pathname.endsWith('.html');

  if (isHtml) {
    // Network-first for HTML: always try to get fresh HTML,
    // fall back to cache if offline
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first for assets (JS, CSS, etc.)
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
