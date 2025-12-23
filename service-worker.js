const CACHE_NAME = 'servian-cache-v1'

// Files to precache for app-shell offline support
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/manifest.json'
]

self.addEventListener('install', event => {
  // Precache app shell
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  )
})

self.addEventListener('activate', event => {
  // Remove old caches
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  )
  self.clients.claim()
})

// Fetch handler: serve from cache, fall back to network, and provide
// an offline fallback for navigations when both fail.
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse

      return fetch(event.request).then(networkResponse => {
        // If response invalid, just pass it through
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse
        }

        // Cache a clone of the response for future requests
        const responseClone = networkResponse.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone))
        return networkResponse
      }).catch(() => {
        // If fetch fails (offline), and it's a navigation, serve cached index.html as fallback
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html')
        }
        // For other requests, try to return a cached fallback if available
        return caches.match(event.request)
      })
    })
  )
})
