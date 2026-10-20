# Spagna — controllo indipendente di Claude

Data: 20 ottobre 2026. Revisione del catalogo consegnato da Codex in `docs/diagnostics/spain-handoff.md` (primo passaggio concluso).

**CONTROLLO CONCLUSO** — con difetti documentati. Due richiedono una decisione prima della pubblicazione: i canali senza fonte funzionante e le fonti HTTP (vedi “Difetti”).

## Ambiente e configurazione del nuovo test

- Comando: `npm run test:streams -- --country ES --location "ambiente locale, posizione non verificata" --concurrency 2 --headless --output reports/retest-claude-ES.json`
- Runner condiviso, player reale del sito su `http://localhost:3000`, Chrome 156.0.8078.36 headless, 2 worker.
- Avvio massimo 20 s, osservazione 20 s: fotogrammi decodificati, dimensioni valide, avanzamento del video.
- Esecuzione dalle 14:41 alle 15:24 UTC. Posizione: **ambiente locale, posizione non verificata**. Non è dedotta dal Paese dei canali né dal fuso Europe/Rome.
- Nessun report precedente sovrascritto. Output: `reports/retest-claude-ES.json` e `.csv`.

## Conteggi

| Misura | Codex (`streams-ES` + `retest-official-recovery-ES`) | Claude (`retest-claude-ES`) |
| --- | ---: | ---: |
| Fonti provate | 327 | 327 (coda `complete`) |
| Verified | 218 | 213 |
| Failed | 101 + 12 | 107 |
| Inconclusive | 6 | 7 |
| Skipped | 0 | 0 |
| Canali con almeno una fonte verified | 176 | 173 |
| Canali senza fonte verified | 72 | 75 |

Motivi dei 107 fallimenti nel mio test:
- 49 HTTP 403;
- 43 errori di rete/CORS;
- 10 HTTP 404;
- 2 errori di decodifica media;
- un caso ciascuno di 401, 451 e 400.

## Confronto con i risultati precedenti

316 esiti su 327 coincidono:
- 210 verified → verified;
- 102 failed → failed;
- 4 inconclusive → inconclusive.

Le 11 differenze, che a un singolo passaggio vanno lette come variazioni probabilmente temporanee:

| Canale | Prima | Ora | Dettaglio |
| --- | --- | --- | --- |
| La 2 (`rtvelivestream.rtve.es/rtvesec/la2`) | verified | failed | HTTP 403. RTVE blocca in streaming alcuni programmi per diritti: probabile blackout temporaneo, non un URL morto |
| La 2 Canarias | verified | failed | HTTP 403, stesso caso |
| Urola TB | verified | failed | HTTP 403 |
| Guada TV Media (2 fonti: getpublica, fastchannel) | verified | failed | “Il browser non riesce a decodificare il video” su entrambe |
| 8TV La Janda, iPROtv, Tenerife Plus TV | verified | inconclusive | nessun avanzamento entro 20 s |
| Cortes de Castilla y León | failed | verified | sessione parlamentare in diretta al momento del test |
| Arabí TV, TeleGranada | inconclusive | verified | |

Proposta: ritestare queste 11 fonti in un altro orario prima di cambiare `verifiedAt`. Per Guada TV, iPROtv e Urola TB, se falliscono ancora, rimuovere `verifiedAt`. Non ho modificato il catalogo.

## Geografia e mappa

- **Codici**: 19 codici identici fra `public/maps/spain.json`, `data/regions/ES.json` e geografia. Ci sono 17 comunità autonome più Ceuta e Melilla, nessuna regione persa. Ogni canale del catalogo ha un record geografico.
- **Ambiti**: 10 nazionali (`regionCode: null`), 194 regionali, 44 locali. I nazionali hanno il pin della sede (Pozuelo de Alarcón/Madrid) ma restano nella scheda “TV nazionali”, separati dalla Comunidad de Madrid: corretto.
- **Pin**: 116, tutti con città, `coordinatePrecision: "city"` e fonte. Ognuno cade dentro il poligono della propria regione: nessun errore con `geoContains`. Anche `node scripts/check-country-packs.mjs ES` passa.
- **Canali per regione nella UI**: i conteggi delle 19 aree corrispondono ai dati (controllo automatico su desktop e mobile).
- **Ceuta**: 0 canali nel catalogo; RTVCE è solo nella geografia, fra le 5 voci di ricerca non catalogate dichiarate da Codex.
- **Campione delle sedi**: ho aperto 14 `sourceUrl` di canali locali/regionali con città.
  - In 11 la città compare nella pagina.
  - Cortes de Castilla y León: pagina non raggiungibile da qui.
  - Hamaika: la pagina elenca uffici a Donostia, Bilbo e Gasteiz. Donostia è il primo indicato: accettabile, ma la nota dovrebbe citare le tre sedi.
  - 24h Catalunya: `rtve.es/centros-territoriales/` non nomina Sant Cugat del Vallès.

