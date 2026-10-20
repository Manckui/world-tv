# Francia — consegna di Claude

Data: 20 ottobre 2026.

**CONSEGNA FR CONCLUSA. Il catalogo è pronto per il retest indipendente di Codex.**

Lo stato indica che le fonti candidate sono state esaminate e provate. **Non** dichiara censite tutte le TV francesi né tutte funzionanti: le lacune sono elencate sotto.
Posizione del tester: **ambiente locale, posizione non verificata**. Le prove sono state eseguite da questa macchina, non dalla Francia.

## File prodotti

| File | Contenuto |
| --- | --- |
| `data/catalogs/FR.json` | 91 canali, 116 fonti tutte con `verifiedAt` (109 HLS, 1 DASH, 6 embed) |
| `data/geography/FR.json` | 91 record, uno per canale; 53 pin |
| `data/alternatives/FR.json` | vuoto per scelta: tutte le fonti ufficiali verificate sono già nel catalogo curato |
| `data/regions/FR.json`, `public/maps/france.json`, `public/maps/france-credits.txt` | 21 territori ISO 3166-2:FR alle coordinate reali |
| `reports/fr-candidates.json` | inventario dai cataloghi pubblici e 416 voci scartate con motivo |
| `reports/fr-research-sources.json`, `reports/fr-research-geography.json` | ricerca sui siti ufficiali: 107 emittenti e 201 sedi |
| `docs/diagnostics/france-research-coverage.md` | note di copertura della ricerca |
| `reports/streams-FR.json`, `streams-FR-official.json`, `streams-FR-https-recheck.json` | prove HLS/DASH con il player reale |
| `reports/embeds-FR-strict.json` | prove degli embed con criterio rigoroso (unico report embed usato dal catalogo) |
| `reports/embeds-FR-official*.json` | prime prove degli embed con criterio debole: solo storico, non usate |
| `reports/fr-provenance.json` | ricerca di ogni flusso sulla pagina ufficiale (HTML e richieste di rete in Chrome) |
| `reports/fr-geocode.json` | coordinate OSM dei centri abitati delle sedi |
| `reports/fr-catalog-exclusions.json` | canali e fonti esclusi in fase di costruzione |
| `scripts/fr-*.mjs` | pipeline ripetibile (vedi “Comandi”) |

## Provenienza e criteri di inclusione

