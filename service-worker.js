// service-worker.js
const CACHE_NAME = 'mathquest-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/assets/boy.png',
  '/assets/correct.mp3',
  '/assets/wrong.mp3',
  '/assets/timesup.mp3'
];

// Install event: cache all files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch event: serve cached files when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