### Correzioni applicate a `data/geography/ES.json`

Copia precedente conservata nello scratchpad di Claude. Nessuna coordinata, città o regione cambiata.

1. **131 voci** con regione ricavata solo dalla sezione regionale di TDTChannels e sede non documentata (molte TV municipali: 7TV Almería, TeleToledo, Canal 4 Tenerife…). Erano `confidence: "medium"`, ora sono `low`, con una nota che lo spiega. La regione deriva dal catalogo, non da una fonte sulla sede. Per le TV municipali lo scope corretto sarebbe probabilmente `local`, ma va confermato con la sede, quindi non l'ho cambiato.
2. **4 feed territoriali RTVE a Sant Cugat del Vallès** (La 1 Catalunya, La 2 Cat, 24h Catalunya…). Erano `confidence: "high"`, ora `medium`: la fonte citata non riporta la città.

`check-country-packs.mjs ES` passa anche dopo le correzioni.

## Difetti con correzione proposta (file di Codex, non modificati)

| # | Gravità | Difetto | Evidenza | Correzione proposta |
| --- | --- | --- | --- | --- |
| 1 | Alta, decisione dell'utente | 72 canali (75 nel mio test) senza nessuna fonte funzionante restano nel catalogo e nella UI come TV normali. Aprendoli si vede “Questa diretta non è disponibile adesso” | TV3, 33, Teledeporte, le 3Cat Exclusiu, ETB 1/2… Esempio: TV3 risponde HTTP 403 (Varnish) sia nel test di Codex sia nel mio; la UI mostra l'errore | In Italia l'utente ha chiesto di eliminare definitivamente i canali che non funzionano. Proposta: escluderli dal catalogo pubblicato (o da `data/excluded-channels.json`), tenendoli nei report |
| 2 | Alta per produzione | 4 canali usano fonti `http:`: NORTEvisión (unica fonte), Canal 2000 (unica fonte), Este Canal TV, Alcarria TV (ha anche HTTPS) | Su Vercel (HTTPS) il browser blocca il contenuto misto: il test su `http://localhost` non lo mostra | Tenere solo l'equivalente HTTPS verificato (Alcarria TV); NORTEvisión e Canal 2000 non funzioneranno online finché non c'è una versione HTTPS |
| 3 | Media | 131 regionali senza sede (vedi sopra) con scope `regional` per TV municipali | note “Area tratta dalla sezione regionale del catalogo TDTChannels” | Confidenza corretta; servono ricerca della sede e scope `local` |
| 4 | Bassa | 24h Catalunya e feed RTVE a Sant Cugat con fonte che non cita la città | pagina RTVE `centros-territoriales` | Citare una pagina RTVE o una nota legale con l'indirizzo del centro di Sant Cugat |
| 5 | Osservazione UI | Entrando in Spagna dal globo, il player si apre già su “24h” e mostra “Connessione alla diretta…” | screenshot desktop e mobile del primo ingresso | Confermare che l'apertura automatica di una TV nazionale sia voluta |

## Interfaccia: desktop (1440×960) e mobile (390×844)

Test con script indipendenti in Chrome (screenshot e risultati nello scratchpad di Claude; non uso `.impeccable/review` per non sovrascrivere gli screenshot di Codex).

| Controllo | Desktop | Mobile |
| --- | --- | --- |
| Globo → Spagna → esplora regioni | OK | OK |
| 19 aree e relativi conteggi uguali ai dati | OK | OK |
| Canarie visibili nell'inquadratura Spagna; vista regionale di Canarias, Illes Balears, Ceuta, Melilla, Andalucía con tanti pin quante le città documentate | OK | OK |
| Ricerca per nome (“3CatInfo”) | OK | OK (dalla barra “Canali”) |
| Scheda TV nazionali: 10 canali uguali ai dati | OK | — (non ripetuto) |
| Player: 3CatInfo avanza oltre 5 s con video valido; link ufficiale `3cat.cat/3cat/directes/3catinfo-tv/` presente | OK | OK |
| TV3 (fonte in 403): messaggio di errore chiaro, nessun blocco | OK | — |
| Passaggio Spagna → Italia → Spagna, nessun overflow orizzontale, nessun errore JS | OK | OK |

Non verificati:
- zoom con gesti (pinch o rotella) sulla Spagna;
- interfaccia in inglese;
- riproduzione degli altri 247 canali dentro la UI: la riproduzione è coperta dal runner, non dalla UI.

