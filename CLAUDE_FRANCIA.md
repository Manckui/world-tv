# Incarico parallelo: Francia per World TV

Lavora in `/Users/antoninozichichi/Code/CV-progetti/world-tv-lab-poc`.

L'utente vuole aggiungere televisioni nazionali, regionali e locali, verificarne davvero la riproduzione e posizionarle sulla mappa. **Tu lavori sulla Francia (FR); Codex sta lavorando sulla Spagna (ES) e sull'integrazione condivisa.**

## Coordinamento: evitare conflitti

Leggi `AGENTS.md`, `CLAUDE.md`, `CONTINUA_CON_CLAUDE.md` e `README.md`. La UI approvata è Orbita blu notte e albicocca, React/Next.js/TypeScript/SCSS.

Puoi creare/modificare esclusivamente:

- `data/catalogs/FR.json`
- `data/geography/FR.json`
- `data/alternatives/FR.json`
- `data/regions/FR.json`
- `public/maps/france.json`
- `public/maps/france-credits.txt`
- `scripts/fr-*` e `reports/*FR*`
- `docs/diagnostics/france-*.md`

Codex gestisce tipi, API, registri dei Paesi, componenti, player, runner condiviso, mappe generiche, README e documento generale di passaggio. Non modificare questi file e non ripristinare file cambiati dall'altro agente. Non interrompere il server già attivo sulla porta 3000. Non eseguire operazioni Git distruttive né sovrascrivere report italiani/spagnoli.

Se ti serve una modifica comune, annotala nel tuo rapporto; prepara i dati FR senza bloccare la ricerca.

## Ricerca richiesta

1. Costruisci un inventario ampio di TV nazionali e delle regioni francesi, includendo le regioni d'oltremare. Verifica i nomi e i codici amministrativi attuali con fonti ufficiali.
2. Usa IPTV-org e altri cataloghi pubblici per scoprire candidati, poi verifica sito ufficiale, pagina della diretta, contatti e area servita. Consulta anche ARCOM, France Télévisions e le emittenti locali. Non dichiarare esaustività se alcune aree restano da approfondire.
3. Per ogni canale registra ID stabile, nome, sito/pagina della diretta, URL del flusso, formato, provenienza, ambito nazionale/regionale/locale, regione, dipartimento, città e coordinate documentate.
4. **Sede e copertura sono informazioni diverse.** Un canale nazionale con sede a Parigi resta nazionale. Per le edizioni territoriali usa ID distinti quando hanno dirette differenti. I pin rappresentano la città della sede documentata, non una copertura presunta. Se la città non è verificabile, lascia coordinate nulle: niente pin inventati nel capoluogo.

## Verifica dei flussi

- Usa il player reale del progetto in Chrome, con HLS/DASH e richieste normali dal browser.
- Per dichiarare `verified`: fotogrammi decodificati, dimensioni video valide e tempo in avanzamento per almeno 20 secondi. Un manifest HTTP 200 o un evento `playing` isolato non basta.
- Prova tutte le fonti candidate, annotando data, URL esatto, errori, CORS, blocchi e ambiente di esecuzione. Il luogo del test è quello reale del computer, **non Francia solo perché il canale è francese**. Se non noto, dichiaralo non verificato.
- Se una fonte fallisce, cerca la diretta sul sito ufficiale e ispeziona normalmente il player pubblico. Prova la fonte ufficiale quando è incorporabile e stabile.
- Non aggirare login, DRM, geoblocking, controlli di accesso o restrizioni sugli header. Non conservare URL firmati temporanei come fonti permanenti.
- Per player non incorporabili conserva la pagina ufficiale e spiega il limite nel rapporto; non dichiarare funzionante sul nostro sito una riproduzione riuscita solo sul sito dell'emittente.
- Esiti separati: `verified`, `failed`, `inconclusive`, `skipped`; per ogni area segnala eventuali lacune.

Il runner condiviso è `scripts/test-streams.mjs`; Codex lo sta estendendo oltre IT. Quando pronto:

```sh
npm run test:streams -- --country FR --location "ambiente locale, posizione non verificata" --concurrency 2 --headless --output reports/streams-FR.json
```

Usa massimo due worker mentre Codex prova ES, per non saturare la connessione. Se API/runner FR non sono ancora pronti, prosegui ricerca e prepara i candidati; puoi scrivere uno script `scripts/fr-*` che riusi il player/worker esistenti con catalogo intercettato, senza modificare file condivisi.

## Contratto dei dati

`data/catalogs/FR.json`: canali curati e fonti pubbliche, anche se assenti da IPTV-org.

```json
{
  "version": 1,
  "country": "FR",
  "channels": [
    {
      "id": "ID-REALE.fr",
      "name": "Nome verificato",
      "website": "https://sito-ufficiale.example/direct",
      "categories": ["general"],
      "streams": [
        {
          "url": "https://cdn.example/live.m3u8",
          "format": "hls",
          "page": "https://sito-ufficiale.example/direct",
          "verifiedAt": "DATA-ISO-SOLO-DOPO-TEST-RIUSCITO"
        }
      ]
    }
  ]
}
```

Gli esempi sono strutturali: non inserire valori inventati. Riusa l'ID IPTV-org quando corrisponde davvero; per una nuova emittente usa un ID stabile `catalog:FR:slug`. `format` ammette `hls`, `dash`, `embed`; `verifiedAt` va omesso se non verificato.

`data/geography/FR.json`: schema già esistente di `data/geography/IT.json`, con `version: 1`, `country: "FR"` e `channels` indicizzato dagli stessi ID. Ogni record:

```json
{
  "scope": "regional",
  "regionCode": "FR-CODICE-ISO-VERIFICATO",
  "extraRegions": [],
  "city": null,
  "province": null,
  "countryCode": "FR",
  "lat": null,
  "lon": null,
  "confidence": "medium",
  "sourceUrl": "https://fonte-ufficiale.example",
  "notes": "Distinzione documentata fra area servita e sede; fonti e motivazione."
}
```

`data/alternatives/FR.json`: schema esistente `{ "version": 1, "country": "FR", "alternatives": [...] }`, ciascuna con `channelIds`, `name`, `page`, `url`, `format`, `verifiedAt` solo dopo test. Evita duplicati già presenti nel catalogo curato.

`data/regions/FR.json`:

```json
{
  "version": 1,
  "country": "FR",
  "regions": [
    { "code": "FR-CODICE", "name": "Nome ufficiale", "center": [0, 0] }
  ]
}
```

`center` è `[longitudine, latitudine]`, da geometria reale. `public/maps/france.json` è una GeoJSON FeatureCollection semplificata, una Feature per regione, `properties: { "code": "...", "name": "..." }`. Codici coerenti con i due JSON precedenti. Usa geometrie reali, licenza e attribuzione in `france-credits.txt`. Per d3-geo i contorni esterni devono avere orientamento orario, come le mappe del progetto. Considera le regioni d'oltremare: non spostarle in coordinate false per simulare riquadri.

## Consegna

Completa ricerca, dati e test; non fermarti a una lista di link. Scrivi `docs/diagnostics/france-handoff.md` con:

- file prodotti;
- numero di canali e fonti, esiti verificati/falliti/incerti;
- tabella delle regioni e TV associate, nazionali separati;
- evidenze ufficiali di sede e area di trasmissione;
- lacune geografiche e restrizioni reali;
- comandi ripetibili;
- eventuali adattamenti condivisi da richiedere a Codex.

Non dire “tutte le TV funzionano” se i report non lo dimostrano. Conserva i fallimenti e i casi non risolvibili come evidenza.
