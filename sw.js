// Fiskelogg service worker: app-skallet caches (cache-first), data hentes nett-først med cache som reserve (frakoblet).
// Kartfliser fra Kartverket lagres i egen cache (cache-først) så kartet virker uten nett der du har vært.
const VERSJON = "20261123224733";
const SKALL = ["./", "index.html", "manifest.webmanifest", "js/BrowserPerformanceMeasurement-G4GBUWWW.js", "js/app-V7DNSWRO.js", "js/chunk-5TBO732O.js", "js/chunk-CCO7MHDN.js", "js/chunk-DOIJXE4K.js", "js/chunk-FQ5UHEBI.js", "js/chunk-GD4A56OE.js", "js/chunk-NP6ZTJIQ.js", "js/chunk-OYUIUNTR.js", "js/chunk-R52GOSKK.js", "js/chunk-STUEDWO7.js", "js/chunk-X2H3JOCN.js", "js/chunk-X4GI5QOH.js", "js/chunk-YBN2ANKD.js", "js/chunk-YTAQHLG4.js", "js/chunk-ZIMGBMD7.js", "js/dagbok-DLOYETJJ.js", "js/dist-OLAGCSOF.js", "js/faner-PDSMTKTI.js", "js/fangstomr-MXX6RBH5.js", "js/fiskekart-SGV7MGX4.js", "js/fiskinfo-7IUYLJWU.js", "js/klar-FQIHB24N.js", "js/leaflet-src-R2SPRGJ5.js", "js/main-LUVWOLMQ.js", "js/meldinger-YAQWWI2L.js", "js/turkart-HMBUGTMQ.js", "js/vaer-WYKBTBTZ.js", "js/vaerkart-BKJQ4LFX.js", "js/vedlikehold-TCFBBJQ7.js", "stil-a61f94d2.css", "ikoner/apple-touch-icon.png", "ikoner/ikon-180.png", "ikoner/ikon-192.png", "ikoner/ikon-512.png", "ikoner/ikon-maskable-512.png", "ikoner/ikon.svg", "ikoner/logo.svg", "data.json", "fartoy.json", "tillatelser.json", "leaflet.css", "kvote/indeks.json", "meldinger.json"];
const CACHE = "fiskelogg-" + VERSJON;
const DATA = "fiskedata-v1";
const FLISER = "kartfliser-v1";
const MAKS_FLISER = 4000;
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SKALL.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((n) => n.startsWith("fiskelogg-") && n !== CACHE).map((n) => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener("message", (e) => { if (e.data === "skipWaiting") self.skipWaiting(); });
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
  if (side) {
    const nokkel = "./";
    // Nett først, men på sjøen med svak dekning skal appen ikke henge: etter 4 s vises lagret versjon (nettet lagres likevel når det kommer).
    const fraCache = () => caches.match(nokkel, { ignoreSearch: true }).then((r) => r || caches.match("index.html"));
    const nett = fetch(e.request.url, { cache: "no-cache", credentials: "same-origin" }).then((r) => {
      if (r.ok) { const k = r.clone(); caches.open(CACHE).then((c) => c.put(nokkel, k)); }
      return r;
    });
    const treg = new Promise((ok) => setTimeout(ok, 4000)).then(fraCache).then((r) => r || nett);
    e.respondWith(Promise.race([nett, treg]).catch(() => fraCache()).then((r) => r || Response.error()));
    e.waitUntil(nett.catch(() => {}));
    return;
  }
  if (data) {
    const nokkel = u.pathname;
    // Oppdater-knappen (?t=) går nett-først. Ellers: vis cache med en gang og hent fersk i bakgrunnen.
    if (u.searchParams.has("t")) {
      e.respondWith(
        fetch(e.request, { cache: "no-store" }).then((r) => {
          if (r.ok) { const k = r.clone(); caches.open(DATA).then((c) => c.put(nokkel, k)); }
          return r;
        }).catch(() => caches.match(nokkel, { ignoreSearch: true }).then((r) => r || caches.match(e.request, { ignoreSearch: true })).then((r) => r || Response.error()))
      );
      return;
    }
    e.respondWith((async () => {
      const c = await caches.open(DATA);
      const cached = await c.match(nokkel, { ignoreSearch: true });
      const nett = fetch(e.request).then((r) => { if (r.ok) c.put(nokkel, r.clone()); return r; });
      if (cached) { nett.catch(() => {}); return cached; }
      return nett.catch(() => Response.error());
    })());
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).then((n) => {
    if (n.ok) { const k = n.clone(); caches.open(CACHE).then((c) => c.put(e.request, k)); }
    return n;
  })));
});