La verifica dell'interfaccia non equivale alla verifica delle dirette.

## Stato

**CONTROLLO CONCLUSO.**
- Tutte le 327 fonti correnti sono state riprovate.
- Le discrepanze sono documentate.
- Geografia, codici e UI sono stati controllati.
- I report sono salvati.

Restano aperti, per Codex o per l'utente:
- difetto 1: canali non funzionanti visibili;
- difetto 2: fonti HTTP in produzione.

Codex può leggere questo documento e `docs/diagnostics/france-handoff.md`.

## Fase 2 — recupero dalle pagine ufficiali ed eliminazione (richiesta dell'utente, 20 ottobre 2026)

Su richiesta dell'utente, per i **77 canali in errore** e solo per quelli ho cercato alternative sul sito ufficiale. I canali sono i 75 senza fonte `verified` nel mio retest, più NORTEvisión e Canal 2000, che hanno solo HTTP. I canali senza alternativa utilizzabile sono stati eliminati.

**Metodo.** Ho aperto in Chrome la pagina ufficiale della diretta indicata nel catalogo (`website`) e accettato il banner di consenso solo tramite i pulsanti visibili. Ho registrato per 20 s le richieste `.m3u8`/`.mpd` e gli iframe del player pubblico.
- Tenute solo le playlist principali.
- Rimossi i parametri temporanei (`x`, `start`, `_`, `access_token`…).
- Scartati gli URL firmati (`wmsAuthSign`) e gli embed YouTube.

Risultato: 23 candidati per 26 canali, provati con il player reale (`reports/retest-claude-ES-alternatives.json`, stesso criterio di 20 s).

| Esito | Canali |
| --- | --- |
| **Recuperati, verified, inseriti come prima fonte in `data/catalogs/ES.json`** | TV3 e 33 (feed internazionale `directes*-tv-int.3catdirectes.cat`), Guada TV Media (`cloud.fastchannel.es/mic/…`), TeleElx (`tvdirecto3.teleelx.es`) |
| Errore di rete/CORS dal nostro sito (il flusso è limitato al sito dell'emittente) | 101TV Málaga, Málaga Cofrade, Sevilla, Sevilla Cofrade, Granada, Cádiz, Costa del Sol; Lleida TV, L'Hospitalet TV, TV Costa Brava, Interalmería TV, 7TV Almería |
| HTTP 403 (Castr) | Manilva TV, Noroeste TV, TeleToledo |
| DASH con protezione DRM dichiarata | ETB 1, ETB 2 |
| HTTP 451 | ETB Eventos 2 |
| Token di sessione obbligatorio (401 senza token) | Aragón TV Internacional |
| URL firmato, non salvabile | Junta de Castilla y León |
| Solo YouTube | 8 La Marina TV, Elche 7 TV, Canal 6 Totana |

**Altre correzioni al catalogo:** rimossa la fonte `http:` di Alcarria TV (resta quella HTTPS verificata).

**Eliminazione definitiva:** 73 canali sono stati aggiunti a `data/excluded-channels.json` (`country: "ES"`). È lo stesso meccanismo del pulsante Elimina: il catalogo servito non li restituisce più. Sono inclusi anche NORTEvisión, Canal 2000 ed Este Canal TV, che hanno solo HTTP e senza alternativa HTTPS sarebbero bloccati su HTTPS. `data/catalogs/ES.json` e i report conservano tutte le voci e le prove: la decisione è reversibile togliendo gli ID dal file delle esclusioni.

**Stato dopo la fase 2:** `/api/channels?country=ES` restituisce **175 canali, ciascuno con almeno una fonte verified**. Per regione:

| Regione | Canali | Regione | Canali |
| --- | ---: | --- | ---: |
| Andalucía | 54 | Extremadura | 5 |
| Catalunya | 26 | Comunidad de Madrid | 6 |
| Comunitat Valenciana | 16 | Castilla-La Mancha | 6 |
| Galicia | 14 | Cantabria | 4 |
| Canarias | 13 | Región de Murcia | 3 |
| País Vasco / Euskadi | 12 | Castilla y León, Illes Balears, Navarra | 2 ciascuna |
| Asturias | 1 | Aragón, La Rioja, Ceuta, Melilla | 0 |

I nazionali sono 9: Teledeporte è eliminato. La 2 resta, con una fonte verificata da Codex che nel mio retest rispondeva 403, da riprovare. `check-country-packs.mjs ES` passa: 248 voci nel pack, 330 fonti, 221 datate.

I difetti 1 e 2 della tabella precedente sono **risolti**.
