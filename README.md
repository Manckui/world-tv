# World TV — Orbita

Un globo per scoprire le televisioni, a partire da Italia e Spagna. Interfaccia Orbita desktop/mobile in italiano e inglese, regioni, ricerca, preferiti e player. La Francia è in preparazione; gli altri Paesi verranno aggiunti uno alla volta.

## Avvio

Next.js 16 richiede Node.js >=20.9.0. Il file `.nvmrc` seleziona Node 22.22.0, già verificato per questo progetto. Nel terminale di VS Code, seleziona Node prima di eseguire npm:

```bash
nvm use
npm install
npm run dev
```

Se la versione non è installata, esegui `nvm install` e poi `nvm use`. Controlla con `node -v` e `npm -v`: Node 22.22.0 e npm 10.9.4 sono compatibili. Se `nvm` non è disponibile nel terminale, caricalo con `source "$HOME/.nvm/nvm.sh"`.

Il messaggio `npm notice New major version of npm available` è informativo e non blocca l'avvio: aggiornare npm globalmente non è necessario per risolvere l'errore di Node 18.

Apri [http://localhost:3000](http://localhost:3000).

## Cosa include

- Next.js 16, React 19, TypeScript e SCSS Modules (senza Tailwind)
- globo SVG con `d3-geo`: trascinamento, zoom con rotella/pinch/pulsanti, paesi e regioni
- lingua Italiano / English nell'intestazione, paese in una barra separata sopra la mappa
- elenco dei canali nazionali separato dalle TV del territorio
- preferiti persistenti nel browser e stati di caricamento, errore e assenza di canali
- API interna `GET /api/channels?country=IT`
- join server-side fra `channels.json` e `streams.json` di IPTV-org
- pacchetti locali per i nuovi paesi: catalogo, regioni, geografia e fonti documentate
- ricerca, lista TV e pulsante casuale
- player HLS con `hls.js` e supporto HLS nativo di Safari
- registro automatico locale dei tentativi, errori e fonti provate, con esportazione JSON/CSV
- messaggi per stream geobloccati o che richiedono header particolari

## Limiti intenzionali

Non contiene database, account o EPG. Gli URL IPTV possono cambiare; alcuni stream possono fallire per geoblocking, CORS, DRM, header richiesti o perché offline. Il progetto non deve aggirare queste restrizioni. I punti geografici indicano sedi associate alle emittenti, non copertura.

Il prompt aggiornato per proseguire lo sviluppo è in [`CONTINUA_CON_CLAUDE.md`](CONTINUA_CON_CLAUDE.md). I dettagli della UI sono in [`docs/design/orbita-implementation.md`](docs/design/orbita-implementation.md).

Per contribuire con un paese, una regione o una sola TV, leggi
[`CONTRIBUTING.md`](CONTRIBUTING.md). Stato della Spagna e limiti dei test:
[`spain-handoff.md`](docs/diagnostics/spain-handoff.md). Lingue e selettori:
[`languages.md`](docs/design/languages.md).

## Pagine e controlli

- `/`: interfaccia Orbita.
- `/?stream-test=1`: supporto ai test automatici, disponibile solo in sviluppo. Nessuna interfaccia Laboratorio.
- `npm run build` e `npm run lint`: controlli di produzione e codice.
- `node scripts/check-orbita-ui.mjs`: regressione browser con Chrome, server avviato sulla porta 3000. Verifica anche una diretta simulata non disponibile; non certifica gli stream reali.
- `node scripts/check-languages-ui.mjs`: lingua indipendente dal paese, persistenza, ricerca, player e layout desktop/mobile con fonti simulate.

## Test Italia con fonti alternative

Il POC apre l’Italia e unisce:

- API IPTV-org: https://iptv-org.github.io/api
- Lista italiana IPTV-org: https://iptv-org.github.io/iptv/countries/it.m3u
- Free-TV/IPTV: https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_italy.m3u8
- IPTV-Italia/Tundrak: https://raw.githubusercontent.com/Tundrak/IPTV-Italia/main/iptvitaplus.m3u
- HLS pubblicato nel player ufficiale TV2000: https://www.tv2000.it/stream/?media=tv2000_live

Sono mostrati solo canali con almeno un URL di stream che non richieda esplicitamente di simulare un altro player. Le pagine web/YouTube da sole non aggiungono un canale. I metadati NSFW restano esclusi. Nel test italiano un’indicazione di chiusura nel dataset non scarta un canale quando viene trovato un URL: Sky TG24, ad esempio, ha metadati di chiusura obsoleti e una diretta sul sito ufficiale. Le emittenti e gli URL non identificati nel dataset sono candidati da verificare, non canali dichiarati funzionanti.

Gli URL identici vengono uniti mantenendo tutti i cataloghi di provenienza. URL differenti restano disponibili. La presenza in due cataloghi non garantisce due CDN indipendenti: si possono trovare URL dello stesso servizio con parametri/token differenti. I download dei cataloghi sono memorizzati nel processo server per un’ora; un download fallito non annulla i cataloghi riusciti e viene segnalato nell’interfaccia. I byte degli stream vengono richiesti direttamente dal browser, senza proxy.

Per verificare le fonti usa `npm run test:streams` con il server di sviluppo attivo. I report vengono salvati in `reports/`.

L’evento `playing` verifica l’avvio; non dimostra continuità, identità visiva del canale, autorizzazione all’incorporamento o disponibilità dall’estero. `hls.js` gestisce HLS; `dash.js` viene caricato solo per gli URL `.mpd`. Le opzioni di header dei lettori desktop non vengono imitate: il browser fa richieste normali. Le voci con `forceUserAgent` restano nel registro delle fonti ma sono dichiarate incompatibili senza richiederle. Contenuti DRM vengono fermati e segnalati.

I risultati manuali e le preferenze sono in localStorage (`world-tv-lab:tests:v1`). Nessun database è stato aggiunto. Le edizioni geografiche di Rai Italia sono accorpate in un solo canale, mantenendo gli URL alternativi.

## Test automatico nel browser

Richiede Google Chrome installato. `playwright-core` è una dipendenza di sviluppo; usa Chrome con un profilo temporaneo separato dal tuo browser e non modifica i tuoi test manuali. Non servono un agente AI o download di Chromium.

Nel primo terminale:

```bash
nvm use
npm install
npm run dev
```

Lascia il server acceso. Nel secondo terminale, nella stessa cartella:

```bash
nvm use
npm run test:streams -- --country IT --location "Italia" --concurrency 3
```

Si apre Chrome e viene provato ogni URL di ogni canale italiano con il player HLS/DASH del sito, fino a tre fonti contemporaneamente. Ogni worker ha un contesto browser separato: log, localStorage, cookie e diagnosi non si mescolano. Il cambio automatico delle fonti è disattivato in queste sessioni; l'audio è disattivato per consentire l'avvio automatico senza clic. URL identici dello stesso canale vengono provati una sola volta e conservano tutti i cataloghi di provenienza.

I report sono scritti dopo ogni tentativo in `reports/streams-IT.json` e `reports/streams-IT.csv`. Le scritture sono serializzate e atomiche per impedire che risultati completati insieme si sovrascrivano. Lascia aperti entrambi i terminali e Chrome, e impedisci al computer di andare in stop. Il test completo può richiedere ore. `Ctrl+C` nel secondo terminale salva tutte le prove in corso e interrompe; rilanciando lo stesso comando vengono saltati i tentativi automatici conclusi e riprovati quelli interrotti. Anche i report della precedente versione sequenziale sono ripresi senza modificare i tentativi conclusi. I 45 tentativi del JSON manuale non sono saltati: l'evento `playing` manuale non equivale alla misura automatica di continuità.

Per una prima prova breve di cinque **fonti**, puoi aggiungere `--limit 5` allo stesso comando; il limite è totale per tutti i worker. Poi toglilo per continuare nel medesimo report. `--concurrency` accetta interi da 1 a 4, con predefinito 3; usa `--concurrency 1` se connessione o Mac faticano a gestire più dirette. Il parallelismo può ridurre i tempi, ma aumenta banda e uso del computer: non garantisce una velocità tripla. Se Next usa la porta 3001, aggiungi `--base-url http://localhost:3001`. `npm run test:streams -- --help` elenca le opzioni, incluse `--channel Rai1.it`, `--headless`, `--output reports/italia.json` e `--fresh` (crea un nuovo file con data, conservando il precedente).

Il luogo è dichiarato da te e non cambia IP o geolocalizzazione. La ripresa richiede lo stesso luogo, origine, browser, modalità finestra, tempi e filtro canale; una nuova rete/posizione richiede un nuovo report con `--fresh` o un altro `--output`. Il numero di prove contemporanee può cambiare alla ripresa: viene registrato nelle sessioni (`run.sessions`) e nei nuovi tentativi (`automation.concurrency`, `worker`, `sessionId`), mantenendo distinguibili i risultati precedenti. Non abbrevia la finestra di osservazione.

Il JSON mantiene `version: 1`, `exportedAt` e `tests` compatibili con i tentativi manuali. Aggiunge `run` (configurazione, cataloghi, coda e contatori) e `automation` in ogni tentativo:

- `verified`: evento `playing`, dimensioni video, fotogrammi decodificati e tempo video che avanza nella finestra di osservazione. Per impostazione predefinita: massimo 20 secondi per iniziare, poi almeno 20 secondi di osservazione, avanzamento minimo del 65% della finestra e nessun intervallo osservato fra progressi superiore a 5 secondi.
- `failed`: errore definitivo del player, con diagnosi, eventuale codice HTTP e URL della risorsa. HTTP 403 non dimostra da solo geoblocking; 404 non dimostra che l'intero canale sia offline.
- `inconclusive`: nessun progresso entro il tempo di avvio, oppure video avviato ma fermo/intermittente. Non viene dichiarato funzionante né offline.
- `skipped`: fonte che richiede di simulare un altro player, oppure formato esterno non incorporabile. Nessuna richiesta a quello stream.
- `interrupted`: interruzione manuale o problema del browser; `complete: false` fa riprovare la fonte alla ripresa.

Sono registrati anche durata osservata, avanzamento, fotogrammi, errori delle richieste, risposte HTTP di manifest/errori e console del browser (massimo 100 voci per lista, con contatore di voci omesse). Un errore infrastrutturale del browser interrompe il run invece di dichiarare offline tutte le TV. Un evento `playing` senza progresso non produce `outcome: playing` nel report automatico. Il successo non dimostra identità visiva, audio, diritti di incorporamento, continuità futura o disponibilità dall'estero. Il runner non promuove automaticamente fonti alternative e non tenta bypass.

Al termine condividi il JSON per confrontare gli errori delle varie fonti. In questa fase il comando accetta soltanto `--country IT`; `--location` indica il luogo reale da cui fai il test.

## Esiti automatici nella lista

### Ripasso mirato con osservazione più lunga

Dopo il primo giro, con `npm run dev` attivo, esegui in un altro terminale:

```bash
npm run test:streams -- --country IT --location "Italia" --recheck uncertain --startup 30 --observe 60 --concurrency 3
```

Seleziona i canali **Da verificare** dal report principale e riprova tutte le loro fonti attuali. Include anche le nuove fonti ufficiali marcate da verificare. Concede fino a 30 secondi per l’avvio e osserva il video per 60 secondi dopo il primo avanzamento decodificato; uno stream con errore definitivo termina prima. La scadenza di osservazione decorre dall’avvio osservato, così il tempo iniziale di attesa non la accorcia.

Per escludere le verifiche manuali riuscite e le rimozioni locali, esporta **JSON** dal registro senza filtri e aggiungi `--manual-results "/percorso/del/file.json"`. Senza questo file lo script conosce solo gli esiti automatici, perché usa browser isolati. Il JSON esportato ora include anche gli ID delle emittenti eliminate localmente. Una conferma manuale resta valida anche se arrivano nuovi esiti automatici o errori del player.

I risultati sono in `reports/streams-IT-recheck.json` e `.csv`. Il primo report resta conservato. La pagina legge anche questo secondo file, mostra l’avanzamento del ripasso e applica l’esito più recente per ID canale/URL. Lo stesso comando riprende dopo **Ctrl+C**, senza ripetere le fonti concluse e mantenendo la selezione iniziale. `--fresh` crea un ulteriore file datato; i file con nomi personalizzati/datati non sono caricati automaticamente nella lista.

`GET /api/test-results?country=IT` legge il file locale `reports/streams-IT.json` e restituisce un riepilogo leggero, senza eventi o modifiche al report. La pagina lo carica automaticamente e lo unisce in memoria ai tentativi di questo browser, usando l’ultimo esito per canale/URL. Non copia il report in localStorage. Le sessioni dello script non caricano questo riepilogo nei propri esiti.

Ogni emittente mostra **SUCCESSO** se almeno una fonte ha una riproduzione verificata, oppure **ERRORE** se tutte le fonti utilizzabili sono fallite. Gli URL che richiedono simulazione di un altro player non impediscono la classificazione delle altre fonti. **DA VERIFICARE** distingue gli esiti inconcludenti; **TEST PARZIALE**, **DA TESTARE** e **NON TESTABILE** distinguono copertura incompleta e fonti saltate. Le etichette restano visibili anche su mobile e sono filtrabili. Il successo automatico misura la finestra osservata; quello manuale indica l’avvio.

Il dettaglio “Esiti delle fonti” conserva l’ultima diagnosi automatica anche quando selezionare il canale avvia una nuova prova manuale. Il registro sotto resta quello locale del browser e il suo azzeramento non cancella il report automatico. Un report assente lascia utilizzabili i test manuali; un errore di lettura è mostrato esplicitamente. I risultati sono relativi al luogo dichiarato nel report e non garantiscono disponibilità per altri utenti o reti.

Aprire manualmente un canale **ERRORE** o **DA VERIFICARE** lo sposta nella coda **In verifica** e seleziona quel filtro. Il canale resta nella coda anche quando il player cambia esito; l’etichetta riporta anche il risultato corrente. La coda viene salvata separatamente in localStorage e sopravvive al ricaricamento. La revisione termina con **Conferma successo**, che sposta il canale in Successo, oppure con **Elimina**, che lo nasconde dalla lista; non esiste un pulsante per concluderla con un esito intermedio. I test automatici non aggiungono canali alla coda.

**Conferma successo** è disponibile quando esiste un tentativo della fonte selezionata: premilo soltanto dopo aver visto il video funzionare, preferibilmente per almeno 60 secondi. Registra `confirmedAt` sul tentativo esistente, conservando URL, eventi ed errori; chiude il player, rimuove la revisione e apre il filtro **Successo**. Il registro distingue la conferma manuale dalla sola rilevazione del browser. JSON e CSV includono la data della conferma. La decisione manuale mantiene il canale in **Successo** anche dopo nuove prove, aggiornamenti del catalogo e ricaricamenti. Gli errori successivi restano nel registro senza cancellare la conferma. Azzerare il registro locale cancella anche queste conferme.

Per DMAX è escluso l’URL Amagi/Samsung non funzionante richiesto durante la revisione; la fonte Aurora di Free-TV resta disponibile. Il player pubblicato su `https://canaledieci.it/diretta/` usa l’URL Newradio. Le tre voci “Canale Dieci”, “Canale 10” e “Canale 10 (540p) [Not 24/7]” sono unite sotto `CanaleDieci.it`: il metadata del catalogo collega anche il vecchio URL alla stessa emittente e al suo sito ufficiale. Il nuovo stream Newradio è la prima fonte; il precedente indirizzo IP resta come alternativa con la provenienza originale. Le vecchie registrazioni conservano i loro ID e non vengono riscritte; i risultati delle vecchie voci sono riconosciuti anche dal canale unificato, senza riscrivere i documenti originali.

**Elimina** accanto a un’emittente la nasconde dall’elenco e dai contatori di questo browser, anche dopo il ricaricamento. Rimuove la sua eventuale verifica e chiude il player se attivo, conservando la cronologia. **Ripristina canali eliminati** annulla queste rimozioni locali. Il catalogo server e il report automatico restano completi; le rimozioni locali non modificano la coda dello script.

I filtri avanzati sono in **Opzioni dei test**, chiuso all’avvio. Il cambio automatico di fonte è disattivato per impostazione iniziale, così ogni prova manuale riguarda l’URL scelto. Si può riattivare dalla stessa sezione. Antenna Tre ha una sola voce: il player ufficiale pubblica la nuova fonte principale, conservando il vecchio URL come alternativa. La nuova fonte resta **Da verificare** in assenza di un test su quell’URL nel registro/report caricato; le prove diagnostiche separate non vengono trasformate in successi dell’utente.

FM TV Marche usa come prima fonte l’HLS pubblicato su `https://www.fmtv.live/streaming/`, `https://direct.intvstream.net:3737/live/fmtvlive.m3u8`; conserva la fonte precedente come alternativa. La richiesta del manifest ha restituito HTTP 200: questo controllo non verifica la riproduzione del video. La nuova fonte è marcata da verificare.

Videolina usa ora come prima fonte nelle tre voci esistenti l’iframe Dailymotion pubblicato su `https://www.videolina.it/live`. Il formato `embed` mantiene il player ufficiale e le sue limitazioni. Il vecchio HLS HTTP rimane come alternativa. Il registro indica `official-embed` e una prova manuale richiesta: nessun evento `playing` viene inventato al caricamento dell’iframe, nessun timeout HLS di 30 secondi viene applicato. Dopo aver visto il video funzionare, **Conferma successo** conserva la decisione anche alla chiusura del player. Il runner automatico salta gli embed con un motivo esplicito e lascia il canale Da verificare se manca una fonte verificata o una conferma manuale.

Pluto TV è una sola voce Da verificare con il portale ufficiale `https://pluto.tv/it/watch/live-tv/` incorporato. Le voci tematiche Pluto e le fonti Pluto vengono rimosse dalla lista; le emittenti con altre fonti restano. Il portale consente di scegliere la diretta, non è una playlist HLS unica. Il caricamento del portale è stato osservato in Chrome da localhost, ma non attesta la riproduzione. Il runner lo salta come gli altri embed; la conferma manuale riguarda il portale e non tutti i suoi canali. I vecchi risultati restano nei report e nel registro, senza attribuirli alla nuova voce.

Quando una voce in Errore ha lo stesso nome di un’emittente in Successo nello stesso Paese, viene eliminata dalla lista usando le rimozioni locali già disponibili. Il confronto ignora annotazioni di qualità e geoblocking, senza ricerche approssimative sui nomi. Valgono sia i risultati automatici sia le conferme manuali; le voci Da verificare restano. I tentativi originali rimangono nel registro e nei report. Il runner continua a ricevere il catalogo completo per misurare le singole fonti; un export manuale include le rimozioni per escluderle dal successivo giro `--recheck uncertain --manual-results`.

Telejato ha come prima fonte l’HLS pubblicato nella home ufficiale: `https://648026e87a75e.streamlock.net/telejato/telejato/playlist.m3u8`. Il 17/09/2026 è stato osservato un manifest HLS HTTP 200 con `Access-Control-Allow-Origin: *` usando Origin localhost. La riproduzione video di questa nuova fonte resta da verificare: i vecchi stream liberotratto rimangono come alternative e i loro errori non vengono cancellati. La ricerca successiva sui player ufficiali ha esaminato 148 voci inizialmente in errore: 40 hanno ricevuto una fonte ufficiale da verificare (Telejato inclusa), 108 conservano l’errore. Sono 36 playlist HLS con manifest HTTP 200 e CORS compatibile con localhost e 4 embed ufficiali: TCI, Telegranducato, Video Touring e Sardegna 1. I controlli brevi in Chrome hanno osservato avanzamento video nei quattro embed; non valgono come conferma nel registro utente né come garanzia di continuità. Il report `reports/official-players-errors-IT.json` conserva pagine controllate, candidati e motivi delle decisioni; `official-players-browser-IT.json` e `official-players-browser-extra-IT.json` documentano le prove browser. URL temporanei firmati, fonti DRM e player di emittenti diverse non sono importati. Le nuove fonti sono le prime della lista; se nel browser era stata scelta un’altra fonte principale, usa **Ripristina ordine originale** nel player per provare il nuovo URL.

## Verifica tecnica

La ricerca TVdream del 17 settembre riguarda soltanto le 13 voci **Da verificare** dei report automatici dopo il ripasso (9 emittenti). Il riepilogo è in `reports/tvdream-uncertain-IT.json`; le decisioni presenti soltanto nel localStorage dell’utente non sono leggibili da questa ricerca. Le cinque nuove playlist con manifest valido sono associate in `src/lib/catalog/tvdream-alternatives.ts` agli ID già presenti: Super TV Oristano, Teleregione Color, TeleVenezia, le due voci Trentino TV e TV9 Telemaremma (playlist pubblicata nella pagina ufficiale indicata dall’utente). Sono prime fonti, conservano URL precedenti e provenienza delle pagine e restano da verificare finché non ricevono un esito nel registro/report della lista. Non aggiungono nuove emittenti. L’alternativa Mediterranea TV restituisce 404 ed è registrata nel riepilogo senza essere importata.

Il controllo reale in Chrome può essere ripetuto con `node scripts/probe-tvdream-alternatives.mjs --country IT --location "Italia" --startup 20 --observe 20 --concurrency 3 --headless`. Usa il player del POC, le sole alternative importate e la nuova fonte Super J, salvando `reports/tvdream-alternative-playback-IT.json` e `.csv`. Questi file diagnostici separati non cambiano gli esiti visualizzati nella lista né le conferme manuali. Una prova breve non garantisce continuità o disponibilità futura. TV9 ha anche una prova separata in `reports/tv9-alternative-playback-IT.json`: il vecchio URL del catalogo caricava il manifest ma restituiva ripetutamente HTTP 503 sui segmenti nel log dell’utente; la nuova prima fonte è il link stabile `adaptive.m3u8` pubblicato su `https://www.tv9italia.it/diretta/`, che segue i normali redirect Dacast senza salvare un URL di sessione.

```bash
npm run lint
node scripts/check-catalog.cjs
node --test scripts/stream-test-utils.test.mjs
npm run build -- --webpack
```

Il runner verifica parsing M3U/DASH, deduplicazione/provenienza, esclusione delle voci senza stream, esiti per URL, fallback finito ed errori HTTP/status 0. Sono fixture di logica: non rappresentano riproduzioni di TV reali. In questo ambiente è stata verificata la build con webpack; Turbopack aveva già un limite ambientale di binding delle porte.

Con il sito acceso, `node scripts/check-stream-runner.mjs` verifica in Chrome i casi simulati 403/404/manifest/rete, le restrizioni senza richiesta, l'isolamento delle fonti, tre decodifiche simultanee, il limite globale di tentativi, JSON/CSV, ripresa da report sequenziali e Ctrl+C con più prove attive. Richiede anche `ffmpeg` per generare localmente un breve video HLS e verificare la decodifica reale. Queste fixture non sono prove della disponibilità di emittenti reali.

## Regioni delle emittenti

Lista, player e nuovi tentativi esportati includono la localizzazione (`geography`: regioni/codici, ambito, origine e URL del dato). Le associazioni verificate per alcune TV italiane sono in `src/lib/geography.ts`, con i riferimenti ai siti delle emittenti. I metadati regionali/cittadini dei feed IPTV-org sono risolti tramite `feeds.json`, `subdivisions.json` e `cities.json` per tutti i Paesi del POC. Una città viene ricondotta alla sua regione tramite le suddivisioni amministrative.

“Regione” indica un’associazione verificata dell’emittente; “Area” indica soltanto l’area di diffusione dichiarata dal catalogo, senza affermare dove si trovi la sede. Le edizioni regionali identificabili di un canale usano i dati del feed dello stream selezionato; non viene assegnata l’unione delle regioni delle altre edizioni. Le reti nazionali note sono indicate come “Nazionale”; un generico `c/IT` nel catalogo non basta per questa classificazione. Dove il dato manca compare “Regione non indicata”. È possibile cercare anche il nome della regione.

I vecchi test rimangono consultabili: la localizzazione è salvata nei nuovi tentativi e non viene attribuita retroattivamente. Se un download geografico fallisce, gli stream continuano a essere caricati e il limite viene segnalato nei dettagli dei cataloghi.

## Pulizia del catalogo e geografia (ottobre 2026)

Flusso ripetibile per ogni Paese, senza correzioni manuali canale per canale:

1. **Ritest** dei canali non funzionanti con il player del sito: `node scripts/probe-channels.mjs --input lista.json --country IT --location "Italia" --output reports/retest-<etichetta>-IT.json --headless`. `lista.json` contiene `{ "channels": [ID...] }` per riprovare le fonti attuali, oppure `{ "candidates": [{ channelId, url, format, page }] }` per provare URL nuovi senza inserirli nel catalogo.
2. **Ricerca di fonti alternative** (agenti con ricerca web): solo URL pubblicati dal player ufficiale, manifest HTTP 200 con CORS compatibile; esclusi token temporanei, DRM, login e header simulati.
3. **Verifica in Chrome** dei candidati (passo 1). Gli HLS verificati sono in `data/alternatives/IT.json` e diventano la prima fonte del canale.
4. **Embed ufficiali** (Dailymotion, Twitch, JW Player, streamcloud…): `node scripts/probe-embeds.mjs --input embeds.json --output reports/retest-embeds-<data>-IT.json --base-url http://localhost:3000 --headless` inserisce l'iframe in una pagina del sito e controlla che il `<video>` avanzi. Twitch riceve automaticamente `parent=` uguale all'host del sito.
5. **Eliminazione definitiva**: il pulsante **Elimina** e `POST /api/excluded-channels` salvano in `data/excluded-channels.json`; il catalogo server non restituisce più quei canali, per nessun browser né per il runner.

`/api/test-results` unisce anche tutti i report `reports/retest-*-IT.json`, usando l'esito più recente per canale/URL.

**Geografia** — `data/geography/IT.json` contiene, per ogni emittente, ambito (`national`, `regional`, `local`, `foreign`), regione ISO 3166-2, regioni aggiuntive, città, provincia, coordinate approssimative della sede (centro città), confidenza e fonte. Le coordinate mancanti sono ricavate dalla città con OpenStreetMap Nominatim. Le voci con `confidence: "low"` sono da rivedere. La ricerca prevale sull'area di diffusione IPTV-org, tranne per i feed regionali specifici (es. edizioni TGR).
