import { b as Seksjon, i as Varsel } from "./chunk-4NQAU7TK.js";
import { a as reactFabrik, b as jsxFabrik } from "./chunk-DOIJXE4K.js";
import { c as koble } from "./chunk-5TBO732O.js";

const React = koble(reactFabrik());
const e = koble(jsxFabrik());

const SETT = "fiskelogg.meldinger.sett";
const MND = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

let cache = null;
let feil = null;
const lyttere = new Set();

function lesSett() {
  try {
    return localStorage.getItem(SETT) || "";
  } catch {
    return "";
  }
}

function skrivSett(verdi) {
  try {
    localStorage.setItem(SETT, verdi);
  } catch {
    /* lokal merking er valgfri */
  }
}

function datoLedd(iso) {
  if (!iso) return "";
  const dag = String(iso).slice(0, 10);
  const deler = dag.split("-").map(Number);
  if (deler.length !== 3 || deler.some((n) => !n)) return dag;
  return `${deler[2]}. ${MND[deler[1] - 1]} ${deler[0]}`;
}

function erNy(item, sett) {
  if (!sett || !item.publisert) return false;
  const a = new Date(item.publisert).getTime();
  const b = new Date(sett).getTime();
  return Number.isFinite(a) && Number.isFinite(b) && a > b;
}

function relevante(data) {
  return data ? data.liste.filter((item) => item.relevant) : [];
}

function antallNye(data, sett) {
  return relevante(data).filter((item) => erNy(item, sett)).length;
}

function oppdaterVindu() {
  const sett = lesSett();
  const nye = antallNye(cache, sett);
  window.__fiskeloggMeldingerNy = nye;
  window.__fiskeloggMeldingerUapnet = !sett && !!cache;
  window.__fiskeloggMeldingerTekst = () => {
    if (!cache) return feil ? "fikk ikke hentet" : "";
    const n = relevante(cache).length;
    const ny = antallNye(cache, lesSett());
    if (!lesSett()) return `${n} relevante · ikke åpnet`;
    if (ny > 0) return ny === 1 ? "1 ny siden sist" : `${ny} nye siden sist`;
    return `${n} relevante`;
  };
}

function publiser() {
  oppdaterVindu();
  for (const fn of lyttere) fn();
  window.dispatchEvent(new Event("fiskelogg:meldinger"));
  window.dispatchEvent(new Event("fiskelogg:data"));
}

async function last(frisk) {
  const url = frisk ? `meldinger.json?t=${Date.now()}` : "meldinger.json";
  const svar = await fetch(url, { cache: frisk ? "no-store" : "no-cache" });
  if (!svar.ok) throw new Error(String(svar.status));
  const json = await svar.json();
  if (!json || !Array.isArray(json.liste)) throw new Error("ugyldig fil");
  cache = json;
  feil = null;
  publiser();
}

function startHenting() {
  const sett = window.__fiskeloggHentere || (window.__fiskeloggHentere = new Set());
  const fn = async () => {
    try {
      await last(true);
    } catch (err) {
      feil = err instanceof Error ? err.message : "kunne ikke hente";
      publiser();
    }
  };
  sett.add(fn);
  last(false).catch((err) => {
    feil = err instanceof Error ? err.message : "kunne ikke hente";
    publiser();
  });
}

startHenting();
oppdaterVindu();

function useSnap() {
  const [v, setV] = React.useState(() => ({ data: cache, feil, sett: lesSett() }));
  React.useEffect(() => {
    const fn = () => setV({ data: cache, feil, sett: lesSett() });
    lyttere.add(fn);
    fn();
    return () => lyttere.delete(fn);
  }, []);
  return v;
}

function apneEkstern(hendelse, url) {
  if (window.open(url, "_blank", "noopener,noreferrer")) hendelse.preventDefault();
}

function vises(filter, item) {
  switch (filter) {
    case "relevant":
      return item.relevant === true;
    case "alle":
      return true;
    default: {
      const ukjent = filter;
      throw new Error(`ukjent filter ${ukjent}`);
    }
  }
}

