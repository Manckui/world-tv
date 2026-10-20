# Orbita — Blu notte e albicocca

Variante cromatica scelta dall'utente e ora applicata al sito. Conserva la composizione Orbita e il percorso mondo → Italia → Sicilia → canale.

Pagina Figma: [Orbita · Blu notte e albicocca](https://www.figma.com/design/GrfERAHrkdfDqokEqzyqlw?node-id=26-272).

Prototipi: [desktop](https://www.figma.com/proto/GrfERAHrkdfDqokEqzyqlw?node-id=26-276&starting-point-node-id=26%3A276) · [mobile](https://www.figma.com/proto/GrfERAHrkdfDqokEqzyqlw?node-id=26-618&starting-point-node-id=26%3A618).

## Palette

| Ruolo | Colore |
| --- | --- |
| Fondo | `#111C30` |
| Pannelli | `#1C2C43` |
| Testo | `#F2EDE5` |
| Testo secondario | `#ABBBD0` |
| Oceano del globo | `#192F49` |
| Terre | `#59799A` |
| Paesi circostanti | `#20334B` |
| Confini dei Paesi circostanti | `#364C66` |
| Pin, selezione e azioni principali | `#FFA879` |
| Superficie chiara | `#F0E3D3` |

Il blu distingue la geografia dal fondo; l'albicocca richiama i punti di esplorazione e le azioni per aprire una TV. I pin ordinari hanno fondo scuro, bordo avorio e centro albicocca. Il luogo selezionato si distingue anche per dimensione e forma. Le etichette sulla terra hanno un contorno scuro.

Contrasti calcolati: testo/fondo 14,62:1; secondario/pannello 7,21:1; testo scuro/pulsante albicocca 9,03:1; bordo avorio/terra 3,90:1. L'albicocca direttamente sulla terra avrebbe 2,41:1: per questo i pin usano anche fondo scuro e bordo avorio.

## Struttura modificabile

La pagina `26:271` contiene una tavola della palette e tre sezioni:

- Globo `26:272`.
- Italia e regioni `26:1057`.
- Sicilia e TV locali `26:1313`.

| Schermata | Desktop | Mobile |
| --- | --- | --- |
| Globo | `26:276` | `26:618` |
| Italia | `26:1061` | `26:1190` |
| Sicilia | `26:1317` | `26:1402` |
| Player TV2000 | — | `26:947` |
| Player regionale | — | `26:1475` |

Sono presenti anche lo stato illustrativo senza canali (`26:1282`) e le note di navigazione. Le otto schermate principali sono state controllate con esportazioni Figma. Sono stati verificati 28 collegamenti interni, due punti di partenza del prototipo, l'assenza di font mancanti e di riferimenti alle variabili colore verdi nella nuova pagina.

La raccolta autonoma `VariableCollectionId:26:247`, denominata “Orbita · Blu notte e albicocca”, contiene 23 variabili colore. Le istanze mantengono i componenti esistenti e applicano sostituzioni cromatiche locali. I prototipi verdi originali restano conservati.

## Ambito

Questa palette è ora quella del sito, su richiesta dell'utente. I colori sono raccolti nelle variabili di `src/components/orbita/Orbita.module.scss`; `src/app/globals.scss` applica la stessa palette allo sfondo iniziale, alla selezione del testo e alle scrollbar. Hover delle azioni principali `#FFBA94`, focus avorio sui controlli della mappa e testo secondario delle schede chiare `#586171` completano gli stati del prototipo.

Sono preservati i Paesi di contesto e i pin più leggibili. La scheda chiara mobile usa `#F2EDE5`, come le schermate Figma effettive. Lint e test Orbita desktop/mobile sono passati dopo il cambio palette; gli screenshot aggiornati sono in `.impeccable/review/`. Il laboratorio mantiene il proprio stile diagnostico.

Figma dimostra la navigazione con tocchi fra schermate; non esegue streaming, rotazione o zoom continuo. I canali illustrativi e la fotografia di Roma provengono dal mockup precedente, non attestano la disponibilità attuale di una diretta. Sul sito valgono sempre il catalogo reale e le esclusioni esistenti.
