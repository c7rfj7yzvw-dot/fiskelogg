// Fiskelogg service worker: app-skallet caches (cache-first), data hentes nett-først med cache som reserve (frakoblet).
// Kartfliser fra Kartverket lagres i egen cache (cache-først) så kartet virker uten nett der du har vært.
const VERSJON = "20261104051727";
const SKALL = ["./", "index.html", "manifest.webmanifest", "js/app-HILCZDJ3.js", "js/chunk-4EMVN7TB.js", "js/chunk-EK7ODJWE.js", "js/leaflet-src-XKIGVAXB.js", "js/main-NC6JYWWC.js", "stil-fd8117d3.css", "ikoner/apple-touch-icon.png", "ikoner/ikon-180.png", "ikoner/ikon-192.png", "ikoner/ikon-512.png", "ikoner/ikon-maskable-512.png", "ikoner/ikon.svg", "data.json", "fartoy.json", "tillatelser.json", "leaflet.css", "kvote/indeks.json"];
const CACHE = "fiskelogg-" + VERSJON;
const DATA = "fiskedata-v1";
const FLISER = "kartfliser-v1";
const MAKS_FLISER = 4000;
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SKALL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((n) => n.startsWith("fiskelogg-") && n !== CACHE).map((n) => caches.delete(n)))).then(() => self.clients.claim()));
});
let lagret = 0;
async function trim() {
  const c = await caches.open(FLISER); const k = await c.keys();
  for (let i = 0; i < k.length - MAKS_FLISER; i++) await c.delete(k[i]);
}
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (u.hostname === "cache.kartverket.no") {
    e.respondWith(caches.open(FLISER).then((c) => c.match(u.href).then((r) => r || fetch(u.href, { mode: "cors", credentials: "omit" }).then((n) => {
      if (n.ok) { c.put(u.href, n.clone()); if (++lagret % 200 === 0) trim(); }
      return n;
    })).catch(() => fetch(e.request))));
    return;
  }
  if (u.origin !== location.origin) return;
  const data = u.pathname.endsWith(".json");
  const side = e.request.mode === "navigate";
  if (data || side) {
    const nokkel = side ? "./" : u.pathname;
    e.respondWith(
      fetch(e.request).then((r) => {
        if (r.ok) { const k = r.clone(); caches.open(side ? CACHE : DATA).then((c) => c.put(nokkel, k)); }
        return r;
      }).catch(() => caches.match(nokkel, { ignoreSearch: true }).then((r) => r || (side ? caches.match("index.html") : caches.match(e.request, { ignoreSearch: true }))).then((r) => r || Response.error()))
    );
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).then((n) => {
    if (n.ok) { const k = n.clone(); caches.open(CACHE).then((c) => c.put(e.request, k)); }
    return n;
  })));
});
