# World TV — alternative di design

File Figma: https://www.figma.com/design/GrfERAHrkdfDqokEqzyqlw

## A — Atlante

https://www.figma.com/design/GrfERAHrkdfDqokEqzyqlw?node-id=9-783

Composizione editoriale ispirata al riferimento akappa furniture: Archivo, fondo caldo, grande marchio, separatori sottili, mappa affiancata alla lista. Il player compatto resta visibile sulla mappa.

- Desktop 1440 × 960: `9:787`
- Mobile, esplorazione 390 × 844: `9:1039`
- Mobile, canale 390 × 844: `9:1220`

Nel prototipo mobile, Roma e TV2000 aprono la vista del canale. “Torna alla mappa” torna all'esplorazione.

## B — Orbita, prima versione verde

https://www.figma.com/design/GrfERAHrkdfDqokEqzyqlw?node-id=10-100

Ambiente scuro con toni oliva e avorio. Il globo è il centro della navigazione; player e canali occupano una colonna laterale. Su mobile, una scheda compatta permette di aprire la vista del canale.

- Desktop 1440 × 960: `10:104`
- Mobile, esplorazione 390 × 844: `10:472`
- Mobile, canale 390 × 844: `10:811`

Nel prototipo aggiornato, toccare Italia o il controllo di ingrandimento apre il livello Paese. “Guarda la diretta” sul globo mantiene l'accesso diretto all'esempio TV2000.

## Orbita — zoom geografico

Italia e regioni: https://www.figma.com/design/GrfERAHrkdfDqokEqzyqlw?node-id=18-169

Sicilia e TV locali: https://www.figma.com/design/GrfERAHrkdfDqokEqzyqlw?node-id=18-423

- Italia, desktop: `18:173`
- Italia, mobile: `18:310`
- Sicilia, desktop: `18:427`
- Sicilia, mobile: `18:539`
- Tele One, mobile: `18:631`
- Stato illustrativo per una regione senza canali: `18:407`

Percorso dimostrativo: mondo → Italia → Sicilia → Tele One. I percorsi di ritorno conservano il livello geografico. I comandi + e − collegano i livelli disponibili; il livello Paese mostra confini regionali e separa Regioni da TV nazionali.

Il comportamento previsto per il sito è zoom continuo con rotella/controlli su desktop e pinch su mobile. Figma dimostra i livelli con collegamenti fra schermate, senza una mappa runtime né un gesto pinch implementato.

La Sicilia è l'esempio del prototipo, non l'unica regione prevista. Le associazioni utilizzate vengono da `data/geography/IT.json`: Tele One / Palermo, RTP / Messina, Teleacras / Agrigento e Video Mediterraneo / Modica. I punti indicano città associate alle emittenti; non implicano raggio di ricezione o copertura.

## Ambito

La direzione attuale è [Orbita — Blu notte e albicocca](orbita-blue-variant.md), scelta dall'utente e applicata al sito. La pagina nello stesso file contiene desktop, mobile e navigazione fra globo, Italia, Sicilia e player. I mockup verdi sono conservati come versione precedente.

Si tratta di mockup con collegamenti dimostrativi fra livelli geografici desktop e mobile. Ricerca, rotazione del globo, zoom continuo, streaming, preferiti, filtri e altri controlli non sono implementati dal prototipo.

Solo l'Italia è presentata come disponibile. Non vengono inventati palinsesti, quantità di canali o garanzie di funzionamento. I preferiti sono una proposta di interfaccia.

Le schermate usano testi e mappe vettoriali modificabili, componenti riutilizzabili, 32 variabili e 6 stili di testo. Le sei schermate iniziali e le cinque aggiunte, oltre allo stato vuoto, sono state controllate tramite esportazioni Figma; il font è Archivo e non risultano font mancanti o testi vuoti. I collegamenti del percorso geografico sono stati verificati tramite lettura delle reazioni Figma.

## Risorse

- Riferimento estetico fornito dall'utente: https://www.figma.com/design/xUYKOgGGVMIP7ehcQwN32I?node-id=13-128
- Geografia: Natural Earth, `ne_50m_admin_0_countries.geojson`, https://github.com/nvkelso/natural-earth-vector
- Confini delle regioni italiane: https://github.com/openpolis/geojson-italy/blob/master/geojson/limits_IT_regions.geojson
- Foto illustrativa di Roma: https://images.unsplash.com/photo-1552832230-c0197dd311b5 . Non rappresenta il contenuto di una trasmissione.

Il progetto applicativo non è stato modificato per realizzare questi mockup.
