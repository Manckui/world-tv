# Incarico Codex: ricerca Polonia (PL) per World TV

Lavora in `/Users/antoninozichichi/Code/CV-progetti/world-tv-lab-poc`. Leggi prima `AGENTS.md`,
`CONTRIBUTING.md` e, come esempio di risultato atteso, `docs/diagnostics/mexico-research-coverage.md`,
`reports/mx-research-geography.json` e `scripts/mx-research-geography.mjs`.

La Polonia è già registrata nel codice e ha mappa (`public/maps/poland.json`, 16 voivodati con i codici
ISO numerici attuali `PL-02`…`PL-32`), regioni (`data/regions/PL.json`) e candidati
(`reports/pl-candidates.json`, 75 emittenti). Claude esegue i test video, perché nella tua sandbox
Chrome non si avvia. **Il tuo compito è solo la ricerca, con curl e lettura dell'HTML.**

## 1. Geografia: `reports/pl-research-geography.json`

Un oggetto con chiave l'`id` del canale, per ogni emittente di `reports/pl-candidates.json` e per
le nuove voci del punto 2. Il formato è lo stesso del Messico (`regionCode` "PL-xx", `countryCode` "PL",
`coordinateSourceUrl` con l'URL GeoNames con ID o l'entità Wikidata).

- Le reti nazionali sono `national` con `regionCode` null, anche se hanno sede a Varsavia.
- I canali regionali di TVP3 (se presenti) sono `regional`; le TV locali via cavo o TDT
  (es. TV Toruń, TVT Zgorzelec) sono `local`. Entrambi hanno il loro voivodato. Le reti di
  informazione nazionali con sede a Varsavia (es. Telewizja Republika) restano `national`.
- Le emittenti estere sono `foreign`.
- Città solo dalle pagine ufficiali (kontakt, impressum/stopka redakcyjna, registro KRRiT); mai dal
  nome del canale, mai la capitale come ripiego. I pin devono cadere nel poligono del voivodato:
  verificalo con d3-geo `geoContains`.
- Nessuna voce `regional` o `local` può avere `regionCode` null: se il voivodato non è documentabile,
  usa `unknown`.

## 2. Nuove TV: `reports/pl-research-sources.json`

Un array di emittenti polacche con diretta pubblica ufficiale **mancanti** dai candidati, o con una
fonte ufficiale migliore. Il formato è lo stesso del Messico; gli ID nuovi sono `catalog:PL:<slug>`.
Priorità: le **TV locali e regionali di ognuno dei 16 voivodati** (l'elenco delle concessioni locali
è sul sito KRRiT, poi le TV via cavo cittadine e le TV comunali e universitarie) e i canali nazionali
con diretta libera ufficiale. Controlla con `curl -H "Origin: http://localhost:3000"` che il master
risponda 200 con CORS consentito.

## Regole

- Niente restream non ufficiali, URL firmati o temporanei, header falsificati, aggiramento di DRM,
  geoblocco, login o anti-bot. Solo https.
- TVP (diretta su TVP VOD con geoblocco e DRM), Polsat, TVN, Canal+, Pluto TV e gli ID in
  `data/excluded-channels.json` sono fuori ambito, salvo una diretta libera pubblicata dall'emittente
  stessa sul proprio dominio.
- Niente YouTube: l'utente ha deciso di non includerlo per ora.
- Non dichiarare nulla come verificato.

## File che puoi modificare

Solo `reports/pl-research-geography.json`, `reports/pl-research-sources.json`, `scripts/pl-research-*.mjs`
e `docs/diagnostics/poland-research-coverage.md`. Non toccare `data/`, `src/`, gli altri script né il
server su :3000. Niente commit.

## Consegna

`docs/diagnostics/poland-research-coverage.md`, con:

- fonti usate;
- conteggi per ambito e per voivodato;
- nuove fonti;
- piste negative;
- lacune.

Prima di chiudere verifica tu stesso:

- nessuna voce `regional` o `local` senza voivodato;
- ogni pin ha `sourceUrl` e cade dentro il poligono;
- `coordinateSourceUrl` non è un URL di ricerca.
