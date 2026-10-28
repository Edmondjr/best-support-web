// Best Support : service worker (cache hors ligne + clic sur notification)
var CACHE = 'bestsupport-v0.3';
var SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './fonts/plus-jakarta-sans-latin-400-normal.woff2', './fonts/plus-jakarta-sans-latin-600-normal.woff2', './fonts/plus-jakarta-sans-latin-700-normal.woff2', './fonts/plus-jakarta-sans-latin-800-normal.woff2'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(function (hit) {
    var net = fetch(e.request).then(function (res) {
      if (res && res.ok && new URL(e.request.url).origin === location.origin) {
        var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return res;
    }).catch(function () { return hit || caches.match('./index.html'); });
    return hit || net;
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) { if ('focus' in list[i]) return list[i].focus(); }
    return self.clients.openWindow('./');
  }));
});
