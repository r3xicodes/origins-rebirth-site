const CACHE_NAME = 'origins-rebirth-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/about.html',
  '/origins.html',
  '/map.html',
  '/wiki.html',
  '/rule.html',
  '/contact.html',
  '/css/style.css',
  '/js/script.js',
  '/assets/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // ignore non-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        // optionally cache runtime GET requests for same-origin
        if (res && res.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});