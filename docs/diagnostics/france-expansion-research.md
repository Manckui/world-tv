# Francia — ricerca integrativa Codex

Ricerca conclusa il 20 ottobre 2026. **Questa è una consegna di candidati e prove di provenienza, non un certificato di riproduzione.** I test video reali sono eseguiti separatamente dall'agente principale. Ambiente locale, posizione geografica non verificata.

Confrontati il catalogo consegnato da Claude (91 canali, 116 fonti), `france-handoff.md` e le 107 voci di `reports/fr-research-sources.json`. Nessuna modifica ai cataloghi, alla geografia, alle mappe o agli script condivisi.

Il risultato è in [`reports/fr-expansion-research-codex.json`](../../reports/fr-expansion-research-codex.json): **8 record, 9 URL**. Cinque emittenti hanno candidati da provare, una voce corregge la geografia di un canale esistente, due hanno un problema concreto già rilevato. Non sono otto nuove TV funzionanti.

## Candidati consegnati per il test

| Emittente | Territorio e sede documentata | Fonte pubblica recuperata | Differenza rispetto alla ricerca precedente |
| --- | --- | --- | --- |
| **NA TV** | Nouvelle-Aquitaine, Coutras (Gironde) | HLS `https://naradio.vedge.infomaniak.com/livecast/ik:naradio/playlist.m3u8` | Il pulsante « EN direct » della homepage conduce a **`/about/`**. Il video e il manifest sono presenti lì; la homepage da sola aveva portato alla conclusione “solo VOD”. |
| **Télé Péyi** | Guyane, Cayenne | Iframe Infomaniak con `channel=JH99617043325684587&player=12726` | Il sito attuale `peyiguyane.com` pubblica un player ufficiale, distinto dal vecchio HLS fallito del catalogo pubblico. |
| **TV3V** | Grand Est, Reichshoffen (Bas-Rhin) | HLS `https://tv3v.live-kd.com/live/tv3v/livestream/playlist.m3u8` | Emittente assente dalle 107 schede ufficiali. Manifest osservato nelle richieste Chrome del sito; i vicini URL `vod-kd.com` sono replay e non sono stati proposti. |
| **TNTV — direct JT** | Polynésie française, Papeete | Iframe Brightcove ufficiale, account `5816339219001`, player `3K4Lelzgl6`, video `6385218654112` | Il dominio attuale è `tntvnews.pf`; `tntv.pf` non consentiva la precedente ispezione. La pagina `/direct-jt/` carica il player e richiede manifest e varianti audio/video. |
| **KTO** | Nazionale, sede amministrativa Malakoff | HLS `https://livekto.akamaized.net/hls/live/20000018/ktotv/master.m3u8` | La pagina corretta è `/page/kto-en-direct`; `/en-direct` risponde 404. Non va assegnata a Île-de-France come copertura locale. |

Provenienza e sedi:

