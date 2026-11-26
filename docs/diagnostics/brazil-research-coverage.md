# Brasile – copertura della ricerca (World TV)

Ricerca eseguita il 26 novembre 2026 sui 212 canali di `reports/br-candidates.json` (IPTV-org e
Free-TV) più 42 emittenti pubbliche/legislative/universitarie cercate stato per stato. È un handoff
di ricerca editoriale e geografica: non è un rapporto di playback e nessuna fonte è dichiarata
riprodotta. Il catalogo provvisorio `data/catalogs/BR.json` e i report `streams-BR*` non sono stati
toccati.

Ambiente: rete italiana. Molti siti istituzionali brasiliani (Assemblee e TV statali di GO, ES,
DF, MA, AP, RR, AM, MT, RS, PI, PE, TO, MS, PA) vanno in timeout da qui. Non è stato fatto alcun
tentativo di aggirare il blocco: quelle voci restano `no_usable_source` da ricontrollare da una
rete brasiliana.

## File consegnati

- `reports/br-research-geography.json`: 254 ID (212 candidati + 42 nuove emittenti). 68 voci con
  città documentata, 44 pin con coordinate GeoNames (`https://www.geonames.org/<id>`), tutti
  verificati con `d3-geo` `geoContains` nel poligono del rispettivo stato.
- `reports/br-research-sources.json`: 47 risultati, di cui 10 `candidate_found` (7 emittenti nuove
  e 3 fonti ufficiali migliori per candidati esistenti) e 37 `no_usable_source`.
- `scripts/br-research-crawl.mjs`: GET HTTPS semplice di home e pagine contato/expediente, con
  estrazione di indirizzi (CEP, "Cidade - UF"). Output fuori dal repository.
- `scripts/br-research-inspect.mjs`: osservazione passiva in Chrome (playwright-core,
  `channel: "chrome"`) delle richieste media fatte dalla pagina pubblica, senza cambiare header,
  cookie o geografia.
- `scripts/br-research-geography.mjs`: tabella curata → JSON, con controlli: nessuna voce
  regional/local senza `regionCode`, pin solo con `sourceUrl`, URL GeoNames con ID, pin dentro il
  poligono.

## Fonti usate

- Pagine ufficiali di contatto, "quem somos", expediente e footer delle emittenti (il campo
  `sourceUrl` conserva la pagina usata). Esempi: TV Cultura (Rua Cenno Sbrighi, São Paulo), TVE RS
  (Rua Corrêa Lima, Porto Alegre), IRDEB/TVE Bahia (Salvador), EBC (Brasília), Assemblee di SP, MG,
  RJ, BA, PE, PR, SC, AC, RO, TO, RN, MS, AL, SE, PA, CE.
- Area delle feed IPTV-org (`https://iptv-org.github.io/api/feeds.json`, codici `s/BR-xx` e città
  UN/LOCODE) solo come indizio dello stato, sempre con `confidence: "low"` e mai per città o pin.
- Coordinate: dump GeoNames `cities500` (centro urbano, non trasmettitore né copertura). La città
  viene dall'indirizzo ufficiale; per TV A Crítica, Encontro das Águas, Alese e Alepa il comune è
  ricavato dal CEP dell'indirizzo ufficiale (`confidence: "medium"`).

## Conteggi

### Ambito editoriale

| Ambito | Voci |
| --- | ---: |
| nazionale | 89 |
| regionale | 64 |
| locale | 72 |
| estero | 4 |
| unknown | 25 |
| **totale** | **254** |

Confidenza: 69 high, 62 medium, 123 low (molte web TV/FAST senza pagina istituzionale).

