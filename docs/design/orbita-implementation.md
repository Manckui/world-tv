# Nota di aggiornamento — 20 ottobre 2026

La descrizione sotto conserva la prima implementazione. Le successive modifiche
sono documentate in `.impeccable/orbita-surface.md`: Laboratorio rimosso, liste
complete scorrevoli, player compatto, zoom al pin e cambio lingua con bandiera.
Il bridge automatico resta disponibile solo in sviluppo tramite StreamTestHarness.

# Orbita — implementazione

Riferimento corrente: [Figma Orbita — Blu notte e albicocca](https://www.figma.com/design/GrfERAHrkdfDqokEqzyqlw?node-id=26-276). Il mockup rimane documentato in `figma-mockups.md`.

## Responsabilità

- `OrbitaExplorer.tsx`: stato di navigazione, regione, filtri, canale selezionato. Non scarica flussi video.
- `WorldMap.tsx`: geografia SVG e gesti. `d3-geo` gestisce proiezione, clipping e adattamento ai confini; React gestisce gli elementi e gli eventi.
- `ChannelList.tsx`: righe e pulsanti dei preferiti condivisi.
- `PlayerPanel.tsx`: caricamento del player su richiesta, cambio fonte, ritorno alla mappa.
- `useCatalog.ts`: carica solo `/api/channels?country=IT`; rispetta le esclusioni già presenti.
- `useFavorites.ts`: persistenza locale, sincronizzazione fra schede, fallback di sessione quando lo storage è bloccato.
- `orbita-catalog.ts`: ricerca e regola di appartenenza a una regione.
- `Orbita.module.scss`: palette e stile della UI. `globals.scss`: reset essenziale e font.
- `lab/lab.scss`: stile precedente confinato a `.lab-shell`.

Il player HLS/DASH, le API e il registro esistente sono mantenuti. Il nuovo prop `presentation="viewer"` di `TvPlayer` mostra messaggi orientati alla visione; il laboratorio conserva diagnosi e dettagli delle fonti.

## Navigazione

Il globo ruota con il trascinamento; il punto Italia e lo zoom in avanti aprono il Paese. Le regioni si selezionano sia dalla mappa sia dall’elenco. Rotella e pinch cambiano scala, trascinamento sposta la vista locale. Zoom indietro e breadcrumb risalgono la gerarchia. Il player conserva lo stato geografico; chiuderlo smonta video/iframe e interrompe la riproduzione.

Le città con più emittenti condividono un punto; il punto apre la prima TV del gruppo. Tutte le emittenti restano nell’elenco, filtrabile anche per città. I punti hanno coordinate approssimative di sede, non di copertura.

Le viste Italia e regione disegnano anche gli altri Paesi, nella stessa proiezione ma con riempimento scuro `#20334B` e confini `#364C66`. Questo livello è decorativo, non intercetta i gesti e non modifica l'adattamento della mappa all'Italia o alla regione scelta. I pin locali hanno diametro 24 px, fondo scuro, bordo avorio da 2 px e centro albicocca da 12 px; l'area di interazione ha diametro 44 px.

## Dati e risorse

Le mappe sono file locali: `public/maps/world.json` e `italy.json`. La preparazione è ripetibile:

```sh
node scripts/prepare-orbita-maps.mjs /percorso/countries.geojson /percorso/regions.geojson
```

Il comando semplifica i contorni, normalizza l’orientamento per `d3-geo` e genera `src/lib/orbita-regions.ts`. Non richiede credenziali, tile server o servizi cartografici a runtime.

- [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/): confini mondiali 1:50m, pubblico dominio.
- [geojson-italy](https://github.com/guglielmo/geojson-italy): confini regionali derivati da ISTAT, CC BY 4.0. Contorni semplificati per questa UI. Attribuzione accessibile dalla mappa in `public/maps/credits.txt`.
- [D3 proiezioni](https://d3js.org/d3-geo/projection): riferimento tecnico.
- Archivo: file locali in `public/fonts`, licenza OFL inclusa. Le quattro istanze WOFF2 provengono dal font variabile originale Google Fonts, larghezza 100 e pesi 400/500/600/700.
- `public/images/roma.jpg`: fotografia del Colosseo già usata nel mockup, origine `https://images.unsplash.com/photo-1552832230-c0197dd311b5`. Etichettata “Cartolina da Roma”, non è un’anteprima di una trasmissione.

## Differenze intenzionali dal mockup

La mappa è proiettata dai dati invece di usare un SVG statico, per consentire zoom e rotazione reali. Regioni e quantità di canali vengono dal catalogo, non dagli esempi illustrativi Figma. La diretta parte solo su richiesta, senza caricare automaticamente un video all’apertura. I controlli nativi del video gestiscono audio, fullscreen e picture-in-picture ove supportati.

Sono esclusi per questa fase: altri Paesi, account, sincronizzazione cloud dei preferiti ed EPG.

## Verifica finale

Build finale verificata con `npm run build -- --webpack`, lint e TypeScript passati. La build Turbopack predefinita ha incontrato un vincolo ambientale sull'apertura di porte per il compilatore SCSS (`EPERM`); non è stato cambiato il comando standard del progetto.

`npm run test:ui` verifica navigazione desktop/mobile, drag, rotella, pinch, ricerca, preferiti dopo reload, scope regionale/nazionale, errori e cambio fonte, regione vuota, laboratorio e bridge automatico. Sono disponibili screenshot a 1440×960, 390×844 e 320×740 in `.impeccable/review`.

La revisione indipendente ha richiesto tre correzioni di fedeltà: scheda regionale con Play e altri canali, miniatura di Roma nel riepilogo mobile, rimozione di un'etichetta introduttiva generica. Tutte e tre sono state ricontrollate e risolte, con disposizione `ship` limitata a questi punti.

Il precedente test `check-results-ui.mjs` resta dipendente dal catalogo reale e si ferma sull'aspettativa ormai superata che Pluto TV sia presente: era stato escluso il 2026-10-08. Le esclusioni sono state preservate.

### Affinamento della mappa e variante Figma

Dopo l'aggiunta dei Paesi di contesto e dei pin più evidenti sono stati ripetuti con esito positivo lint, TypeScript e `node scripts/check-orbita-ui.mjs`. Le schermate Italia desktop/mobile e Sicilia mobile sono state ricontrollate visivamente. La build indicata sopra riguarda l'implementazione precedente a questo affinamento.

La palette **Blu notte e albicocca** è stata successivamente scelta e applicata al sito: [documentazione e collegamenti](orbita-blue-variant.md). Le variabili cromatiche restano in SCSS, senza aggiungere stato, librerie o un selettore di temi. Lint e test Orbita sono stati ripetuti con esito positivo dopo il cambio colore.
