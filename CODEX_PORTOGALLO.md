# Incarico Codex: Portogallo (PT) per World TV

Lavora in `/Users/antoninozichichi/Code/CV-progetti/world-tv-lab-poc`. Leggi prima `AGENTS.md`,
`CONTRIBUTING.md` e, come modello di metodo e qualità, `docs/diagnostics/france-handoff.md` e
`docs/diagnostics/france-research-coverage.md`.

Il Portogallo è **già registrato nel codice comune** da Claude: tipi, `src/lib/countries.ts`,
`src/lib/load-map-countries.ts` (mappa `portugal`, crediti `portugal-credits`), liste dei paesi
ammessi del runner e `scripts/check-country-packs.mjs`. Claude sta lavorando alla Germania (DE):
usa come esempio pronto `scripts/de-prepare-map.mjs`, `scripts/de-build-candidates.mjs` e
`scripts/de-build-catalog.mjs`.

## Obiettivo

Un pacchetto PT completo: TV nazionali, regionali (Açores, Madeira) e locali, con dirette
**verificate davvero** e posizionate sulla mappa.

1. **Mappa:** geoBoundaries gbOpen PRT ADM1, cioè 18 distretti più le regioni autonome di Açores e
   Madeira (DG Território, ODbL 1.0):
   `https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/PRT/ADM1/geoBoundaries-PRT-ADM1_simplified.geojson`.
   Script `scripts/pt-prepare-map.mjs`, scritto sul modello di quello DE, che produce
   `public/maps/portugal.json` (codici ISO `PT-01`…`PT-18`, `PT-20` Açores, `PT-30` Madeira) e
   `data/regions/PT.json`. Le isole restano nella posizione reale. Scrivi anche
   `public/maps/portugal-credits.txt`, con fonte, licenza e modifiche.
2. **Candidati:** IPTV-org (API e `countries/pt.m3u`) e Free-TV Portugal, con
   `scripts/pt-build-candidates.mjs`. Scarta restream non ufficiali, server su IP nudo, URL che
   richiedono header, Pluto TV e le copie non ufficiali di SIC, TVI e CMTV quando i gruppi non
   pubblicano una diretta libera.
3. **Ricerca ufficiale:** RTP (RTP1, RTP2, RTP3, RTP Memória, RTP Açores, RTP Madeira, RTP África,
   RTP Internacional: verifica le dirette pubbliche su rtp.pt/play), Canal Parlamento, Porto Canal,
   TV regionali e locali, web TV dei comuni, canali religiosi e tematici. Fonti: siti delle
   emittenti, ERC (Entidade Reguladora para a Comunicação Social), Wikipedia PT. Ispeziona i player
   pubblici in Chrome tramite le richieste di rete. Salva i risultati in `reports/pt-research-sources.json`.
4. **Geografia:** `reports/pt-research-geography.json`, con distretto e città della sede documentata
   (ficha técnica o estatuto editorial, contatti). Coordinate del centro del comune solo se la sede è
   documentata, con la fonte delle coordinate. RTP e le TV nazionali sono `national` con
   `regionCode: null`. RTP Açores e RTP Madeira sono `regional`.
5. **Test reale:** `node scripts/pt-build-catalog.mjs --stage`, poi
   `npm run test:streams -- --country PT --location "ambiente locale, posizione non verificata" --concurrency 2 --headless --output reports/streams-PT.json`,
   poi di nuovo `node scripts/pt-build-catalog.mjs` per tenere solo le fonti `verified`.
   Il server è già attivo su `http://localhost:3000`: usalo, non arrestarlo e non riavviarlo.
6. Esegui `node scripts/check-country-packs.mjs PT` e correggi gli errori dei dati.

## Regole

- Niente URL firmati o temporanei, header falsificati, aggiramento di DRM, geoblocco, login o
  anti-bot. Niente fonti `http:`.
- `verifiedAt` solo dopo un test riuscito del runner: fotogrammi decodificati, dimensioni valide e
  20 secondi di avanzamento. Gli embed non misurabili restano da verificare.
- Sede e copertura sono cose diverse. Niente città dedotte dal nome del canale e niente capoluogo
  come ripiego: in assenza di prova, city, lat e lon sono `null`.
- Non reinserire gli ID presenti in `data/excluded-channels.json`.

## File che puoi modificare

`data/catalogs/PT.json`, `data/geography/PT.json`, `data/alternatives/PT.json`, `data/regions/PT.json`,
`public/maps/portugal.json`, `public/maps/portugal-credits.txt`, `scripts/pt-*`, `reports/*PT*`,
`reports/pt-*`, `docs/diagnostics/portugal-*.md`.

**Non toccare** `src/`, i file di altri paesi, gli script condivisi, `package.json`, Git e il server.
Se serve una modifica al codice comune, scrivila nel rapporto. Niente commit e niente deploy.

## Consegna

Scrivi `docs/diagnostics/portugal-handoff.md` con:

- metodo e fonti usate;
- conteggi per ambito (nazionale, regionale, locale) e per distretto;
- esiti del test;
- canali esclusi e motivo;
- lacune;
- esito di `check-country-packs`.
