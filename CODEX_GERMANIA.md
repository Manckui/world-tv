# Incarico Codex: ricerca Germania (DE) per World TV

Lavora in `/Users/antoninozichichi/Code/CV-progetti/world-tv-lab-poc`. Leggi prima `AGENTS.md`,
`CONTRIBUTING.md`, `docs/diagnostics/germany-portugal-status.md` e, come modello di metodo,
`docs/diagnostics/france-research-coverage.md`.

La Germania è già registrata nel codice e ha mappa, regioni e candidati: `reports/de-candidates.json`
contiene 180 emittenti. Claude sta eseguendo il test video delle fonti, perché nella tua sandbox Chrome
non si avvia. **Il tuo compito è solo la ricerca, con curl e lettura dell'HTML.**

## 1. Geografia: `reports/de-research-geography.json`

Un oggetto con chiave l'`id` del canale, per ogni emittente di `reports/de-candidates.json` e per
le nuove voci del punto 2:

```json
{ "scope": "national|regional|local|foreign|unknown", "regionCode": "DE-xx" | null, "extraRegions": [],
  "city": "…" | null, "province": "Landkreis o kreisfreie Stadt" | null, "countryCode": "DE",
  "lat": 0 | null, "lon": 0 | null, "coordinateSourceUrl": "…" | null,
  "confidence": "high|medium|low", "sourceUrl": "prova della sede", "notes": "breve, in italiano" }
```

- ARD, ZDF, arte, 3sat, phoenix, KiKA, DW, tagesschau24, ONE, ARD-alpha, ZDFinfo, ZDFneo, i canali
  tematici e lo shopping nazionali sono `national` con `regionCode` null, qualunque sia la sede.
- Le terze reti ARD (BR, HR, MDR, NDR, RBB, SR, SWR, WDR, Radio Bremen) sono `regional`:
  - un'edizione di un Land (es. MDR Sachsen) ha `regionCode` uguale a quel Land;
  - un canale che serve più Länder ha `regionCode` uguale al Land della sede ed `extraRegions` con gli altri.
- TV locali, Offene Kanäle e Bürgerfernsehen sono `local`. Le emittenti estere (SRF, BTL ecc.) sono
  `foreign`, con il loro paese.
- Città solo dall'Impressum o da un registro ufficiale; mai dal nome del canale, mai il capoluogo
  come ripiego. Coordinate = centro del comune da Wikidata P625 o GeoNames, con l'URL della fonte.
  Il pin deve cadere nel poligono del Land (`public/maps/germany.json`): verificalo con d3-geo
  `geoContains`.

## 2. Nuove TV: `reports/de-research-sources.json`

Un array di emittenti tedesche con diretta pubblica ufficiale **mancanti** dai candidati, o con una
fonte ufficiale migliore. Formato:
`{ id, name, website, livePage, categories, streams: [{ url, format: "hls"|"dash"|"embed", page, notes }], status: "candidate_found"|"no_usable_source"|"defunct", notes }`.
Usa gli ID IPTV-org quando esistono, altrimenti `catalog:DE:<slug>`.
Fonti: elenchi delle TV locali delle Landesmedienanstalten (BLM, LFK, SLM, MSA, TLM, mabb, MA HSH,
NLM, LfM, LPR Hessen, LMK, LMS, brema, MMV), Bürgermedien e Offene Kanäle, dirette ufficiali
ARD e ZDF. Controlla con `curl -H "Origin: http://localhost:3000"` che il master risponda 200 con CORS consentito.

## Regole

- Niente restream non ufficiali, URL firmati o temporanei, header falsificati, aggiramento di DRM,
  geoblocco, login o anti-bot. Solo https.
- RTL, ProSieben, Sat.1, VOX, Sky, Pluto TV, RT DE e gli ID in `data/excluded-channels.json` sono fuori ambito.
- Non dichiarare nulla come verificato: i test video li esegue Claude.

## File che puoi modificare

Solo `reports/de-research-geography.json`, `reports/de-research-sources.json`, `scripts/de-research-*.mjs`
e `docs/diagnostics/germany-research-coverage.md`. Puoi riusare gli script `scripts/de-research-*`
già esistenti. Non toccare `data/`, `src/`, gli altri script, i file degli altri paesi né il server su :3000.
Niente commit.

## Consegna

`docs/diagnostics/germany-research-coverage.md`, con:

- fonti usate;
- conteggi per ambito e per Land;
- nuove fonti trovate;
- piste negative;
- lacune.
