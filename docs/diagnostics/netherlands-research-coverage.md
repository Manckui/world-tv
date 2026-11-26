# Paesi Bassi – copertura della ricerca (World TV)

Ricerca del 26 novembre 2026 sui 149 canali di `reports/nl-candidates.json` (IPTV-org e Free-TV)
più 16 emittenti nuove trovate su siti ufficiali. Questo handoff riguarda solo la ricerca editoriale
e geografica: non riporta test di playback. I controlli `curl` verificano solo che il master
risponda 200 con CORS valido per `Origin: http://localhost:3000`. Non sono stati toccati
`data/catalogs/NL.json`, `reports/streams-NL*`, `data/` e `src/`.

Ambiente: rete italiana. Il sito NLPO (`nlpo.nl`, WP Engine + Cloudflare) restituisce
"Sorry, you have been blocked" e non è stato aggirato. Per l'elenco delle omroep locali e per la
loro provincia ho usato il registro ufficiale del Commissariaat voor de Media.

## File consegnati

- `reports/nl-research-geography.json`: 165 ID (149 candidati e 16 nuove emittenti). 101 voci
  hanno una città documentata. Ci sono 79 pin con coordinate GeoNames
  (`https://www.geonames.org/<id>`) e tutti cadono nel poligono della propria provincia
  (`d3-geo` `geoContains`); nessun pin è stato tolto.
- `reports/nl-research-sources.json`: 26 risultati. Ce ne sono 20 `candidate_found`: 13 sono
  emittenti nuove e 7 sono fonti ufficiali migliori per candidati esistenti. Gli altri sono
  5 `no_usable_source` e 1 `defunct`.
- `scripts/nl-research-crawl.mjs`: semplice GET della home e delle pagine
  contact/colofon/over-ons/privacy, con estrazione dei CAP olandesi ("1234 AB Plaats").
- `scripts/nl-research-inspect.mjs`: le stesse pagine e le pagine live aperte in Chrome
  (playwright-core, `channel: "chrome"`). Registra le richieste m3u8/mpd, gli iframe e gli
  indirizzi nel testo visibile e rifiuta i cookie quando trova il pulsante. Non modifica header,
  cookie o geografia.
- `scripts/nl-research-channels.mjs`: nelle pagine "Nu live" con più canali (Dtv, RTV Connect)
  clicca le schede mostrate dalla pagina e registra il master HLS richiesto.
- `scripts/nl-research-geography.mjs`: trasforma la tabella curata in JSON e verifica che:
  - nessuna voce regional/local abbia `regionCode` nullo;
  - ogni pin abbia `sourceUrl` e un URL GeoNames con ID;
  - ogni pin cada nel poligono della provincia;
  - nessun `coordinateSourceUrl` sia un URL di ricerca.

## Fonti usate

- Pagine ufficiali contact/colofon/privacy delle emittenti (URL in `sourceUrl`). La città viene
  presa **solo** da un indirizzo con CAP; mai dal nome del canale o dal capoluogo.
- Registro CvdM delle omroep locali:
  <https://www.cvdm.nl/registers/register-publieke-media-instellingen-lokaal/> (226 omroep con
  area servita e provincia). Il registro documenta solo la provincia, mai la città né il pin.
- GeoNames, dump `NL.zip`: centri abitati con ID stabile. Il pin indica il centro abitato, non la
  sede esatta.
- IPTV-org `channels.json`, per riusare gli ID esistenti (NH.nl, AT5.nl, WEEFFTV.nl, BredaNuTV.nl,
  DTV*.nl, RTVDordrecht.nl, ZuidWestTV.nl, GouwestadTV.nl, RTVConnectTV.nl, Samen1TV.nl,
  TweedeKamerVondelingkamer.nl). Nessuno di questi è in `data/excluded-channels.json`.

## Conteggi geografia

| Ambito | Voci |
| --- | ---: |
| local | 97 |
| national | 40 |
| regional | 16 (le 13 emittenti pubbliche e 3 canali extra: RTV Noord Extra, Rijnmond Extra, Omroep Brabant Radio) |
| unknown | 7 |
| foreign | 5 |

