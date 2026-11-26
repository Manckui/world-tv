# Portogallo — consegna PT

Aggiornato: 26 novembre 2026 (Claude). Versione precedente: 13 novembre 2026 (Codex, mappa, candidati e prima ricerca).

## Stato

| | Prima (13/11) | Ora (26/11) |
| --- | ---: | ---: |
| Canali nel catalogo | 6 | **23** |
| Fonti verificate (`verifiedAt`) | 6 | **24** |
| Pin documentati | 2 | **21** |
| Voci di ricerca ufficiale | 16 | 24 |
| Sedi in `pt-research-geography.json` | 16 | 35 |

`node scripts/check-country-packs.mjs PT` passa: 23 canali, 24 fonti (tutte con data), 20 regioni, 21 pin documentati. `npx tsc --noEmit` passa.

## Metodo e fonti

- **Mappa:** invariata, geoBoundaries gbOpen PRT ADM1 (`public/maps/portugal-credits.txt`). 18 distretti più Açores (PT-20) e Madeira (PT-30).
- **Inventario:** `scripts/pt-build-candidates.mjs` (IPTV-org e Free-TV) più `reports/pt-research-sources.json`.
- **Nuova ricerca, 26/11:**
  - elenco IPTV-org `channels.json` per PT (143 canali, tutti i siti locali e religiosi aperti);
  - Wikipedia PT, *Lista de canais de televisão de Portugal* (sezioni in chiaro, autonomiche, terzo settore, abbonamento e streaming);
  - infografiche ERC *Universo de Regulados* (agosto 2025): non contengono un elenco nominale. Indicano 70 servizi televisivi registrati e 7 servizi TV solo internet. Il portale dei registri non è interrogabile senza sessione;
  - circa 60 domini di TV locali e regionali, aperti uno per uno.
- **Player:** ispezionati in Chrome con `scripts/pt-inspect-player.mjs`, variante PT di `es-inspect-player.mjs`. Lo script osserva soltanto le richieste normali della pagina pubblica, senza header, cookie o geolocalizzazione modificati. Lo script ora resiste anche alle navigazioni durante la lettura del `<video>`.
- **Geografia:**
  - sedi lette da contatti, ficha técnica, estatuto editorial o ERC;
  - coordinate del centro del comune (o della freguesia, per Fátima) da Wikidata P625, con `coordinateSourceUrl` (sostituiscono le precedenti query OSM sugli edifici);
  - `check-country-packs` verifica che i pin regionali e locali cadano nel poligono della loro regione;
  - le TV nazionali hanno `regionCode: null`: il pin indica la sede, non la copertura.

### Correzioni alla geografia precedente

- **Porto Canal:** la sede è a Senhora da Hora, **Matosinhos** (Rua Joaquim Pinto 78, deliberazione ERC/2022/37; Wikipedia PT), non a Vila Nova de Gaia.
- **ADB TV:** è la web TV della *Assembleia de Deus da Buraca*, non di una associazione sportiva di Amares (Braga). Il sito non pubblica un indirizzo, quindi scope `unknown` e nessun pin: la città non viene dedotta dal nome.
- **RFPtv:** la pagina *Sobre nós* riporta solo telefono ed email. Il pin a Lisboa era senza prova ed è stato rimosso.
- **RTP:** indirizzi verificati su media.rtp.pt/empresa/contactos/gerais. La sede è a Lisboa; RTP Açores è a Ponta Delgada (Rua Castelo Branco) e RTP Madeira a Funchal (Caminho de Santo António 145). RTP Açores e RTP Madeira sono `regional`.

### Pulizia dell'inventario (`scripts/pt-build-catalog.mjs`)

- **Duplicati fusi:**
  - `catalog:PT:adtv` diventa ARTV.pt (stesso playout livextend ABR);
  - `catalog:PT:rtp3` diventa RTPNoticias.pt.
- **Fuori ambito** (non sono emittenti portoghesi; elencati in `reports/pt-catalog-exclusions.json`):
  - FIFA+ Portuguese;
  - Trailers UK;
  - KTO (Francia);
  - Angel TV Portuguese.

  Erano entrati nel catalogo del 13/11 solo perché presenti nelle liste PT.
- **Selezione dei test:** il builder legge tutti i report `reports/*-PT*.json`, tranne quelli `pt-*`. Per ogni coppia canale + URL tiene il test con lo `startedAt` più recente. Controllato: Kuriakos Kids, `interrupted` il 13/11 e `verified` il 26/11, risulta verificato.

## Test reale

```sh
node scripts/pt-build-catalog.mjs --stage   # 35 canali, 38 fonti
npm run test:streams -- --country PT --location "ambiente locale, posizione non verificata" --concurrency 1 --headless --output reports/streams-PT-2.json
node scripts/pt-build-catalog.mjs           # 23 canali, 24 fonti
```

- **Ambiente:** 26/11/2026, Chrome headless, server locale `http://localhost:3000`. Il test DE girava in parallelo sullo stesso server. Posizione del tester non verificata: l'uscita IP risultava in Italia.
- **Esito di `streams-PT-2.json`:** 38 fonti, **24 verified**, **14 failed**, 0 inconclusive.

### Fonti fallite

