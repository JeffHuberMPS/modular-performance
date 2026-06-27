// MPS Service Worker — offline support + update notification
const CACHE_VERSION = 'mps-v249';
const STATIC_CACHE  = CACHE_VERSION + '-static';
const FONT_CACHE    = CACHE_VERSION + '-fonts';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/landing.html',
  '/hub.html',
  '/auth.html',
  '/agreement.html',
  '/billing.html',
  '/manifest.json',
  '/firebase-config.js',
  '/stripe-config.js',
  '/billing.js',
  '/shared/styles.css',
  '/shared/firebase.js',
  '/demo-data.js',
  '/shared/auth-guard.js',
  '/shared/components.js',
  '/shared/install-prompt.js',
  '/apps/workout/index.html'
];

// ── Install: cache static assets ───────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Failed to cache:', url, err))
        )
      );
    })
  );
});

// ── Activate: clear old caches ──────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('mps-') && k !== STATIC_CACHE && k !== FONT_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for static, network-first for API ────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin (except Google Fonts + Firebase)
  if (event.request.method !== 'GET') return;

  // Firebase / Stripe / API calls — network only
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('stripe') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Google Fonts — cache first
  if (url.hostname.includes('fonts.google') || url.hostname.includes('fonts.gstatic')) {
    event.respondWith(
      caches.open(FONT_CACHE).then(cache =>
        cache.match(event.request).then(cached =>
          cached || fetch(event.request).then(res => {
            if (res.ok) cache.put(event.request, res.clone());
            return res;
          })
        )
      )
    );
    return;
  }

  // Our own app files (HTML/JS/CSS) — NETWORK FIRST so deploys show up
  // immediately when online; fall back to cache only when offline.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request).then(res => {
        if (res.ok && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(event.request, clone));
        }
        return res;
      }).catch(() =>
        caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
          return undefined;
        })
      )
    );
    return;
  }

  // Any other cross-origin GET — let the browser handle it normally
});

// ── Message: skip waiting on update ────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Notify clients of update ────────────────────────────────────
self.addEventListener('install', () => {
  self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'SW_UPDATE_AVAILABLE' });
    });
  });
});
