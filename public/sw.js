self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()))
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http') || e.request.headers.has('range')) return
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const c = r.clone(); caches.open('v1').then((x) => x.put(e.request, c)).catch(() => {}) } return r }).catch(() => caches.match(e.request)))
})
// Tapping a prayer notification brings the app to the front
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((l) => (l.length ? l[0].focus() : clients.openWindow('/'))))
})
