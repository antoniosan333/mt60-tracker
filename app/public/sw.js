/* Minimal service worker: cache-first for static assets and SPA navigation */
const CACHE_NAME = 'mt-60-v1';
const CORE_ASSETS = ['./', './index.html', './manifest.webmanifest', './favicon.svg', './icons/icon.svg'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS).catch(() => undefined))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? undefined : caches.delete(k))))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for same-origin requests; network falling back
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.origin === location.origin) {
    // SPA navigation requests -> return cached index.html as fallback
    if (req.mode === 'navigate') {
      event.respondWith(
        fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
            return res;
          })
          .catch(async () => (await caches.match('./')) || (await caches.match('./index.html')))
      );
      return;
    }
    // static assets
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            return res;
          })
          .catch(() => cached || Promise.reject('offline'));
        return cached || fetchPromise;
      })
    );
  }
});
