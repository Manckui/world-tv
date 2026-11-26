# Germania – copertura della ricerca (World TV)

Ricerca eseguita il 26 novembre 2026 sui 188 canali presenti in `reports/de-candidates.json`.
Il report corrente contiene quindi otto voci in più rispetto alle 180 indicate nel documento di
stato del 13 novembre. Questo handoff descrive ricerca editoriale e geografica; non è un rapporto
di playback e non dichiara alcuna fonte come riprodotta.

## File consegnati

- `reports/de-research-geography.json`: 191 ID: i 188 candidati più le tre nuove emittenti MSA;
  85 sedi/città ricavate da Impressum o contatti pubblici, 34 pin con coordinate di centro
  urbano e URL GeoNames, verificati dentro il poligono del rispettivo Land con `d3-geo`.
- `reports/de-research-sources.json`: sette risultati di ricerca: quattro fonti HLS primarie per
  canali candidati e tre emittenti locali nuove senza sorgente usabile.
- `scripts/de-research-geography.mjs`: script ripetibile per costruire la geografia e controllare
  che ogni pin cada nel Land dichiarato.

## Fonti usate

- Impressum, Kontakt e pagine istituzionali dei singoli broadcaster, scaricati con GET HTTPS
  semplice tramite `scripts/de-research-impressum.mjs`; il campo `sourceUrl` conserva la pagina
  usata per la sede.
- ARD/Das Erste: [diretta ufficiale](https://www.daserste.de/live/index.html), da cui l’HTML
  espone il master HLS `daserste-live.ard-mcdn.de`.
- BR/ARD-alpha: [pagina ufficiale ARD-alpha](https://www.br.de/fernsehen/ard-alpha/), da cui
  è stato raccolto il master HLS BR.
- BR Fernsehen: [diretta BR](https://www.br.de/mediathek/live), con master ufficiale `bfs_sued`.
- hr-fernsehen: [diretta hr](https://www.hr-fernsehen.de/livestream/index.html), con master
  ufficiale `hr-live.ard-mcdn.de`.
- Elenchi e pagine di riferimento delle Landesmedienanstalten consultati per il controllo delle
  emittenti locali e dei Bürgermedien: [BLM](https://www.blm.de/), [LFK](https://www.lfk.de/),
  [SLM](https://www.slm-online.de/), [mabb](https://www.mabb.de/),
  [MA HSH](https://www.ma-hsh.de/), [NLM](https://www.nlm.de/),
  [TLM](https://www.tlm.de/) e [MSA](https://www.msa-online.de/).
- Per le coordinate: ricerca [GeoNames](https://www.geonames.org/) del comune documentato;
  le coordinate sono approssimazioni di centro urbano, non trasmettitori né copertura RF.

## Conteggi

### Ambito editoriale

| Ambito | Canali |
| --- | ---: |
| nazionale | 93 |
| regionale | 30 |
| locale | 65 |
| estero | 2 |
| unknown | 1 |
| **totale** | **191** |

I canali pubblici nazionali, i tematici, gli shopping e le edizioni nazionali sono stati tenuti
nazionali anche quando l’Impressum indica una città. Le terze reti ARD e le edizioni di Land sono
state trattate come regionali; OK, Bürgerfernsehen e TV locali come locali. `SRF.de` è estero CH,
`catalog:DE:btltvnetherlands` è estero NL.

### Sedi per Land

Conteggio dei canali con `regionCode` assegnato alla sede o all’area editoriale; i nazionali e gli
esteri non entrano nella tabella.

| Land | Codice | Canali |
| --- | --- | ---: |
| Baden-Württemberg | DE-BW | 8 |
| Bayern | DE-BY | 17 |
| Berlin | DE-BE | 3 |
| Brandenburg | DE-BB | 2 |
| Bremen | DE-HB | 1 |
| Hamburg | DE-HH | 5 |
| Hessen | DE-HE | 5 |
| Mecklenburg-Vorpommern | DE-MV | 1 |
| Niedersachsen | DE-NI | 2 |
| Nordrhein-Westfalen | DE-NW | 4 |
| Rheinland-Pfalz | DE-RP | 8 |
| Saarland | DE-SL | 4 |
| Sachsen | DE-SN | 8 |
| Sachsen-Anhalt | DE-ST | 17 |
| Schleswig-Holstein | DE-SH | 5 |
| Thüringen | DE-TH | 3 |

## Nuove fonti ufficiali trovate

- **Das Erste**: il master HLS è letteralmente presente nella pagina live ARD. La richiesta con
  `Origin: http://localhost:3000` ha restituito HTTP 200 e `Access-Control-Allow-Origin: *`.
- **ARD-alpha**: il master HLS BR è presente sulla pagina ufficiale ARD-alpha. La richiesta con
  lo stesso Origin ha seguito un redirect e restituito HTTP 200 con CORS `*`.
- **BR Fernsehen** e **hr-fernsehen**: master HLS presenti nelle rispettive pagine live ufficiali;
  entrambi hanno risposto HTTP 200 con CORS `*`.
- **Nuove emittenti censite dalla MSA**: HDL TV, TV Halle e TV-D Fernsehen Ditfurt risultano
  nell’elenco ufficiale dei Fernsehveranstalter locali; le loro pagine non hanno fornito un
  manifest HLS/DASH o embed pubblico utilizzabile, quindi sono state registrate come
  `no_usable_source`.

Questi sono controlli HTTP/CORS del master, non test del player o dei fotogrammi; il test video
resta esplicitamente demandato a Claude come richiesto dall’incarico.

## Piste negative

- Le pagine delle autorità regionali sono utili per gli elenchi degli operatori, ma molte non
  pubblicano un manifest: l’esistenza dell’autorizzazione non equivale a una diretta web usabile.
- Le fonti ZDF/Akamai incontrate nei candidati hanno risposto 403 in una richiesta con Origin in
  questo ambiente; non sono state promosse a nuova fonte ufficiale e non sono state dichiarate
  verificate.
- Per diversi OK/Bürgerfernsehen e canali locali il sito è raggiungibile ma l’HTML non espone una
  diretta stabile; sono rimasti nel catalogo di ricerca senza inventare URL o player.
- Per Cira TV non è stata trovata una prova ufficiale sufficiente per il Land: è stata portata a
  `scope: "unknown"`, invece di lasciare un’emittente locale senza `regionCode`.
- Sono state ignorate le fonti fuori ambito indicate dall’incarico: RTL, ProSieben, Sat.1, VOX,
  Sky, Pluto TV, RT DE e gli ID esclusi dal progetto.

## Lacune residue

- 106 voci non hanno una città abbastanza certa nell’HTML pubblico consultato; 157 voci non hanno
  un pin perché la sede non era documentabile o il canale è nazionale/estero. In questi casi il
  JSON lascia coordinate nulle, senza usare il capoluogo come ripiego.
- Le 34 coordinate presenti sono controllate topologicamente e ora usano URL GeoNames con ID
  stabile; resta necessario il controllo umano della distinzione tra sede legale e redazione prima di una pubblicazione
  definitiva.
- L’inventario delle Landesmedienanstalten non è una prova di disponibilità continua: mancano
  ancora controlli sistematici delle pagine live dei singoli operatori e, soprattutto, i test di
  playback reale. Nessuna voce di questa ricerca deve quindi ricevere `verifiedAt` da qui.
