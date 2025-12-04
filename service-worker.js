const CACHE_NAME = 'mathquest-v2';   // UPDATED VERSION
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/game.html',
  '/assets/boy.png',
  '/assets/correct.mp3',
  '/assets/wrong.mp3',
  '/assets/timesup.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      )
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)   // always try network first!
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
