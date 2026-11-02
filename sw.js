// Fiskelogg service worker: app-skallet caches (cache-first), data hentes nett-først med cache som reserve (frakoblet).
const VERSJON = "20261102114335";
const SKALL = ["./", "index.html", "manifest.webmanifest", "js/app-UFN6G6NZ.js", "js/chunk-D2ZIOSQI.js", "js/main-E2DNU4NW.js", "stil-9d2505cd.css", "ikoner/apple-touch-icon.png", "ikoner/ikon-180.png", "ikoner/ikon-192.png", "ikoner/ikon-512.png", "ikoner/ikon-maskable-512.png", "ikoner/ikon.svg", "data.json", "fartoy.json", "tillatelser.json"];
const CACHE = "fiskelogg-" + VERSJON;
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SKALL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((n) => n.startsWith("fiskelogg-") && n !== CACHE).map((n) => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  const data = u.pathname.endsWith(".json");
  const side = e.request.mode === "navigate";
  if (data || side) {
    e.respondWith(
      fetch(e.request).then((r) => {
        if (r.ok) { const k = r.clone(); caches.open(CACHE).then((c) => c.put(side ? "./" : e.request, k)); }
        return r;
      }).catch(() => caches.match(side ? "./" : e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
    );
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).then((n) => {
    if (n.ok) { const k = n.clone(); caches.open(CACHE).then((c) => c.put(e.request, k)); }
    return n;
  })));
});