| Provincia | Regional | Local | Pin |
| --- | ---: | ---: | ---: |
| NL-DR Drenthe | 1 | 4 | 5 |
| NL-FL Flevoland | 1 | 2 | 2 |
| NL-FR Fryslân | 1 | 4 | 3 |
| NL-GE Gelderland | 1 | 12 | 8 |
| NL-GR Groningen | 2 | 4 | 5 |
| NL-LI Limburg | 1 | 9 | 8 |
| NL-NB Noord-Brabant | 2 | 23 | 14 |
| NL-NH Noord-Holland | 1 | 15 | 13 |
| NL-OV Overijssel | 1 | 6 | 4 |
| NL-UT Utrecht | 1 | 4 | 3 |
| NL-ZE Zeeland | 1 | 1 | 1 |
| NL-ZH Zuid-Holland | 3 | 13 | 13 |

Le 33 voci local senza città hanno la provincia documentata dal registro CvdM o da una pagina
ufficiale con più sedi (1Twente, Omroep Zout, BR6), ma nessun indirizzo unico.

Scelte da notare:

- **Reti nazionali.** Le reti nazionali hanno `regionCode` null anche quando la sede è nota (BVN
  a Hilversum, Insight TV e Tweede Kamer). I canali SPI/Filmbox e le web radio senza area sono
  classificati `national` con confidenza `low`.
