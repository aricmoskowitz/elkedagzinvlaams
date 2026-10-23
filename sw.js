/* Elke Dag Zin service worker. build.py fills in the version, so every release gets a new cache.
   Cache-first for the app shell; Google Fonts are cached when they load (optional, the
   system fallbacks look fine offline). A new version waits until the page says "herlaad". */
const CACHE = 'edz-8b2fd918f6';
const FONTS = 'edz-fonts';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon180.png', 'icon192.png', 'icon512.png', 'icon512-maskable.png', 'woordenboek.json'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, {cache: 'reload'})))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('index.html', {cacheName: CACHE}).then(hit => hit || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req, {cacheName: CACHE, ignoreSearch: true}).then(hit => hit || fetch(req)));
});
