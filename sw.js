/* Splits for iPhone: keep the app on the phone so it opens without internet.
   Each version is cached as one set; a new version replaces the old set. */
var CACHE = 'splits-1.4.0';
var FILES = ["./", "index.html", "manifest.webmanifest", "assets/css/statement.css", "assets/css/app.css", "assets/fonts/adventor-bold.woff", "assets/fonts/adventor-regular.woff", "assets/fonts/inter-Bold.woff", "assets/fonts/inter-Medium.woff", "assets/fonts/inter-Regular.woff", "assets/fonts/inter-SemiBold.woff", "assets/js/logic.js", "assets/js/dom.js", "assets/js/statements.js", "assets/js/local.js", "assets/js/phonekit.js", "assets/js/phone-boot.js", "assets/js/app.js", "assets/img/icon-64.png", "assets/img/icon-180.png", "assets/img/icon-192.png", "assets/img/icon-512.png", "assets/img/icon-512-maskable.png"];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('splits-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(req).catch(function () {
        return req.mode === 'navigate' ? c.match('index.html') : Response.error();
      });
    });
  }));
});
