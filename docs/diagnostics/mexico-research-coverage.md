# Messico – copertura della ricerca (World TV)

Secondo giro di ricerca eseguito il 26 novembre 2026 sui 151 canali di
`reports/mx-candidates.json`. Il report geografico contiene 154 ID: i 151 candidati più le
quattro fonti ufficiali aggiunte nel corso dei due giri. Questo handoff descrive ricerca
editoriale, geografica e HTTP/CORS; non è un rapporto di playback e non dichiara alcuna fonte
come verificata.

## Metodo e fonti

- Per ogni voce ancora `unknown` sono stati cercati il dominio ufficiale, `contacto`, `contact`,
  `aviso de privacidad` e, quando mancava un sito affidabile, il nominativo/concessionario IFT.
  Le otto voci rimaste unknown spiegano nel campo `notes` cosa è stato cercato e perché la prova
  non è bastata.
- Per i sistemi pubblici statali e le reti nazionali è stato eseguito un controllo HTML con
  `curl` HTTPS e `Origin: http://localhost:3000`. Sono registrate anche le pagine ufficiali che
  non hanno esposto un manifest HLS/DASH o un embed pubblico usabile.
- Le fonti positive sono state mantenute solo quando la diretta era pubblicata dalla pagina
  ufficiale: Sistema Michoacano, Telemax Sonora, Canal 22 e Canal 44. I manifest HLS di Sistema
  Michoacano e Telemax hanno risposto HTTP 200 con `Access-Control-Allow-Origin: *`; Canal 22 e
  Canal 44 espongono iframe ufficiali. Questo non equivale a playback verificato.
- Per le coordinate sono stati usati URL GeoNames con ID, mai URL di ricerca. I pin rappresentano
  centri urbani approssimati, non trasmettitori né copertura RF.

## Conteggi

### Ambito editoriale

| Ambito | Canali |
| --- | ---: |
| nazionale | 42 |
| regionale | 76 |
| locale | 12 |
| estero | 14 |
| unknown | 10 |
| **totale** | **154** |

Le TV universitarie, comunali e territoriali sono locali quando la sede o l’area è documentata;
i sistemi statali e le edizioni regionali sono regionali. I network tematici senza stato
documentabile sono nazionali o esteri secondo il sito ufficiale, non secondo il nome del canale.

### Voci per stato

| Stato | Codice | Canali |
| --- | --- | ---: |
| Aguascalientes | MX-AGU | 2 |
| Baja California | MX-BCN | 4 |
| Baja California Sur | MX-BCS | 4 |
| Campeche | MX-CAM | 2 |
| Chiapas | MX-CHP | 4 |
| Chihuahua | MX-CHH | 4 |
| Ciudad de México | MX-CMX | 2 |
| Coahuila | MX-COA | 6 |
| Colima | MX-COL | 2 |
| Durango | MX-DUR | 1 |
| Estado de México | MX-MEX | 2 |
| Guanajuato | MX-GUA | 9 |
| Guerrero | MX-GRO | 0 |
| Hidalgo | MX-HID | 0 |
| Jalisco | MX-JAL | 7 |
| Michoacán | MX-MIC | 5 |
| Morelos | MX-MOR | 0 |
| Nayarit | MX-NAY | 2 |
| Nuevo León | MX-NLE | 3 |
| Oaxaca | MX-OAX | 2 |
| Puebla | MX-PUE | 5 |
| Querétaro | MX-QUE | 1 |
| Quintana Roo | MX-ROO | 4 |
| San Luis Potosí | MX-SLP | 1 |
| Sinaloa | MX-SIN | 3 |
| Sonora | MX-SON | 5 |
| Tabasco | MX-TAB | 2 |
| Tamaulipas | MX-TAM | 0 |
| Tlaxcala | MX-TLA | 1 |
| Veracruz | MX-VER | 1 |
| Yucatán | MX-YUC | 0 |
| Zacatecas | MX-ZAC | 4 |

## Revisione delle 53 voci unknown

Sono rimaste unknown soltanto dieci voci:

- `ConectaTV.mx`: nessuna corrispondenza istituzionale univoca dopo ricerca di dominio,
  contatti, privacy e concessione IFT.
- `RadioyTelevisionCrisoldelaAlegria.mx`: emittente religiosa; sito e pagine istituzionali non
  indicano uno stato con sufficiente certezza.