1. **Inventario pubblico** (`fr-build-candidates.mjs`): IPTV-org API (FR e codici d'oltremare GP, MQ, GF, RE, YT, PF, NC…), lista IPTV-org Francia e Free-TV France. Ne risultano 95 emittenti e 129 fonti. Scartate 416 voci:
   - 155 fuori ambito: diaspora in altre lingue, Euronews in altre lingue, feed TV5Monde esteri, Pluto TV (eliminato dall'utente in Italia);
   - 116 restream non ufficiali di TF1, M6, France Télévisions, Canal+;
   - 61 server su IP senza dominio;
   - 43 host di restream/scraping (`raw.githubusercontent`, `mcquack`, `freem3u`, `jmp2.uk`, `6cloud.fr`…);
   - 30 voci che richiedono User-Agent/Referer simulati;
   - 6 YouTube;
   - 5 pagine web.
2. **Ricerca ufficiale** (un agente, siti delle emittenti, ARCOM/locales.tv, Wikipedia come fonte secondaria): 107 emittenti. Esito: 40 con fonte utilizzabile, 62 senza, 5 chiuse (BFM Paris, Wéo Nord-Pas-de-Calais, Wéo Picardie, Voo TV, IDF1 → 20 Minutes TV).
3. **Catalogo** (`fr-build-catalog.mjs`): entra solo un canale con almeno una fonte `verified`. Di ogni canale restano solo gli URL verificati. Gli errori restano nei report.

Campo `streams[].provenance`:

| Valore | Fonti | Significato |
| --- | ---: | --- |
| `official-page` | 40 | URL pubblicato dall'emittente; `page` = pagina ufficiale. Per 14 fonti dei cataloghi pubblici l'URL è stato ritrovato nell'HTML o nelle richieste del player in Chrome |
| `fast-distributor` | 30 | canali FAST su Amagi, Wurl o altri distributori (Trace, Sony One, Mr Bean…); non pubblicati sul sito dell'emittente |
| `public-list` | 46 | presenti solo in IPTV-org/Free-TV; flusso **non** ritrovato sulla pagina ufficiale (player in JS non ispezionabile, sito irraggiungibile o assente) |

Le fonti `public-list` sono una prova tecnica di riproduzione, non di identità editoriale confermata dall'emittente. Le ho tenute e segnalate. Se Codex preferisce un catalogo solo `official-page`, basta filtrare su questo campo.

## Esiti di riproduzione

Chrome 156 headless, player reale del sito su `http://localhost:3000`, 2 worker, avvio massimo 25 s. Osservazione di 20 s con fotogrammi decodificati, dimensioni valide e avanzamento del video.

| Report | Tentativi | Verified | Failed | Inconclusive |
| --- | ---: | ---: | ---: | ---: |
| `streams-FR.json` (cataloghi pubblici) | 128 | 94 | 30 | 4 |
| `streams-FR-official.json` (siti ufficiali) | 20 | 20 | 0 | 0 |
| `streams-FR-https-recheck.json` (TMA in HTTPS) | 1 | 1 | 0 | 0 |
| `embeds-FR-strict.json` | 18 | 6 | 0 | 12 |

I 30 fallimenti dei cataloghi pubblici sono:
- 24 errori di rete/CORS, fra cui tutti gli URL `ott.tv5monde.com`: TV5Monde FBS, Info e Style;
- 3 risposte `unavailable`, fra cui TV78 e il vecchio TVR `dvmr.fr` (HTTP 404);
- 2 errori HTTP;
- 1 accesso negato;
- ViàOccitanie e ViàATV (`myvideoplace.tv`) falliscono.

La fonte assente dalla coda HLS del primo report è l'embed di L'Équipe, provata poi nel report embed: inconclusive.

### Criterio degli embed (corretto dopo la revisione Codex)

`fr-probe-embeds.mjs` segue **lo stesso elemento `<video>`** (stesso frame e indice) ogni 2 s per l'intera finestra. Esito `verified` solo se:
- i fotogrammi decodificati sono misurati e aumentano;
- le dimensioni sono valide in ogni campione;
- il tempo avanza almeno del 60% della finestra;
- nessuna pausa supera 5 s.

Con fotogrammi non misurabili l'esito è `inconclusive`. I report con criterio debole sono conservati ma esclusi dalla costruzione del catalogo (`run.config.criteria`).

- **Embed verificati (6):** TVR (easybroadcast), TL7 (Twitch), TG+ (Kick), ASTV (Twitch), Chiconi FM-TV (Twitch), Madinina TV (StreamNexus).
- **Embed inconclusivi (12), fuori dal catalogo:**
  - tutti i Dailymotion: Télénantes, Angers Télé, TV Vendée, Lyon Capitale TV, Public Sénat, CNews, CNEWS PRIME, Ubiznews, L'Équipe. Nessun video parte nell'iframe da questa macchina né con l'URL legacy `/embed/video/` né con `geo.dailymotion.com/player.html?video=`; la causa non è dimostrata (consenso, pubblicità, autoplay);
  - TLC Cholet (Vimeo event);
  - vià93 (Infomaniak);
  - Kwezi TV (Twitch non in onda durante la prova).

## Correzioni alle segnalazioni di `france-cross-review.md`

| Segnalazione | Esito |
| --- | --- |
| FashionTV Secrets, URL Aniview con macro `[ADS.*]` | Fonte esclusa senza inventare valori (`EXCLUDED_STREAMS`). Il canale esce dal catalogo |
| Monte Carlo Digital Television, città e pin senza fonte | Città e coordinate `null`. Resta `foreign`/MC con confidenza bassa e nota esplicita |
| TV Famille, pin Le Robert fuori dalla Martinica | Città documentata in homepage (97231 Le Robert); coordinate OSM del centro abitato. La costa generalizzata a tolleranza 0.002° tagliava il borgo: l'oltremare usa ora tolleranza 0.0005° (`fr-prepare-map.mjs`, `france.json` 245 KB). Il punto ricade ora nel poligono, senza spostarlo |
| TMA, Martinica senza evidenza | `scope: unknown`, nessuna regione: né sito né fonti indicano Guadeloupe o Martinique. URL HTTP sostituito dall'equivalente HTTPS, verificato |
| MDL, URL HTTP | Nessun equivalente HTTPS risponde: fonte e canale esclusi |
| Fonti HTTP in generale | Regola nel builder: le fonti `http:` sono escluse (contenuto misto in produzione) |
| 93 fonti con `page` = IPTV-org | Ricerca automatica nell'HTML e nelle richieste del player in Chrome (`fr-provenance.json`). Campo `provenance` aggiunto a ogni fonte, con il limite dichiarato sopra |
| Pin senza provenienza numerica | Ogni pin ha `coordinatePrecision: "city-centre"` e `coordinateSourceUrl` (query OSM Nominatim filtrata per centro abitato e dipartimento). Precisione a 4 decimali |
| Sedi “assunte” (es. Africa 24 Sport, Trace Gospel) | Se la nota contiene ipotesi (assum/presum/likely…) città e pin sono rimossi e la confidenza è bassa |
| 30 fonti Wikipedia | Nuovo campo `sourceType`: 53 `primary`, 29 `secondary` (Wikipedia), 9 `none`. Non ho sostituito tutte le fonti secondarie: è una lacuna aperta |
| `fr-probe.mjs` con stato `complete` errato | Correzione di Codex mantenuta (`limited`) |
| Isole perse nei territori Natural Earth | Correzione di Codex mantenuta (contorni NE 1:50m originali) |

Escluso inoltre **RT France**: chiusa nel 2023 e soggetta alle sanzioni UE sulle trasmissioni di RT.

`node scripts/fr-validate.mjs` passa senza errori né avvisi. Controlla:
- codici mappa/regioni;
- `verifiedAt`;
- HTTP, macro e parametri firmati;
- formati;
- coerenza scope/regione;
- pin con città e fonte;
- appartenenza del pin al poligono della regione.

## Geografia

Ambiti: 34 nazionali, 14 regionali, 31 locali, 6 esteri, 6 sconosciuti. Confidenza: 22 alta, 26 media, 43 bassa. Pin: 53, tutti in centri abitati documentati.

| Regione | Codice | TV | Emittenti (città sede; L = locale) |
| --- | --- | ---: | --- |
| Auvergne-Rhône-Alpes | FR-ARA | 4 | Alpe d'Huez TV (Huez) L, BFM Lyon (Lyon) L, TG+ (Grenoble) L, TL7 (Saint-Genest-Lerpt) L |
| Bourgogne-Franche-Comté | FR-BFC | 1 | Brionnais TV L (sede non documentata) |
| Bretagne | FR-BRE | 2 | Tébéo (Brest) L, TVR (Rennes) L |
| Centre-Val de Loire | FR-CVL | 1 | BIP TV (Issoudun) L |
| Corse | FR-20R | 1 | Télé Paese L |
| Grand Est | FR-GES | 6 | BFM Alsace (Strasbourg), Canal 32 (Troyes) L, Canal Local Grosblie (Grosbliederstroff) L, Puissance TV (Saint-Dizier) L, TV7 Colmar (Colmar) L, Vosges TV (Épinal) L |
| Guadeloupe | FR-971 | 5 | ETV (Baie-Mahault), Madras FM TV, Radio TV Basse-Terre L, RHT Guadeloupe, TEVEKA |
| Hauts-de-France | FR-HDF | 5 | ASTV (Grande-Synthe) L, BFM Grand Lille (Villeneuve-d'Ascq) L, BFM Grand Littoral (Villeneuve-d'Ascq) L, ILTV L, ViaMatele (Saint-Quentin) L |
| Île-de-France | FR-IDF | 2 | 20 Minutes TV (Saint-Denis) L, Le Figaro TV Île-de-France (Paris) L |
| La Réunion | FR-974 | 2 | Antenne Réunion (Saint-Denis), CNJOI TV (Saint-Benoît) |
| Martinique | FR-972 | 6 | FUSION TV, Identité Télé Caraïbes, Madinina TV, Télé Zoukla (Saint-Joseph), TV Famille (Le Robert), Zitata TV (Schœlcher) |
| Mayotte | FR-976 | 1 | Chiconi FM-TV (Chiconi) L |
| Normandie | FR-NOR | 1 | BFM Normandie (Rouen) |
| Nouvelle-Aquitaine | FR-NAQ | 1 | Kanaldude L |
| Occitanie | FR-OCC | 1 | Littoral FM TV (Perpignan) L |
| Provence-Alpes-Côte d'Azur | FR-PAC | 6 | BFM DICI Alpes du Sud (Chorges) L, BFM DICI Haute-Provence (Chorges) L, BFM Marseille Provence (Marseille) L, BFM Nice Côte d'Azur (Nice) L, BFM Toulon Var (Toulon) L, Cannes Lérins TV L |
| Guyane, Pays de la Loire, Nouvelle-Calédonie, Polynésie française, Saint-Pierre-et-Miquelon | | 0 | nessuna fonte verificata |

- **Nazionali (separati dalle regioni, `regionCode: null`):** 4 Music, ADN TV+, Africa 24, Africa 24 Sport, BFM Business, BFM TV, BFM2, Ciné Nanar, Ciné Western, DBM TV, Emotion'L, Evandis Gospel TV, FashionTV Paris, Francophonie24, Fréquence Novelas, Handicap TV, Into Crime, Kozoom TV, Mr Bean Animated FR, NatureTime, Qwest TV, Qwest TV Jazz & Beyond, RMC Life, ScreamIN, Sony One (4 canali), Trace Caribbean, Trace Gospel, Trace Urban, Trace Vanilla Islands, TV5MONDE Chefs, TV5Monde Europe.
- **Esteri:** Africanews (CG), Euronews (BE), FIFA+ (CH), Monaco Info, Monte Carlo Digital Television, TV Monaco (MC).
- **Sconosciuti:** Caillou, Generations TV, L'intelligent TV, P2M TV, TMA, Zenith.

Sede e copertura sono distinte. I canali nazionali con sede a Parigi restano nazionali. Le reti BFM regionali hanno ID distinti perché hanno dirette diverse. I centroidi in mare di Guadeloupe e Polinesia non sono usati come pin.

## Lacune e restrizioni reali

- **France Télévisions** (France 3 e le sue edizioni regionali “ICI”, Via Stella, le nove La 1ère, franceinfo): le dirette usano URL firmati e temporanei del servizio token; da qui la pagina di France 3 non carica un flusso. Non utilizzabili senza aggirare i controlli: escluse.
- **TF1/M6/Canal+, LCI, NOVO19**: nessuna diretta libera pubblica. Le copie trovate sono restream non ufficiali, quindi scartate.
- **TV7 Bordeaux, TVPI** (pagine su sudouest.fr con controllo anti-bot) e **T18, Europe 1 TV, cnews.fr, NRJ Paris** (challenge Cloudflare): non ispezionabili in automatico, serve un controllo manuale.
- **Dailymotion**: 9 emittenti ufficiali (Public Sénat, CNews, Télénantes, Angers Télé…) restano fuori finché l'embed non è misurabile.
- **TV5Monde**: gli URL `ott.tv5monde.com` falliscono nel browser (errore di rete/CORS). Va solo TV5Monde Europe, tramite CDN ERT, marcata `public-list`.
- **Territori senza TV verificata**: Guyane (solo Télé Péyi, fallita), Nouvelle-Calédonie (siti irraggiungibili), Polynésie (TNTV fallita), Saint-Pierre-et-Miquelon, Pays de la Loire (Télénantes, Angers Télé, TV Vendée, TLC solo Dailymotion/Vimeo/YouTube).
- **Assenti dalla mappa**: Saint-Barthélemy, Saint-Martin, Wallis-et-Futuna (FR-WF).
- **Fonti geografiche**: 29 secondarie (Wikipedia) e 9 senza fonte; vanno sostituite con fonti primarie dove possibile.

## Comandi ripetibili

```sh
node scripts/fr-build-candidates.mjs                       # inventario cataloghi pubblici → reports/fr-candidates.json
node scripts/fr-probe.mjs --input reports/fr-candidates.json --output reports/streams-FR.json \
  --location "ambiente locale, posizione non verificata" --base-url http://localhost:3000 --concurrency 2 --headless
node scripts/fr-probe-embeds.mjs --input <embeds.json> --output reports/embeds-FR-strict.json \
  --location "ambiente locale, posizione non verificata" --base-url http://localhost:3000 --startup 45 --headless
node scripts/fr-check-provenance.mjs                       # → reports/fr-provenance.json
node scripts/fr-geocode.mjs                                # → reports/fr-geocode.json (Nominatim, 1 req/s)
node scripts/fr-build-catalog.mjs                          # → data/catalogs|geography|alternatives/FR.json
node scripts/fr-validate.mjs                               # controlli di coerenza
node scripts/fr-prepare-map.mjs <regions-avec-outre-mer.geojson> <ne_50m_admin_0_countries.geojson>
```

Retest indipendente previsto per Codex:

```sh
npm run test:streams -- --country FR --location "ambiente locale, posizione non verificata" --concurrency 2 --headless --output reports/retest-codex-FR.json
```

Il runner condiviso salta gli embed: i 6 embed del catalogo vanno riprovati con `fr-probe-embeds.mjs`.

## Richieste per il codice condiviso (Codex)

1. Il runner condiviso salta gli embed. Con un catalogo che li contiene, la Francia ha bisogno della misura iframe di `fr-probe-embeds.mjs`, oppure di un equivalente nel runner.
2. Valutare se la UI debba mostrare `provenance` (es. “fonte da catalogo pubblico”) o filtrare `public-list`.
3. Dailymotion: verificare nel player reale del sito, in una sessione con consenso, se gli embed partono. In caso positivo, 9 emittenti ufficiali possono rientrare.
4. Per FR-WF, Saint-Barthélemy e Saint-Martin servono geometrie, se in futuro arrivano canali.

Codex può ora leggere questo documento ed eseguire il retest.

## Controllo finale (Claude, su richiesta dell'utente al posto del retest Codex)

L'utente ha chiesto a Claude di completare il controllo della Francia prima della pubblicazione. Il server condiviso sulla porta 3000 era fermo: è stato riavviato con `npm run dev`.

- **Runner condiviso**, strumento diverso dagli script `fr-*`:
  - comando: `npm run test:streams -- --country FR --location "ambiente locale, posizione non verificata" --concurrency 2 --headless --output reports/retest-claude-FR.json`;
  - esito: **109 verified, 1 failed, 6 skipped** (gli embed, che il runner non misura).
- **Embed** con `fr-probe-embeds.mjs` e criterio a serie sullo stesso video (`reports/embeds-FR-final.json`): **6/6 verified** (TVR, TL7, TG+, ASTV, Chiconi FM-TV, Madinina TV).
- **Totale: 115 fonti verificate su 116.** L'unica fallita è ETV (Guadeloupe, Infomaniak): il browser non riesce a decodificare il video, confermato da un secondo tentativo (`reports/retest-claude-FR-etv.json`). Sulla home e su `/direct` di etv.gp il player non carica flussi né iframe: c'è solo un rimando al canale YouTube. Senza alternativa, ETV è stata **eliminata** tramite `data/excluded-channels.json` (`country: "FR"`), come richiesto dall'utente per i canali non funzionanti.
- Catalogo servito: **90 canali**, ciascuno con almeno una fonte verified.

Stato: **CONTROLLO CONCLUSO** per la pubblicazione. Le lacune elencate sopra (France Télévisions, Dailymotion, territori senza TV) restano aperte.
