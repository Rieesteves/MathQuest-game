const CACHE_NAME = "mathquest-v3";

// IMPORTANT: Do NOT use leading "/" — Netlify breaks offline if you do.
const urlsToCache = [
  "index.html",
  "style.css",
  "script.js",
  "manifest.json",

  // assets
  "assets/boy.png",
  "assets/correct.mp3",
  "assets/wrong.mp3",
  "assets/timesup.mp3",

  // app icons
  "assets/icon-192.png",
  "assets/icon-512.png",
];

// Install → Precache everything
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate → Clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

// Fetch → Offline-first fallback
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return (
        cached ||
        fetch(event.request).then(response => {
          // dynamic caching
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
      );
    })
  );
});