Regole applicate: EBC, Câmara, Senado, Justiça, Canal Gov, Futura, Canal Educação/Libras/Saúde,
reti religiose (Aparecida, Rede Vida, Gospel, RIT, Boas Novas, Pai Eterno, Evangelizar…) e
tematiche sono nazionali con `regionCode: null` anche se la sede è documentata. TV pubbliche
statali, TV delle Assembleie e affiliate sono regionali; comunitarie, comunali, universitarie e
locali sono locali. Esteri: FIFA+ (CH), Red Bull TV (AT), TV BRICS (RU), Angel TV (paese non
documentato, `countryCode: null`).

### Per stato (solo regional/local)

| Stato | Codice | Regionali | Locali | Pin | Nuove fonti `candidate_found` |
| --- | --- | ---: | ---: | ---: | --- |
| Acre | BR-AC | 2 | 0 | 1 | — (TV Aldeia confermata) |
| Alagoas | BR-AL | 1 | 1 | 1 | TV Assembleia Alagoas |
| Amapá | BR-AP | 1 | 1 | 1 | — |
| Amazonas | BR-AM | 3 | 1 | 2 | TV Encontro das Águas (embed) |
| Bahia | BR-BA | 3 | 3 | 3 | — |
| Ceará | BR-CE | 3 | 3 | 0 | TV Ceará (embed) |
| Distrito Federal | BR-DF | 1 | 2 | 2 | UnB TV (embed) |
| Espírito Santo | BR-ES | 2 | 2 | 0 | — |
| Goiás | BR-GO | 2 | 1 | 1 | TV Brasil Central, TV UFG (embed) |
| Maranhão | BR-MA | 2 | 0 | 0 | — |
| Mato Grosso | BR-MT | 3 | 0 | 0 | — |
| Mato Grosso do Sul | BR-MS | 2 | 1 | 1 | TV ALEMS |
| Minas Gerais | BR-MG | 3 | 5 | 2 | — |
| Pará | BR-PA | 4 | 1 | 3 | — |
| Paraíba | BR-PB | 2 | 1 | 0 | — |
| Paraná | BR-PR | 3 | 9 | 3 | — |
| Pernambuco | BR-PE | 3 | 2 | 1 | — |
| Piauí | BR-PI | 5 | 0 | 1 | — |
| Rio de Janeiro | BR-RJ | 1 | 9 | 4 | — |
| Rio Grande do Norte | BR-RN | 1 | 4 | 2 | TV Assembleia RN |
| Rio Grande do Sul | BR-RS | 3 | 3 | 3 | — |
| Rondônia | BR-RO | 2 | 0 | 2 | — |
| Roraima | BR-RR | 1 | 1 | 0 | — |
| Santa Catarina | BR-SC | 2 | 3 | 1 | — |
| São Paulo | BR-SP | 5 | 19 | 8 | TV Cultura (master ufficiale) |
| Sergipe | BR-SE | 2 | 0 | 1 | TV Alese |
| Tocantins | BR-TO | 2 | 0 | 1 | — |

I quattro pin di Fortaleza (Canal FDR, TV Assembleia CE, TV Ceará, TV Show) sono stati omessi: il
centro GeoNames cade fuori dal poligono costiero semplificato del Ceará. La città resta nel JSON;
il pin non è stato spostato artificialmente.

## Nuove fonti ufficiali trovate

Controllo HTTP: `curl` con `Origin: http://localhost:3000`, HTTP 200 e
`Access-Control-Allow-Origin: *` sul master. Non sono test video.

- **TV Brasil Central (GO)**: `tbc.zoeweb.tv/tbc/tbc/playlist.m3u8`, presente nella pagina live
  linkata da goias.gov.br/abc.
- **TV Alese (SE)**: `tvalese.al.se.leg.br/hls/tvalese/index.m3u8`, sul dominio dell'Assemblea.
- **TV Assembleia RN**: master logicahost incorporato nella home di al.rn.leg.br.
- **TV ALEMS (MS)**: Restreamer su `live.stream.al.ms.gov.br` (canale 1; il canale 2 dava 404).
- **TV Assembleia Alagoas**: master Wowza richiesto dal player della pagina ufficiale "Vídeo ao
  Vivo" (host di un fornitore terzo, da confermare).
