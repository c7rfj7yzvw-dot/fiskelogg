# Fiskelogg Sørøya og Hammerfest

Gratis app (PWA) for iPhone og PC med vær, tidevann, minstepris og leveranser fra fiskemottakene rundt Sørøya og Hammerfest.

**Åpne appen:** https://c7rfj7yzvw-dot.github.io/fiskelogg/

## Installer
- **iPhone:** Åpne lenken i Safari → Del-knappen → «Legg til på Hjem-skjerm» → Legg til. Velg båten din inne i appen.
- **PC:** Åpne lenken i Chrome eller Edge → installer-ikonet i adressefeltet (eller meny → «Installer Fiskelogg»).

Appen virker uten nett med sist hentede data. Knappen Oppdater henter vær fra MET og tidevann fra Kartverket med en gang. Leveranser, minstepris, fartøy, meldinger og AIS-fila kommer fortsatt fra det som er lagt ut, til de bygges på nytt.

## Kilder
Kun åpne data: Råfisklaget (leveranser), Fiskeridirektoratet (fartøy, tillatelser, J-meldinger og nyheter), MET (vær), Kartverket (tidevann), BarentsWatch (åpne data). Dekker bare mottakene rundt Sørøya/Hammerfest. Ingen private data, posisjoner eller nøkler ligger i appen.

Meldingsfanen leser `meldinger.json`. Filen lages av den private kjøringen `lag_meldinger.py` fra Fiskeridirektoratets RSS og listesider. «Bare relevant for meg» er nøkkelord, ikke juridisk veiledning. Kildekoden ligger på byggemaskinen, ikke i denne publiserte mappen.

Dette repoet inneholder bare den ferdigbygde siden. Kilde, bygg og private datafiler hører hjemme på byggemaskinen (`/workspace/fishing`), ikke her.
