const CACHE_NAME = "app-cache-v1";
const BASE_PATH = "/recepty"; // 👈 tvoje složka

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Základní fetch handler
  event.respondWith(fetch(event.request));
});
