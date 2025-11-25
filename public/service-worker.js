
const CACHE_NAME = 'chatflow-v2' // Zmena verzie vyčistí starú cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/favicon-128x128.png',
  '/icons/ChatFlowLogo2.png'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell')
        return cache.addAll(urlsToCache)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Skip caching for:
  // 1. API calls
  // 2. WebSocket
  // 3. Hot Module Replacement (Vite dev server)
  // 4. Node modules during development
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('socket.io') ||
    event.request.url.includes('?t=') ||  // Vite HMR timestamp
    event.request.url.includes('/@') ||    // Vite special routes
    event.request.url.includes('/node_modules/.q-cache/') ||
    event.request.url.includes('.hot-update.') // HMR updates
  ) {
    return event.respondWith(fetch(event.request))
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          console.log('[SW] Cache HIT:', url.pathname)
          return response
        }
        
        console.log('[SW] Cache MISS:', url.pathname)
        
        // Clone request
        const fetchRequest = event.request.clone()
        
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }
          
          // Only cache production assets (not dev files)
          const shouldCache = 
            url.pathname.startsWith('/icons/') ||
            url.pathname === '/' ||
            url.pathname === '/index.html' ||
            url.pathname === '/manifest.json' ||
            url.pathname.match(/\.(png|jpg|jpeg|svg|gif|ico|woff|woff2|ttf|eot)$/)
          
          if (shouldCache) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              console.log('[SW] Caching:', url.pathname)
              cache.put(event.request, responseToCache)
            })
          }
          
          return response
        })
      })
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked')
  event.notification.close()
  
  event.waitUntil(
    self.clients.openWindow('/')
  )
})