- **NA TV:** [diretta](https://www.natv.fr/about/), [homepage con il collegamento](https://www.natv.fr/), [sede legale a Coutras](https://www.natv.fr/mentions-legales/). Il nome del CDN contiene “naradio”, ma questo da solo non dimostra che sia audio: il test deve verificare fotogrammi e dimensioni video.
- **Télé Péyi:** [homepage con iframe](https://www.peyiguyane.com/), [pagina TV](https://www.peyiguyane.com/tele-peyi), [sede di INFOGUYANE a Cayenne](https://www.peyiguyane.com/mentions-legales). La pagina pubblicizza l'accesso senza account; non è stato usato alcun accesso autenticato.
- **TV3V:** [diretta](https://www.tv3v.fr/Direct.html), [indirizzo e copertura Pays de Niederbronn-les-Bains](https://www.tv3v.fr/Nous-contacter/Adresse.html). Sede: 44 rue du Chemin de Fer, Reichshoffen; il nome dell'area servita non va confuso con il comune della sede.
- **TNTV:** [diretta JT](https://www.tntvnews.pf/direct-jt/), [contatti a Papeete](https://www.tntvnews.pf/contact/). La pagina si chiama esplicitamente “Direct JT”: **non è dimostrata la disponibilità 24 ore su 24**. Il JSON conserva l'iframe esatto pubblicato, incluso il `livePlaybackToken` pubblico. Il payload letto non contiene `exp`; non è stato costruito, alterato o rinnovato alcun token. L'HLS derivato non è proposto come URL permanente.
- **KTO:** [diretta e configurazione HLS](https://www.ktotv.com/page/kto-en-direct), [sede a Malakoff](https://www.ktotv.com/page/mentions-legales). Una sede nazionale non crea un canale regionale.

## Zénith: canale esistente da collocare in Normandie

`zenith.fr` **è già nel catalogo**. La [pagina ufficiale](https://znth.tv/index) si descrive come televisione associativa alternativa trasmessa da **Alençon, Normandie**, e pubblica entrambi gli HLS presenti nel JSON. La classificazione precedente `unknown` può quindi essere sostituita da `local`, `FR-NOR`, città Alençon, con questa fonte primaria. Non creare un secondo canale.

## Due piste con esito negativo concreto

- **POM.tv, Occitanie/Toulouse.** La [pagina ufficiale del direct](https://www.pom.tv/fr/le-direct) richiede effettivamente in Chrome `https://www.pom.tv:8090/stream1.m3u8`, nonostante nell'HTML iniziale compaia anche come commento. La richiesta del 20 ottobre, circa 16:08 UTC, risponde **404**. L'header CORS limita inoltre l'origine a `https://www.pom.tv`. Nessuna simulazione di origine effettuata. La [storia editoriale](https://www.pom.tv/notre-histoire) documenta l'ambito Occitanie; il [registro pubblico INSEE](https://annuaire-entreprises.data.gouv.fr/entreprise/905171435) documenta la sede a Toulouse. Una fonte ufficiale trovata può comunque essere inutilizzabile.
- **Moselle TV, Longeville-lès-Metz.** La [pagina ufficiale](https://moselle.tv/direct/) incorpora esattamente `https://geo.dailymotion.com/player/x19ep4.html?video=x9lgbik`. L'agente principale ha verificato che Dailymotion **rifiuta il dominio del progetto**; candidato segnato `embed_domain_restricted`, senza tentare di superare il limite. La pagina collega anche il canale Twitch `moselle_tv`, ma qui non viene dichiarato verificato né inserito fra le fonti. La [sede ufficiale](https://moselle.tv/contact/) è Longeville-lès-Metz, non il centro di Metz; la [copertura](https://moselle.tv/nous-recevoir/) è Moselle.

## Coordinate

Il JSON separa la prova della sede dalle coordinate. Sono punti rappresentativi dei comuni, **mai sedi esatte, antenne o trasmettitori**.

| Comune | Latitudine | Longitudine | Provenienza |
| --- | ---: | ---: | --- |
| Alençon | 48.4310 | 0.0923 | [API Découpage administratif, INSEE 61001](https://geo.api.gouv.fr/communes?nom=Alen%C3%A7on&fields=nom%2Ccode%2Ccentre%2CcodeDepartement%2CcodeRegion&format=json&geometry=centre) |
| Cayenne | 4.9372 | -52.3259 | [OSM Nominatim, città, relation 1663791, CAP 97300](https://nominatim.openstreetmap.org/search?q=Cayenne&featureType=settlement&countrycodes=fr%2Cgf&format=jsonv2&limit=10&addressdetails=1) |
| Coutras | 45.0407 | -0.1290 | OSM Nominatim, risultato già salvato nel cache `reports/fr-geocode.json` |
| Reichshoffen | 48.9336 | 7.6675 | OSM Nominatim, risultato già salvato |
| Papeete | -17.5374 | -149.5660 | OSM Nominatim, risultato già salvato |
| Toulouse | 43.6045 | 1.4442 | OSM Nominatim, risultato già salvato |
| Longeville-lès-Metz | 49.1152 | 6.1361 | OSM Nominatim, risultato già salvato |

Per Alençon la precisione è `municipality-centre`, come il campo `centre` dell'API. Per gli altri sei è `city-centre`, come le query OSM filtrate per centro abitato. Ogni record riporta l'URL della query; il cache condiviso non è stato modificato. **Tutti e sette i punti superano `d3.geoContains` sul poligono della rispettiva regione in `public/maps/france.json`.**

Il [centro comunale API gouv di Cayenne](https://geo.api.gouv.fr/communes?nom=Cayenne&fields=nom%2Ccode%2Ccentre%2CcodeDepartement%2CcodeRegion&format=json&geometry=centre), 4.9464/-52.3319, cade fuori dalla costa del poligono corrente. È stato escluso in favore del risultato OSM della **città** verificato sopra, non spostato arbitrariamente. La ricerca OSM deve includere `countrycodes=fr,gf`: Cayenne è registrata con `country_code=fr`; il solo filtro `gf` non restituisce risultati.

## Piste aperte esaminate e limiti

- **Locales Plus:** la [federazione ufficiale](https://locales.tv/locales-plus-la-nouvelle-plateforme-nationale-qui-renforce-laccessibilite-et-la-visibilite-des-televisions-locales/) conferma il progetto SCIC Écran Local/OKAST. Tuttavia [localesplus.fr](https://localesplus.fr/) restituisce una vetrina senza player: sezioni di esempio nascoste nell'HTML, nessun iframe/video e collegamenti interni alle sezioni della pagina. Non sono state trattate le scritte “LIVE” come prova di diretta.
- **Brezhoweb:** la [pagina ufficiale](https://www.brezhoweb.bzh/War-eeun_289.html) implementa una **programmazione lineare con video Vimeo sincronizzati all'orario**: `live_load_playlist()`, `live_time_detect()` e passaggio al programma successivo. “Solo VOD” è dunque una descrizione incompleta. Non è stato trovato un HLS lineare o un iframe dell'intero player separato dalla pagina. Non proporre uno dei singoli Vimeo come se fosse il canale.
- **Tébésud:** il [portale comune](https://www.tebeo.bzh/direct/) presenta Tébéo e Tébésud e un solo player web. Non è provata una seconda diretta web distinta; questo non dimostra la chiusura della seconda emittente.
- **TV78:** la [homepage attuale](https://tv78.com/) contiene replay YouTube e un lettore a selezione di video. Non è stato recuperato un nuovo flusso lineare ufficiale per sostituire l'HLS 404 già testato. Non è una prova che la TV sia cessata.
- **TéléGohelle:** il [vecchio sito ufficiale](https://telegohelle.agglo-lenslievin.fr/) rimanda a Reall. Il [comunicato dell'ente editore](https://www.agglo-lenslievin.fr/?jet_download=dbd3899af57ef1c48a510109dc6ac7fc842ce02e) documenta il cambio del 3 luglio 2025. Il nuovo dominio presenta un problema di certificato HTTPS; nessun player corrente recuperato. Non aggiungere una vecchia lista come emittente verificata.
- **C’Saint-Jo TV:** il [Comune di Saint-Joseph](https://saintjoseph.re/spip.php?rubrique=162) documenta sede/ambito e distribuzione ZEOP/Facebook. Nessun nuovo HLS o iframe lineare pubblico trovato; `saintjo.tv` non risolve nella precedente ricerca.
- **8 Mont-Blanc:** `8montblanc.fr/le-direct/` presenta un certificato non valido. Nessuna disattivazione dei controlli TLS e nessuna fonte ricavata da quel dominio.
- **Caledonia:** la [comunicazione della stessa emittente](https://www.linkedin.com/company/str-caledonia) dichiara il nuovo direct disponibile dalla Nouvelle-Calédonie e replay per chi si trova altrove. Non si è cercato di superare il vincolo geografico.
- **TLSV/Pays de la Loire e Bourgogne-Franche-Comté:** nessun ulteriore flusso lineare primario individuato in questo approfondimento. Le prove degli iframe esatti di Télénantes, Angers Télé e altre fonti già ricercate sono svolte dall'agente principale; non sono state duplicate.

## Metodo e consegna

Ricerca su siti degli editori, enti pubblici, federazione delle emittenti; lettura HTML e osservazione delle richieste di Chrome con la configurazione ordinaria. Nessun aggiramento di login, DRM, challenge, origine o geolocalizzazione. L'osservazione di un manifest, anche HTTP 200, non è classificata come riproduzione riuscita.

Le ispezioni browser sono state eseguite tramite lo script già disponibile `scripts/fr-inspect-official.mjs`, senza modificarlo; evidenze grezze temporanee in `/tmp/fr-exp-browser.json` e `/tmp/fr-exp-browser2.json`. Gli URL e le conclusioni utili sono conservati nel JSON di consegna. I test e l'eventuale inserimento nel pack rimangono responsabilità dell'agente principale, per evitare modifiche concorrenti.
