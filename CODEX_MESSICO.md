# Incarico Codex: ricerca Messico (MX) per World TV

Lavora in `/Users/antoninozichichi/Code/CV-progetti/world-tv-lab-poc`. Leggi prima `AGENTS.md`,
`CONTRIBUTING.md` e, come esempio di risultato atteso, `docs/diagnostics/germany-research-coverage.md`
e `reports/de-research-geography.json`.

Il Messico è già registrato nel codice e ha mappa (`public/maps/mexico.json`, 32 entità: `MX-AGU`…`MX-ZAC`
e Città del Messico `MX-CMX`), regioni (`data/regions/MX.json`) e candidati (`reports/mx-candidates.json`,
151 emittenti). Claude esegue i test video, perché nella tua sandbox Chrome non si avvia.
**Il tuo compito è solo la ricerca, con curl e lettura dell'HTML.**

## 1. Geografia: `reports/mx-research-geography.json`

Un oggetto con chiave l'`id` del canale, per ogni emittente di `reports/mx-candidates.json` e per
le nuove voci del punto 2:

```json
{ "scope": "national|regional|local|foreign|unknown", "regionCode": "MX-xxx" | null, "extraRegions": [],
  "city": "…" | null, "province": "municipio" | null, "countryCode": "MX",
  "lat": 0 | null, "lon": 0 | null, "coordinateSourceUrl": "https://www.geonames.org/<id> o Wikidata" | null,
  "confidence": "high|medium|low", "sourceUrl": "prova della sede", "notes": "breve, in italiano" }
```

- Le reti nazionali (Canal Once, Canal 22, Canal Catorce/SPR, TV UNAM, Canal del Congreso, Ingenio TV,
  ADN 40 ecc.) sono `national` con `regionCode` null, anche se hanno sede a Città del Messico.
- Le TV pubbliche degli stati (es. Jalisco TV, TV Mexiquense, Canal 44 UdeG, Radio y Televisión de
  Veracruz, Canal 10 Chiapas, Tabasco TV, Telemax Sonora, Canal 28 Chihuahua, Canal 53 UANL…) sono
  `regional` con il loro stato.
- Le TV comunali, universitarie e locali sono `local`. Le emittenti di altri paesi (USA, America Latina)
  sono `foreign`.
- Città solo da pagine ufficiali (contatto, aviso de privacidad, IFT, normativa che crea l'ente);
  mai dal nome del canale, mai la capitale come ripiego. Le coordinate devono cadere nel poligono dello
  stato: verificalo con d3-geo `geoContains`, come in `scripts/de-research-geography.mjs`.
- Nessuna voce `regional` o `local` può avere `regionCode` null: se lo stato non è documentabile,
  usa `unknown`.

## 2. Nuove TV: `reports/mx-research-sources.json`

Un array di emittenti messicane con diretta pubblica ufficiale **mancanti** dai candidati, o con una
fonte ufficiale migliore. Formato:
`{ id, name, website, livePage, categories, streams: [{ url, format: "hls"|"dash"|"embed", page, notes }], status: "candidate_found"|"no_usable_source"|"defunct", notes }`.
Usa gli ID IPTV-org se esistono, altrimenti `catalog:MX:<slug>`.

Priorità: le TV pubbliche di **ognuno dei 32 stati** (Red de Radiodifusoras y Televisoras Educativas
y Culturales de México, sistemi statali di radio e TV), le TV universitarie e Canal del Congreso.
Controlla con `curl -H "Origin: http://localhost:3000"` che il master risponda 200 con CORS consentito.

## Regole

- Niente restream non ufficiali, URL firmati o temporanei, header falsificati, aggiramento di DRM,
  geoblocco, login o anti-bot. Solo https.
- Televisa (Las Estrellas, Canal 5, Nu9ve, Foro TV), TV Azteca, Imagen, Pluto TV, ViX e gli ID in
  `data/excluded-channels.json` sono fuori ambito, salvo una diretta libera pubblicata dall'emittente
  stessa sul proprio dominio.
- Niente YouTube: l'utente ha deciso di non includerlo per ora.
- Non dichiarare nulla come verificato.

## File che puoi modificare

Solo `reports/mx-research-geography.json`, `reports/mx-research-sources.json`, `scripts/mx-research-*.mjs`
e `docs/diagnostics/mexico-research-coverage.md`. Non toccare `data/`, `src/`, gli altri script né il
server su :3000. Niente commit.

## Consegna

`docs/diagnostics/mexico-research-coverage.md`, con:

- fonti usate;
- conteggi per ambito e per stato;
- nuove fonti;
- piste negative;
- lacune.

Prima di chiudere verifica tu stesso:

- nessuna voce `regional` o `local` senza stato;
- ogni pin ha `sourceUrl` e cade dentro il poligono;
- `coordinateSourceUrl` non è un URL di ricerca.