- **Tutte le 12 fonti RTP** (RTP 1, RTP 2, RTP Notícias ×3, Memória, Açores, Madeira, África, Mundo, Desporto 1 e 2): «errore di rete». Fuori da rtp.pt la CDN `streaming-live.rtp.pt` risponde `204 No Content`; IPTV-org le marca come URL che richiedono Referer/User-Agent. Inoltre, dalle pagine RTP Play di RTP 1 e RTP 2 ora escono solo URL con token temporaneo (`?tk=`) e DASH `rtpClean`. Per le regole del progetto non sono utilizzabili: niente header simulati, niente URL firmati.
- **Famatv:** `tv2.fastcast4u.com:3310` irraggiungibile dal browser, fallita anche il 13/11.
- **NPC Rádio e TV:** HTTP 403.

## Catalogo finale per ambito

| Ambito | Canali |
| --- | ---: |
| Nazionale | 17 (ARTV, Canção Nova, RFPtv, Kuriakos TV/Kids/Cine, 11 feed Maná) |
| Regionale | 2 (Porto Canal, ConecTV) |
| Locale | 3 (ON FM, Rádio Sines, Covilhanense TV) |
| Sede non documentata | 1 (ADB TV) |
| **Totale** | **23** |

Ci sono 21 pin: 18 sono sedi di canali nazionali (Lisboa, Odivelas, Fátima) e non indicano la copertura.

### Per distretto (solo canali regionali e locali)

| Regione | Canali |
| --- | --- |
| PT-05 Castelo Branco | Covilhanense TV (Covilhã) |
| PT-08 Faro | ConecTV (Faro) |
| PT-11 Lisboa | ON FM (Torres Vedras) |
| PT-13 Porto | Porto Canal (Matosinhos) |
| PT-15 Setúbal | Rádio Sines (Sines) |
| Tutte le altre, compresi PT-20 Açores e PT-30 Madeira | 0 |

PT-03 Braga resta vuota perché Famatv non è verificata. Açores e Madeira restano vuote perché RTP Açores e RTP Madeira falliscono per il blocco della CDN RTP.

### Nuove emittenti trovate e verificate

| Emittente | Sede (prova) |
| --- | --- |
| TV Canção Nova Portugal | Fátima, cancaonova.pt/contactos |
| Covilhanense TV | Covilhã, dichiarata dal progetto; senza indirizzo postale, confidenza medium |
| ConecTV | Faro, ficha técnica. Il feed è condiviso con la rete ConecTV brasiliana: confidenza medium |
| Kuriakos TV | Motes & Ideias, Parque das Nações, Lisboa |
| TV Maná 1 | Maná – Igreja Cristã, Pontinha (Odivelas) |
| Rádio Sines | Sines; radio con emissione video |

## Esclusioni e voci non incluse

- **Non verificate dal runner:**
  - 12 fonti RTP, per Referer o token (vedi sopra);
  - Famatv;
  - NPC.
- **Solo player YouTube**, non misurabili dal runner e quindi non inseriti:
  - Way TV, Novo Tempo Portugal, UniFé TV, Águeda TV, Novum Canal, Loures TV, Braga TV, Viana TV;
  - Santuário de Fátima;
  - AD Almada: il culto online usa livepeer, a episodi, ed era offline durante l'ispezione.
- **Senza diretta pubblica trovata o non accessibili:**
  - Canal180, Canal 11, Localvisão (403), Viseu TV, Alto Minho TV, TV Algarve (solo MP4);
  - VITEC Azores TV: il sito rimanda a un player esterno vuoto;
  - Rádio Clube de Lamego;
  - Norte Litoral TV: è dietro una challenge Cloudflare, quindi non è stata aggirata;
  - iesTV: host `ddns.net` offline;
  - SIC, TVI, CNN Portugal, CMTV, Canal Q: richiedono login o abbonamento, oppure URL firmati `wmsAuthSign`.
- **Già escluse il 13/11:** 95 voci da liste pubbliche (header simulati, IP nudi, restream). Riepilogo in `reports/pt-candidates.json`.
- Nessun ID presente in `data/excluded-channels.json` è stato reinserito.

## Lacune

1. **RTP:** manca tutto il servizio pubblico, compresi gli unici canali di Açores e Madeira. Senza Referer di rtp.pt la CDN non serve i manifest. Senza token non ci sono URL per RTP 1 e RTP 2. Un'eventuale soluzione deve passare da un player incorporabile ufficiale di RTP, da verificare a mano: il runner non misura gli iframe.
2. **Distretti scoperti:** 15 distretti e le due regioni autonome non hanno canali regionali o locali verificati. Le TV locali portoghesi trasmettono quasi sempre in diretta tramite YouTube o Facebook.
3. **ERC:** l'elenco nominale dei servizi registrati (portale dei registri) non è stato consultabile. Restano da incrociare i 7 servizi TV solo internet registrati.
4. **Sedi:** per ADB TV, RFPtv e NPC manca un indirizzo pubblicato, quindi non hanno pin.
5. **Continuità:** i feed Maná e Kuriakos sono online e religiosi. La loro presenza pesa sul totale, ma rispettano le regole (player ufficiali, nessun token).
6. **Ripetizione dei test:** si consiglia un passaggio indipendente da una connessione in Portogallo.

## File

- `reports/pt-research-sources.json`: 24 voci;
- `reports/pt-research-geography.json`: 35 sedi;
- `reports/streams-PT-2.json` / `.csv`: test del 26/11. `reports/streams-PT.json` (13/11) è conservato;
- `scripts/pt-build-catalog.mjs`: fusioni ed esclusioni fuori ambito;
- `scripts/pt-inspect-player.mjs`: nuovo, solo osservazione passiva;
- `data/catalogs/PT.json`, `data/geography/PT.json`, `data/alternatives/PT.json` (vuoto).
