// sw.js – Cache-first service worker for ig_card_tool (PWA)
const CACHE_NAME = "ig-card-tool-v1";
const ASSETS = [
  "/",
  "/ig_card_tool/",
  "/ig_card_tool/index.html",
  "/ig_card_tool/app.js",
  "/ig_card_tool/ui.css",
  "/img/logo.webp"
];

self.addEventListener("install", (evt) => {
  evt.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evt) => {
  if (!evt.request.url.startsWith("http")) return;
  evt.respondWith(
    caches.match(evt.request).then((cached) => {
      const fetchPromise = fetch(evt.request).then((network) => {
        if (network && network.status === 200) {
          const clone = network.clone();
          caches.open(CACHE_NAME).then((c) => c.put(evt.request, clone));
        }
        return network || cached;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