function sortert(liste) {
  return [...liste].sort((a, b) => String(b.publisert || b.dato || "").localeCompare(String(a.publisert || a.dato || "")));
}

function MetaRad({ item }) {
  const deler = [];
  if (item.kode) deler.push(item.kode);
  else deler.push("Nyhet");
  if (item.status) deler.push(item.status);
  if (item.publisert) deler.push(`publisert ${datoLedd(item.publisert)}`);
  else if (item.dato && item.datoType === "mote") deler.push(`møte ${datoLedd(item.dato)}`);
  if (item.gyldigFra) deler.push(`gyldig fra ${datoLedd(item.gyldigFra)}`);
  if (item.gyldigTil) deler.push(`til ${datoLedd(item.gyldigTil)}`);
  return e.jsx("div", { className: "mld-meta", children: deler.join(" · ") });
}

function Kort({ item, sett }) {
  const ny = erNy(item, sett);
  return e.jsxs("article", {
    className: "mld-kort",
    "data-test": "melding",
    "data-relevant": item.relevant ? "ja" : "nei",
    children: [
      e.jsxs("div", { className: "mld-kort-topp", children: [
        e.jsx("span", { className: item.relevant ? "mld-merke treff" : "mld-merke", children: item.relevant ? "Relevant" : "Ikke i utvalget" }),
        ny ? e.jsx("span", { className: "mld-ny", children: "Ny siden sist" }) : null,
      ] }),
      e.jsx("h3", { className: "mld-tittel", children: item.tittel }),
      e.jsx(MetaRad, { item }),
      item.ingress
        ? e.jsx("p", { className: "mld-ingress", children: item.ingress })
        : e.jsx("p", { className: "mld-ingress mangler", children: item.ingressKilde }),
      e.jsx("p", { className: "mld-grunn", children: item.grunn }),
      e.jsx("a", {
        className: "knapp",
        href: item.url,
        target: "_blank",
        rel: "noopener noreferrer",
        onClick: (ev) => apneEkstern(ev, item.url),
        children: "Åpne originalen",
      }),
    ],
  });
}

function Filter({ filter, onFilter, data }) {
  const rel = relevante(data).length;
  const alle = data.liste.length;
  const valg = [
    { id: "relevant", label: `Relevant (${rel})` },
    { id: "alle", label: `Alle (${alle})` },
  ];
  return e.jsx("div", {
    className: "mld-filter",
    role: "group",
    "aria-label": "Filtrer meldinger",
    children: valg.map((v) => e.jsx("button", {
      type: "button",
      className: filter === v.id ? "chip på" : "chip",
      "aria-pressed": filter === v.id,
      "data-test": `filter-${v.id}`,
      onClick: () => onFilter(v.id),
      children: v.label,
    }, v.id)),
  });
}

