# Spagna — consegna per il controllo indipendente

Data: 20 ottobre 2026.

**PRIMO PASSAGGIO CONCLUSO. Il catalogo ES è pronto per il doppio controllo di Claude.**

Questo stato indica che le fonti del catalogo corrente sono state esaminate,
non che tutte le televisioni spagnole siano censite o funzionanti.
Seguire `CLAUDE_DOPPIO_CONTROLLO.md`. Codex verificherà la Francia quando sarà
presente la relativa consegna. GitHub pubblico e Vercel vengono dopo entrambi
i controlli.

## Catalogo consegnato

- 248 canali, 327 fonti HLS.
- 218 fonti con riproduzione verificata; 176 canali con almeno una fonte verificata.
- 72 canali senza una fonte verificata: i fallimenti non sono stati nascosti.
- 116 canali con pin documentato; dove manca una sede verificata, nessuna coordinata inventata.
- Tutte le 17 comunità autonome e le 2 città autonome sono presenti nella mappa.

I numeri descrivono prove del 20 ottobre, non una garanzia di disponibilità
futura o da altri paesi. Posizione del tester: **ambiente locale, posizione non
verificata**. Non dedurre la posizione dall'orario Europe/Rome.

## Evidenze di riproduzione

Chrome headless 156, player reale del sito su `http://localhost:3000`,
due worker per esecuzione, avvio massimo 20 secondi e osservazione di 20 secondi
con fotogrammi decodificati, dimensioni valide e avanzamento del video.

| Report locale | Fonti | Verificate | Fallite | Inconcludenti |
| --- | ---: | ---: | ---: | ---: |
| `reports/streams-ES.json` | 296 | 190 | 101 | 5 |
| `reports/retest-official-recovery-ES.json` | 41 | 28 | 12 | 1 |

Il secondo report comprende 33 alternative e gli 8 canali aggiunti dopo
l'avvio del primo test. Sono entrate nel catalogo solo le 23 alternative
nuove che hanno superato il test; le altre 5 prove riuscite riguardano nuovi
canali già inseriti. I candidati alternativi falliti rimangono nel report.
Ogni fonte delle 327 correnti è coperta da uno dei due report.

`verifiedAt` è valorizzato solo per l'URL esatto verificato. All'interno di
ogni canale, le fonti verificate precedono le altre. I report originali sono
conservati; non sostituirli con quelli della revisione.

## Provenienza e geografia

Base di ricerca: catalogo [TDTChannels](https://www.tdtchannels.com/catalogo/television/).
Le pagine ufficiali di 240 canali iniziali e 116 voci ulteriori sono state
esaminate per cercare alternative. Dove trovato, `streams[].page` indica il
player ufficiale. Non tutte le fonti del catalogo iniziale sono state
riconfermate su una pagina ufficiale: la provenienza TDTChannels resta esplicita.

Dettagli delle sedi e relative fonti:
[`spain-geography.md`](spain-geography.md) e `data/geography/ES.json`.
Questo file contiene anche 5 voci di ricerca non ancora nel catalogo:
non contarle come canali disponibili. Le coordinate sono centri cittadini
approssimativi delle sedi, non trasmettitori o aree di ricezione.
I nazionali mantengono `regionCode: null`, anche quando hanno una sede nota.

Confini: IGN/CNIG via geoBoundaries, attribuzioni e trasformazioni in
`public/maps/spain-credits.txt`. Canarias, Ceuta e Melilla sono mantenute nelle
posizioni reali. Nessun pin è collocato nella capitale solo per riempire la mappa.

## Copertura regionale e lacune

| Regione | Canali associati | Con una fonte verificata |
| --- | ---: | ---: |
| Andalucía | 74 | 54 |
| Aragón | 1 | 0 |
| Asturias | 1 | 1 |
| Canarias | 18 | 16 |
| Cantabria | 4 | 4 |
| Castilla y León | 3 | 1 |
| Castilla-La Mancha | 11 | 7 |
| Catalunya | 43 | 24 |
| Ceuta | 0 | 0 |
| Comunidad de Madrid | 7 | 7 |
| Comunitat Valenciana | 26 | 15 |
| Extremadura | 5 | 5 |
| Galicia | 14 | 14 |
| Illes Balears | 2 | 2 |
| La Rioja | 2 | 0 |
| Melilla | 1 | 0 |
| Navarra | 2 | 2 |
| País Vasco / Euskadi | 19 | 12 |
| Región de Murcia | 5 | 3 |

Questi conteggi riguardano le associazioni territoriali; non comprendono le
reti nazionali. La copertura è parziale e non va presentata come esaustiva.

- **Ceuta:** CeutaPlay mostra una limitazione geografica nell'ambiente
  esaminato. Nessuna diretta continua incorporabile verificata su RTVCE.
  Regione presente con stato vuoto.
- **Aragón:** il player pubblico Aragón Play usa URL firmati temporanei.
  La fonte stabile candidata di Aragón TV Internacional non ha superato il test.
- **Asturias:** la presenza di un canale verificato non include TPA7.
  Il player TPA espone URL firmati con restrizioni; non sono stati importati.
- **Castilla y León:** La 7 e varie edizioni provinciali La 8 usano percorsi
  `fmt_token` temporanei; non salvarli come fonti stabili.
- **TV3 Internacional:** feed distinto dalla TV3 domestica, ricavato
  dall'API ufficiale 3Cat. Non attribuire il suo esito alla versione domestica.
- **101TV Málaga:** osservato il player ufficiale con firma temporanea.
  La riproduzione della pagina ufficiale non prova il funzionamento
  dell'URL diretto conservato nel catalogo.
- **Navarra TV, Melilla e IB3:** individuati anche player ufficiali esterni,
  ma non sono stati aggiunti embed non misurati come dirette verificate.
- Il vecchio `scripts/probe-embeds.mjs` non applica tutte le condizioni del
  runner corrente. Non usarne da solo un esito positivo per certificare un embed.

Non sono stati aggirati login, DRM, restrizioni territoriali, CORS o controlli
del player. HTTP 403 e status 0 non identificano da soli la causa del problema.
La verifica automatica della riproduzione non sostituisce il controllo visivo
dell'identità e della programmazione del canale.

## Interfaccia e controlli

Sono passati lint, TypeScript, validazione dei pacchetti e i controlli browser
`scripts/check-orbita-ui.mjs` e `scripts/check-countries-ui.mjs` su desktop
1440×960 e mobile 390×844 / 320×740.

La verifica copre cambio paese, 19 regioni ES / 20 IT, zoom, isole, ricerca,
preferiti, player ed errori. Nomi dei pin solo all'interazione; nel globo
nome del paese selezionato, disponibile azzurro, selezionato arancione,
non compilato blu scuro.

Ultima modifica richiesta: eliminato il selettore tecnico della fonte nel
player Orbita. Dopo un errore, «Riprova» tenta l'alternativa successiva.
Il laboratorio e il runner continuano a verificare ogni URL separatamente.
Menu paese e ricerca riallineati; focus discreto solo per navigazione tastiera.

Aggiornamento UI successivo: Italiano / English nell'intestazione; paese in
una barra separata. `scripts/check-languages-ui.mjs` e
`npm run build -- --webpack` sono passati. Il cambio lingua non altera il
paese, i preferiti o il runner. Resta da completare la prova su dominio Vercel:
gli esiti localhost non garantiscono che un'emittente accetti il nuovo dominio.