- **TV Cultura (SP)**: `player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8`, richiesto dalla
  pagina ao vivo ufficiale; da preferire ai mirror del candidato.
- **Embed** (master interno con token o non esposto, quindi solo `format: "embed"`): TV Ceará
  (player jmvstream, GET diretto 400 e nessun video in Chrome headless: da provare nel runner),
  UnB TV e TV UFG (eduplay RNP; TV UFG sostituisce la sorgente http del candidato),
  TV Encontro das Águas (embed samcast ufficiale; il master del candidato risponde 403).

Conferme senza nuova voce: TV Aldeia (embed samcast ufficiale = HLS del candidato, 200 + CORS),
TV Câmara (`stream3.camara.gov.br` nella pagina ufficiale), TV UFOP (`app.tvufop.com.br`
nella home ufficiale, 200 + CORS), TV Brasil, Canal Gov, Canal Educação (domini EBC, 200 + CORS),
TVE RS (procergs :8443, 200 + CORS), Rede Minas (zoeweb, 200 + CORS).

## Piste negative

- **Solo YouTube** (escluso dall'utente): TV Senado, TV Justiça, TV Alesp, TV ALMG, TV Alepe,
  TV Alepa, TV Assembleia PR, TV Alesc, TV Aleac, TV Alero, TV Assembleia TO, TV ALBA, Rádio e TV
  UFRR. TV Alerj e Canal Futura: nessun player live trovato.
- **Fonti non accettabili**: TVE ES usa vdo.ninja (WebRTC, non HLS/DASH); TVU UFPE espone solo
  http su IP; TV Cultura do Pará solo http e sito in timeout; Aperipê incorpora il feed TV Cultura,
  non un feed proprio.
- **TVE Bahia**: le pagine IRDEB non hanno diretta e gli stream del candidato
  (`streaming.procergs.com.br/tve/stve`) sono di TVE RS: il candidato TVEBahia.br va corretto.
- **SIC TV**: sede ufficiale Porto Velho (RO), ma lo stream del candidato (`parecisfmlive`) non
  sembra appartenere a SIC TV.
- **TV Assembleia PB**: la pagina ufficiale cita `tv.al.pb.leg.br/hls/tvalpb.m3u8`, ma il server
  va in timeout dall'Italia; non promosso.
- **TV Assembleia CE e PI**: master del candidato 503/403 al controllo; le pagine ufficiali non
  erano raggiungibili per cercare un'alternativa.
- Globo, SBT, Record, Band, RedeTV e Pluto TV non sono stati cercati come nuove fonti.

## Lacune residue

- 25 voci `unknown` (web TV senza alcuna pagina ufficiale con sede: Auge TV, Bem Melhor,
  Canal START, Demais TV, EUTV, Lider TV, Rede RC, TV Destak, TV Futuro, TV Mon, TVideoNews…).
- 123 voci a bassa confidenza: per molte locali lo stato viene solo dall'area IPTV-org o dal nome
  del canale (TV Petrópolis, Canal 25 Jundiaí, TV Pantanal MS…) e non hanno città né pin.
- 186 voci prive di città documentata; i 44 pin coprono 21 stati su 27 (nessun pin in CE, ES, MA,
  MT, PB, RR).
- Stati senza nuova fonte pubblica usabile: AC (solo TV Aldeia già candidata), AP, BA, ES, MA, MT,
  MG, PA, PB, PE, PI, PR, RJ, RO, RR, RS, SC, TO. Per molti il motivo è il timeout dall'Italia, non
  l'assenza della diretta: va ripetuto da rete brasiliana prima di concludere.
- Nessuna voce di questa ricerca deve ricevere `verifiedAt`: serve il test di playback reale
  (soprattutto per gli embed TV Ceará, UnB TV, TV UFG ed Encontro das Águas).
