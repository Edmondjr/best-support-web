// Best Support : service worker
// Réseau d'abord (toujours la dernière version si internet), copie locale si hors ligne.
var CACHE = 'bestsupport-v0.9';
var SHELL = ['./', './index.html', './sb.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png',
  './fonts/plus-jakarta-sans-latin-400-normal.woff2', './fonts/plus-jakarta-sans-latin-600-normal.woff2', './fonts/plus-jakarta-sans-latin-700-normal.woff2', './fonts/plus-jakarta-sans-latin-800-normal.woff2'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return; // Google, Supabase : jamais mis en cache
  if (url.pathname.indexOf('/downloads/') === 0 || url.pathname === '/version.json') return;
  var isFont = url.pathname.indexOf('/fonts/') === 0 || /\.(png|woff2)$/.test(url.pathname);
  if (isFont) {
    e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req).then(function (res) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); return res; }); }));
    return;
  }
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) { return hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()); });
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) { if ('focus' in list[i]) return list[i].focus(); }
    return self.clients.openWindow('./');
  }));
});
