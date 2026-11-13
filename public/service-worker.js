const CACHE_PREFIX = 'school68-shell-'
const CACHE_NAME = `${CACHE_PREFIX}v1`
const scopeUrl = new URL(self.registration.scope)
const offlineUrl = new URL('offline.html', scopeUrl)
const shellUrls = [
  scopeUrl.href,
  offlineUrl.href,
  new URL('manifest.webmanifest', scopeUrl).href,
  new URL('favicon.svg', scopeUrl).href,
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(shellUrls))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const requestUrl = new URL(request.url)
  if (request.method !== 'GET' || requestUrl.origin !== scopeUrl.origin) return
  if (!requestUrl.pathname.startsWith(scopeUrl.pathname)) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () =>
        (await caches.match(scopeUrl.href)) || caches.match(offlineUrl.href),
      ),
    )
    return
  }

  const isBuildAsset = requestUrl.pathname.startsWith(new URL('assets/', scopeUrl).pathname)
    && /\.(?:css|js|mjs|svg|woff2?)$/.test(requestUrl.pathname)
  if (!isBuildAsset || requestUrl.search) return

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone()
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)))
        }
        return response
      })
    }),
  )
})
