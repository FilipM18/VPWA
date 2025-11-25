// Service Worker Registration Boot File
import { boot } from 'quasar/wrappers'

export default boot(() => {
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('[Boot] Service Worker registered:', registration.scope)
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            console.log('[Boot] Service Worker update found')
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[Boot] New Service Worker available, please refresh')
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('[Boot] Service Worker registration failed:', error)
        })
    })
  } else {
    console.warn('[Boot] Service Worker not supported')
  }
})
