# Polonia – copertura della ricerca (World TV)

Secondo passaggio eseguito il 26 novembre 2026 sui 75 candidati di `reports/pl-candidates.json`;
il file geografico contiene inoltre 13 voci territoriali ricercate nel secondo passaggio.
Il report descrive ricerca editoriale, geografica e controlli HTTP/CORS; non è un rapporto di
playback e non dichiara alcuna fonte come verificata.

## Metodo e fonti

- Sono stati consultati con `curl` HTTPS e lettura dell'HTML i siti ufficiali indicati dai
  candidati, con `Origin: http://localhost:3000`. Sono stati accettati solo manifest HLS pubblicati
  dalla pagina ufficiale o player/embed appartenenti all'emittente.
- Le fonti pubbliche di partenza sono l'API e la playlist Polonia di IPTV-org e la playlist
  Polonia di Free-TV, già registrate nel file candidati. Non sono state usate come prova
  editoriale, geografica o di playback.
- Per le concessioni e i nominativi territoriali sono state consultate le pagine KRRiT [nadawcy
  koncesjonowani i operatorzy](https://www.gov.pl/web/krrit/nadawcy-koncesjonowani-i-operatorzy),
  [wykaz koncesji i decyzji](https://www.gov.pl/web/krrit/wykaz-koncesji-i-decyzji4) e il [registro
  dei programmi televisivi](https://www.krrit.gov.pl/dla-nadawcow-i-operatorow/rejestr-programow-telewizyjnych/).
- Per i feed esteri ogni classificazione promossa a `foreign` ha operatore, paese e fonte
  espliciti. Quando la pagina del distributore non documentava operatore e sede, la voce è stata
  riportata a `unknown` con `countryCode: null`; non è stato dedotto il paese dal nome del feed.
- Per le coordinate sono stati usati URL GeoNames con ID, mai URL di ricerca. I pin rappresentano
  centri urbani approssimati, non trasmettitori né copertura RF; lo script
  `scripts/pl-research-geography.mjs` verifica con `d3-geo/geoContains` l'appartenenza al
  voivodato.
- Sono stati esclusi YouTube, restream, URL firmati o temporanei, DRM, login, geoblocco e header
  simulati. TVP, Polsat, TVN, Canal+, Pluto TV e i canali esclusi dal progetto restano fuori ambito.

## Conteggi

### Ambito editoriale

| Ambito | Canali |
| --- | ---: |
| nazionale | 27 |
| regionale | 4 |
| locale | 16 |
| estero | 6 |
| unknown | 35 |
| **totale candidati** | **88 schede incluse le 13 piste territoriali** |

Le reti nazionali con sede a Varsavia o con feed polacco non sono state trasformate in canali
regionalizzati. FILMBOX+ e Top Movies Polska sono stati riclassificati `national` sulla base
dell'operatore Kino Polska TV / SPI International. I sei feed `foreign` documentati sono CBeebies
(BBC, GB), tre feed Jukin Media (US), Viasat Explore (Viaplay Group, SE) e TOP Barca (FC
Barcelona, ES). Gli altri 35 casi precedentemente marcati esteri sono ora `unknown` con paese
nullo.

### Voci per voivodato

| Voivodato | Codice | Canali | Pin |
| --- | --- | ---: | ---: |
| Dolnośląskie | PL-02 | 4 | 4 |
| Kujawsko-pomorskie | PL-04 | 2 | 2 |
| Lubelskie | PL-06 | 0 | 0 |
| Lubuskie | PL-08 | 1 | 1 |
| Łódzkie | PL-10 | 0 | 0 |
| Małopolskie | PL-12 | 0 | 0 |
| Mazowieckie | PL-14 | 1 | 1 |
| Opolskie | PL-16 | 0 | 0 |
| Podkarpackie | PL-18 | 1 | 1 |
| Podlaskie | PL-20 | 0 | 0 |
| Pomorskie | PL-22 | 0 | 0 |
| Śląskie | PL-24 | 8 | 8 |
| Świętokrzyskie | PL-26 | 0 | 0 |
| Warmińsko-mazurskie | PL-28 | 0 | 0 |
| Wielkopolskie | PL-30 | 2 | 2 |
| Zachodniopomorskie | PL-32 | 1 | 1 |

Il file geografico contiene 88 schede (75 candidati e 13 piste territoriali) e 20 pin. Ogni pin ha `sourceUrl` ufficiale,
`coordinateSourceUrl` GeoNames con ID e ricade nel poligono del rispettivo voivodato.

### Operatori esteri riclassificati

| Canali | Operatore documentato | Paese | Fonte |
| --- | --- | --- | --- |
| CBeebies | BBC | GB | `bbc.com/aboutthebbc` |
| FailArmy Poland; People Are Awesome Poland; The Pet Collective Poland | Jukin Media | US | `jukinmedia.com` |
| Viasat Explore Classic | Viaplay Group | SE | `viaplaygroup.com/about-us` |
| TOP Barca | FC Barcelona | ES | `fcbarcelona.com/en/club/identity` |

FILMBOX+ Comedy, Festival, Hits, Love & Crime, One e Top Movies Polska non sono esteri: sono
stati ricondotti al gruppo Kino Polska TV / SPI International, con sede a Varsavia, tramite la
pagina societaria ufficiale. Le altre voci senza prova sufficiente riportano `unknown` e
`countryCode: null`, anche quando il nome commerciale suggerisce un paese.

## Nuove fonti e fonti ufficiali migliori

`reports/pl-research-sources.json` contiene 18 esiti: 5 fonti candidate e 13 piste negative.

| Emittente | Esito | Controllo HTML/HTTP |
| --- | --- | --- |
| Super Express TV | candidate_found | HLS nell'HTML ufficiale; HTTP 200, CORS `*` |
| Telewizja Biznesowa | candidate_found | HLS nel tag `source`; HTTP 200, CORS `*` |
| Telewizja Imperium | candidate_found | HLS nel video live ufficiale; HTTP 200, CORS `*` |
| Białogardzka Telewizja Kablowa | candidate_found | HLS sul dominio della cooperativa; HTTP 200, CORS `*` |
| Telewizja Toruń | candidate_found | Manifest live assegnato dal player ufficiale; HTTP 200, CORS `*` |
| TVT | no_usable_source | Player ufficiale presente, ma il manifest stabile non è esposto; URL non documentato HTTP 403 |
| Telewizja Jasło | no_usable_source | Il player espone URL firmato con scadenza/hash; escluso dalle regole |

Le risposte 200/CORS sono controlli di disponibilità HTTP e pubblicazione ufficiale, non test di
decodifica, dimensioni video o avanzamento media.

## Piste negative

- I siti ufficiali di 4 Fun, Belsat, BTB, Echo24, EWTN, NewTV, Mango, Remonty TV, Sfera TV,
  TV Asta, TVK SMNT, TVT Zgorzelec, TV Trwam, TV Okazje e W Polsce PL sono stati consultati;
  dove l'HTML mostrava solo testo “live”, player dinamico o un embed non misurabile, non è stata
  inventata una nuova sorgente tecnica.
- TVK SMNT mostra un player proprietario e anche un iframe YouTube: YouTube è stato ignorato.
- Il player di TV Jasło restituisce manifest firmati con parametri temporali; non sono stati
  copiati né dichiarati stabili.
- Per TVT il player ufficiale è raggiungibile, ma l'URL tecnico individuato risponde 403 con
  l'Origin locale; non è stato promosso.
- Per Telewizja Toruń il player ufficiale carica `smil:tvk.smil/playlist.m3u8`; il manifest è
  stato controllato direttamente con `Origin: http://localhost:3000` e ha restituito 200 con CORS
  `*`.

## Esiti territoriali per voivodato

| Voivodato | Esito della ricerca di nuove TV locali/regionali |
| --- | --- |
| Dolnośląskie | TVT Zgorzelec e TV Lubań già documentate; Telewizja Sudecka negativa (dominio non raggiungibile) |
| Kujawsko-pomorskie | TV Kujawy già documentata; Telewizja Toruń trovata con HLS/CORS |
| Lubelskie | Telewizja Lubelska negativa: dominio non raggiungibile |
| Lubuskie | TV Regionalna Żary già documentata; TV Gorzów negativa: dominio in vendita |
| Łódzkie | TV Bełchatów negativa: nessun HLS/DASH o embed ufficiale nell'HTML |
| Małopolskie | TV Małopolska negativa: HTTP 500 |
| Mazowieckie | Twoja.TV già documentata; nessuna nuova diretta locale promuovibile dal registro/pagine consultate |
| Opolskie | Telewizja Opole negativa: dominio non raggiungibile |
| Podkarpackie | Telewizja Jasło senza fonte stabile; Telewizja Podkarpacka anti-bot |
| Podlaskie | TVK Hajnówka negativa: video promozionale, nessuna diretta usabile |
| Pomorskie | TV Sopot negativa: dominio non raggiungibile |
| Śląskie | BTB, Sfera, TVT e Telewizja Imperium già documentate; nessuna nuova fonte oltre TVT negativa |
| Świętokrzyskie | ITV Kielce negativa: dominio non raggiungibile |
| Warmińsko-mazurskie | Telewizja Olsztyn raggiungibile ma senza diretta HLS/DASH o embed usabile |
| Wielkopolskie | TV ASTA e TVK SMNT già documentate |
| Zachodniopomorskie | Białogardzka Telewizja Kablowa già documentata con HLS/CORS |

## Lacune

- Non ci sono nuove fonti tecniche ufficiali promuovibili per Lubelskie, Lubuskie, Łódzkie,
  Małopolskie, Mazowieckie, Opolskie, Podkarpackie, Podlaskie, Pomorskie, Świętokrzyskie e
  Warmińsko-mazurskie. Questo è un esito della ricerca corrente, non una dichiarazione di assenza
  di emittenti.
- Molte pagine locali caricano il player via JavaScript o dietro un servizio proprietario; i casi
  senza manifest stabile o embed ufficiale non sono stati promossi. TV Republika è stata esclusa
  perché rete nazionale, come richiesto.
- Non è stato eseguito alcun test video: Claude dovrà eseguire i test indicati dal progetto e
  decidere autonomamente quali fonti passano la verifica di playback.