- **Foreign.** Sono foreign KTO (FR), Horse & Country, The Chat Show Channel, WaterBear (GB) e
  TV Rain (RU: licenza olandese, recapito all'Aia, ma pubblico russofono).
- **BR6 TV.** È l'omroep di Bodegraven-Reeuwijk (ZH). Il recapito pubblicato è a Woerden (UT),
  quindi non ho messo né città né pin.
- **AT5.** È un canale cittadino del gruppo NH, classificato `local` NL-NH. L'omroep locale
  designata per Amsterdam resta Salto.

## Nuove fonti (`candidate_found`)

Tutti i master rispondono 200 con `Access-Control-Allow-Origin: *` (curl del 26 novembre 2026).

| ID | Ambito | Master |
| --- | --- | --- |
| NH.nl | regional NH | `takeoff.jetstre.am/?account=nhnieuws&file=live…` |
| AT5.nl | local NH | `takeoff.jetstre.am/?account=atvijf&file=live…` |
| WEEFFTV.nl | local NH (Hoorn) | `takeoff.jetstre.am/?account=weeff&file=weefftv…` |
| BredaNuTV.nl | local NB | `tv.streaming.bredanu.nl/hls/stream.m3u8` |
| DTVDenBosch.nl, DTVMaashorst.nl, DTVOssBernheze.nl, catalog:NL:dtvringdenbosch | local NB | `live.dtvstreams.nl/memfs/<id>.m3u8` |
| RTVDordrecht.nl | local ZH | `ms2.mx-cd.net/dtv-10/…/RTV_Dordrecht.smil/playlist.m3u8` |
| ZuidWestTV.nl | local NB | `owncast1.zuidwest.cloud/hls/stream.m3u8` |
| GouwestadTV.nl | local ZH (Gouda) | `stream.gouwestad.nl:1672/hls/stream1/index.m3u8` ("Nu op TV") |
| RTVConnectTV.nl | local GE | `…cloudfront.net/nlpo/clr-nlpo/rtvfavoriet/index.m3u8` |
| TweedeKamerVondelingkamer.nl | national | `livestreaming.b67buv2.tweedekamer.nl/live/vondelingkamer/index.m3u8` |

Fonti migliori per candidati esistenti:

| ID | Nuova fonte | Problema della fonte attuale |
| --- | --- | --- |
| OmroepMeierijstad.nl | NLPO `ca451ea4x` | mx-cd 404 |
| DenHaagTV.nl | `mistserv3.videostreams.nl/hls/denhaag/index.m3u8` | solo http :1935 |
| LansingerlandTV.nl | streekomroep Zoetermeer-Lansingerland | — |
| RN7.nl | `streams2.rn7.nl/memfs/82e7d507…` | memfs diverso |
| RTVMaastricht.nl | https su porta standard | solo http :8081 |
| LINQTV.nl | percorso `dtv-11` | `dtv-09` 404 |
| 1TwenteTV.nl | master | chunklist con sessione |

Note sulle fonti:

- **Jetstream (NH, AT5, WEEFF).** L'URL d'ingresso è pubblicato nell'HTML della pagina
  (`initData.videoStream`). Il CDN risponde 307 verso una sessione con token generata dal server
  per chiunque. Il token non va salvato e il client non aggiunge niente. Va verificato nel player
  che hls.js segua il redirect.
- **Dtv e Den Haag TV.** Aggiungono `?session=` o `?tkn=` nelle varianti, generati dal server
  dentro il master.
- **Gouwestad.** Usa una porta https non standard (1672) e pubblica una media playlist senza
  master.
- **RTV Connect.** Lo slug `rtvfavoriet` è il flusso predefinito con la scheda CONNECT TV attiva;
  è da confermare a vista. È la fonte migliore anche per RTVArnhemTV.nl, perché `rtvarnhem.nl`
  rimanda a RTV Connect.

## Piste negative

- **Twitch o YouTube.** Samen1 (Apeldoorn) e Gooi TV (Gooise Meren) hanno solo embed Twitch
  (`no_usable_source`). XON (Ede), A1 TV (Nijkerk) e ML5 (Roermond) hanno solo YouTube, escluso.
- **RTV Focus Zwolle.** La TV ha cessato le trasmissioni il 1° aprile 2023, secondo un documento
  del comune (`defunct`).
- **Altri siti senza diretta.** Non ho trovato una diretta su Nieuwsplein33 (Amersfoort), De
  Orkaan (Zaanstad), Omroep Delft, Deventer RTV, RTV IJsselmond (solo radio), Assen FM,
  1Amstelveen e Omroep Tilburg `/live`.
- **Siti che non si risolvono o rifiutano la connessione.** noos.tv, schietv.nl, slotstadrtv.nl,
  rtv1.nl, rtvveluwezoom.nl, rtvwesterwolde.nl, regiotvnieuws.nl, omroepcentraal.nl,
  omroepsudwest.tv, leomiddelse.nl, htrmedia.evtmedia.nl, meervandaag.nl, delft-fm.nl,
  amersfoortnu.nl. Per omroephulst.tv il certificato non è valido.
- **ZFM Zoetermeer.** `ZFMzoetermeer/index.m3u8` è solo audio e
  `media.streekomroepzoetermeerlansingerland.nl/live/master.m3u8` risponde 404.
- **NPO, RTL, Talpa, Ziggo e Pluto.** Non li ho cercati: sono fuori ambito. Ho solo classificato
  i candidati esistenti (SBS6 Classics, Radio 10 e 538 restano nazionali).

## Lacune

- **Unknown (7).** HTR TV, Hype Visual Radio, Radio Stad Den Haag, Regio TV Nieuws, RTV 1,
  RTV Rijnstreek e Slotstad TV. Per nessuno c'è una pagina ufficiale raggiungibile con un'area
  documentata. Slotstad (Zeist) e HTR (Heusden) sono collegati alla loro area solo da directory
  non ufficiali.
- **NH e AT5.** Non hanno un indirizzo sulle pagine consultate: hanno la provincia ma nessun pin.
- **Lista NLPO.** Non è stata consultata (blocco Cloudflare): è possibile che manchino omroep con
  una diretta HLS. I casi più probabili sono:
  - Amersfoort, Zaanstad, Delft e Leeuwarden;
  - Lelystad (Flevolandse Media);
  - Haarlemmermeer, Almelo, Hengelo e Vlaardingen.
- **Zeeland.** Ha una sola omroep locale (Omroep Hulst, sito con certificato non valido). Restano
  da cercare Media Walcheren (Middelburg e Vlissingen), Omroep Terneuzen e Streekomroep de
  Bevelanden.
- **Fonti marginali.** Diversi candidati sono web radio o visual radio (Magic PowerRadio, Radio
  Toppers, Rararadio, Hype), poco utili come TV locali.
