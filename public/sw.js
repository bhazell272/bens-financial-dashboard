// Offline support for Daily Financial News Watch.
// Data (./data/*.json): network first, so mornings are always fresh when
// online; the last copy is served when offline or behind a slow VPN.
// App files: cache first, refreshed in the background.
const VERSION = 'dfnw-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(['./', './index.html', './manifest.webmanifest'])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  if (url.pathname.includes('/data/') || url.pathname.includes('/demo/')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(VERSION).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || Response.error())),
    );
    return;
  }

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((cached) => {
      const network = fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached || caches.match('./index.html'));
      return cached || network;
    }),
  );
});