- `catalog:MX:tele6`: denominazione generica; nessun dominio o concessionario univoco.
- `catalog:MX:nrt4monclova`: il nome suggerisce Monclova, ma non è stata trovata una pagina
  ufficiale o una concessione IFT puntuale.
- `TELE4Ojocaliente.mx`: il nome suggerisce Ojocaliente, ma non è stata trovata una pagina
  ufficiale o una concessione IFT puntuale.
- `TVIndependencia.mx`: il sito e la pagina En Vivo sono ufficiali, ma non documentano stato e
  ambito; l’iframe tecnico non è stato usato come prova geografica.
- `TVLibertad.mx`: dominio raggiungibile, ma contatti/privacy/IFT non provano lo stato.
- `TVLobo.mx`: nessuna identità universitaria o statale univoca dopo la ricerca istituzionale.
- `UMTV.mx`: sito consultato, ma nessuna prova statale univoca in contatti/privacy/IFT.
- `XHGV-TDT`: nessuna corrispondenza pubblica univoca per il nominativo IFT.

Le altre 43 voci sono state ricondotte a stato, ambito nazionale o paese estero tramite pagine
ufficiali, contatti/privacy o identità territoriale esplicita: Canal 13, Multimedios, TV Cuatro,
TV Mar, PSN, RCG, TVP, emittenti universitarie e sistemi pubblici statali.

## TV pubbliche dei 32 stati e reti nazionali

`reports/mx-research-sources.json` contiene 41 esiti: 4 `candidate_found` e 37
`no_usable_source`. Sono presenti controlli dedicati per tutti i 32 stati, più Canal del Congreso,
Canal Once, TV UNAM, Canal Catorce/SPR e Ingenio TV.

### Fonti ufficiali trovate

- **Sistema Michoacano de TV**: HLS ufficiale `https://s5.mexside.net:1936/enlinea/enlinea/playlist.m3u8`,
  HTTP 200 e CORS `*`.
- **Telemax Sonora**: HLS ufficiale `https://s5.mexside.net:1936/telemax/telemax/playlist.m3u8`,
  HTTP 200 e CORS `*`.
- **Canal 22 Nacional**: iframe del player presente nell’HTML ufficiale.
- **Canal 44 UdeG**: iframe del player presente nell’HTML ufficiale.

### Esiti negativi

Per i 37 esiti negativi sono state conservate pagina ufficiale, pagina live/istituzionale e
motivo: HTML senza manifest o embed pubblico, dominio in timeout/non raggiungibile, oppure fonte
tecnica già presente ma non nuova. Tra i casi controllati: Ser TV Aguascalientes, IERT BCS,
TRC Campeche, RTV Chiapas, Canal 28 Chihuahua, Capital 21, TV Coahuila, TV Mexiquense, TV4,
RTG Guerrero, Radio y TV de Hidalgo, C7 Jalisco, TV UJAT, IMRyT Morelos, Nayarit Comunica,
Canal 53 UANL, CORTV Oaxaca, SICOM, RTQ, SQCS, TV pública SLP, TV UAS, Tabasco TV,
TV Tamaulipas, Canal 9 Tlaxcala, RTV Veracruz, TV Yucatán, SIZART, Canal del Congreso,
Canal Once, TV UNAM, Canal Catorce e Ingenio TV.

UACJ-TV è stato annotato come negativo anche se il suo HTML contiene un URL HLS: la richiesta con
Origin locale ha restituito HTTP 404 con CORS `*`, quindi non è stato promosso a sorgente usabile.

## Pin e lacune residue

Il secondo giro porta i pin da 12 a 40, soprattutto per sistemi statali, università ed emittenti
locali con città esplicitamente documentata. Ogni pin ha `sourceUrl`; ogni
`coordinateSourceUrl` è un URL GeoNames con ID e non una ricerca.

Restano senza voce regionale/local documentata Guerrero, Hidalgo, Morelos, Tamaulipas e Yucatán:
le relative pagine istituzionali sono state cercate e registrate come esiti negativi, ma non è
stata inventata una classificazione geografica dai soli nomi.

Nessun manifest è stato dichiarato verificato: i controlli effettuati sono esclusivamente HTML,
HTTP/CORS e topologia geografica. Sono stati esclusi restream, URL firmati o temporanei, header
falsificati, DRM, login, geoblocco e YouTube.