function Innhold({ data, feilTekst, sett, filter, onFilter, kompakt }) {
  if (!data && feilTekst) {
    return e.jsx(Varsel, { tone: "warning", children: `Kunne ikke laste meldinger (${feilTekst}). Er du frakoblet? Sist hentede fil brukes når den finnes.` });
  }
  if (!data) {
    return e.jsx("div", { className: "liten", children: "Henter meldinger …" });
  }
  const vist = sortert(data.liste.filter((item) => vises(filter, item)));
  const nye = antallNye(data, sett);
  return e.jsxs("div", { className: "mld", "data-test": "meldinger", children: [
    feilTekst ? e.jsx(Varsel, { tone: "warning", children: `Viser forrige uttrekk. Ny henting feilet (${feilTekst}).` }) : null,
    e.jsx(Varsel, { tone: "info", children: data.filterMerknad }),
    !kompakt ? e.jsxs("p", { className: "liten", children: [
      "Uttrekk lest ", datoLedd(data.hentet), ". ",
      data.avgrensning,
    ] }) : e.jsx("p", { className: "liten", children: `Uttrekk lest ${datoLedd(data.hentet)}.` }),
    !kompakt ? e.jsx(Filter, { filter, onFilter, data }) : null,
    !kompakt ? (sett
      ? e.jsx("p", { className: "liten", children: nye === 1
        ? `1 relevant melding er merket ny fordi den er publisert etter sist du forlot denne fanen (${datoLedd(sett)}). Merket lagres bare på denne enheten.`
        : nye > 1
          ? `${nye} relevante meldinger er merket nye fordi de er publisert etter sist du forlot denne fanen (${datoLedd(sett)}). Merket lagres bare på denne enheten.`
          : `Ingen relevante meldinger er publisert etter sist du forlot fanen (${datoLedd(sett)}).` })
      : e.jsx("p", { className: "liten", children: "Du har ikke åpnet Meldinger i appen før. Ingenting er merket «ny» før etter første besøk, slik at ikke hele listen ser ulest ut." })) : null,
    kompakt
      ? (vist[0]
        ? e.jsxs(React.Fragment, { children: [
          e.jsx(Kort, { item: vist[0], sett }),
          e.jsx("button", {
            type: "button",
            className: "knapp primar",
            "data-test": "apne-meldinger",
            onClick: () => {
              window.dispatchEvent(new CustomEvent("fiskelogg:fane", { detail: "meldinger" }));
              window.scrollTo(0, 0);
            },
            children: `Åpne meldinger (${relevante(data).length} relevante)`,
          }),
        ] })
        : e.jsx("p", { className: "liten", children: "Ingen relevante meldinger i uttrekket." }))
      : (vist.length
        ? vist.map((item) => e.jsx(Kort, { item, sett }, item.id))
        : e.jsx("p", { className: "liten", children: "Ingen meldinger i dette filteret." })),
    !kompakt ? e.jsxs("div", { className: "kilder", children: [
      e.jsx("div", { className: "kilder-tittel", children: "Kilder for dette uttrekket" }),
      e.jsx("ul", { children: data.kilder.map((kilde) => e.jsx("li", { children: e.jsxs("a", {
        href: kilde.url,
        target: "_blank",
        rel: "noopener noreferrer",
        onClick: (ev) => apneEkstern(ev, kilde.url),
        children: [kilde.navn, kilde.feedOppdatert ? ` · feed oppdatert ${datoLedd(kilde.feedOppdatert)}` : "", kilde.lest ? ` · lest ${datoLedd(kilde.lest)}` : ""],
      }) }, kilde.url)) }),
      e.jsx("p", { className: "liten", children: "Oppdater-knappen henter meldinger.json på nytt, på samme måte som de andre datafilene. Den henter ikke Fiskeridirektoratet direkte fra telefonen." }),
    ] }) : null,
  ] });
}

function MeldingerFane() {
  const snap = useSnap();
  const [filter, setFilter] = React.useState("relevant");
  React.useEffect(() => () => {
    skrivSett(new Date().toISOString());
    oppdaterVindu();
    window.dispatchEvent(new Event("fiskelogg:meldinger"));
    window.dispatchEvent(new Event("fiskelogg:data"));
  }, []);
  const hentet = snap.data ? datoLedd(snap.data.hentet) : "";
  return e.jsx(Seksjon, {
    heading: "Meldinger fra Fiskeridirektoratet",
    id: "meldinger",
    caption: hentet ? `J-meldinger og reguleringsnyheter. Uttrekk ${hentet}.` : "J-meldinger og reguleringsnyheter.",
    children: e.jsx(Innhold, {
      data: snap.data,
      feilTekst: snap.feil,
      sett: snap.sett,
      filter,
      onFilter: setFilter,
      kompakt: false,
    }),
  });
}

function MeldingerKort() {
  const snap = useSnap();
  return e.jsx(Seksjon, {
    heading: "Meldinger fra Fiskeridirektoratet",
    id: "meldinger-forside",
    caption: "Siste som er merket relevant for torsk og sei i åpen gruppe.",
    children: e.jsx(Innhold, {
      data: snap.data,
      feilTekst: snap.feil,
      sett: snap.sett,
      filter: "relevant",
      onFilter: () => {},
      kompakt: true,
    }),
  });
}

export { MeldingerFane, MeldingerKort };
