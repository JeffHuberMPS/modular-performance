// MPS Service Worker — offline support + update notification
const CACHE_VERSION = 'mps-v10';
const STATIC_CACHE  = CACHE_VERSION + '-static';
const FONT_CACHE    = CACHE_VERSION + '-fonts';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/landing.html',
  '/hub.html',
  '/auth.html',
  '/billing.html',
  '/manifest.json',
  '/firebase-config.js',
  '/stripe-config.js',
  '/auth.js',
  '/billing.js',
  '/shared/styles.css',
  '/shared/firebase.js',
  '/shared/auth-guard.js',
  '/shared/components.js',
  '/apps/workout/index.html',
  '/apps/workout/workout.css',
  '/apps/workout/workout.js'
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

  // Static assets — cache first, fall back to network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res.ok && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => {
        // Offline fallback for HTML pages
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
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
