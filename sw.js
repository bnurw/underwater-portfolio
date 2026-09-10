/* =========================================================
   SERVICE WORKER — Offline cache + fast reload
   ========================================================= */
const CACHE_NAME = 'nur-portfolio-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './js/perf.js',
  './js/sound.js',
  './js/sound-init.js',
  './js/textures.js',
  './js/sky.js',
  './js/ocean.js',
  './js/sunrays.js',
  './js/plankton.js',
  './js/fish.js',
  './js/fishSchool.js',
  './js/reef.js',
  './js/jellyfish.js',
  './js/floor.js',
  './js/shipwreck.js',
  './js/treasure.js',
  './js/anglerfish.js',
  './js/squid.js',
  './js/bottle.js',
  './js/dive.js',
  './js/main.js',
  './assets/favicon.svg'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Skip cross-origin (fonts, three.js CDN) — let them go to network
  if (url.origin !== self.location.origin) return;

  // Cache-first for local assets
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
