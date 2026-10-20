# Secondo controllo indipendente: Claude verifica la Spagna

Codex sta completando la Spagna e poi controllerà la Francia. Prima completa
il tuo incarico Francia (`CLAUDE_FRANCIA.md`) e scrivi il relativo handoff.
Non avviare il controllo finale della Spagna finché
`docs/diagnostics/spain-handoff.md` non dichiara il primo passaggio concluso:
prima di quel momento catalogo e recuperi sono ancora in lavorazione.

L'utente vuole un massimo di un agente aggiuntivo, non gruppi di agenti.

## Obiettivo

Controlla la Spagna in modo indipendente, senza assumere che gli esiti di Codex
siano corretti. Il sito usa React, Next.js, TypeScript e SCSS; leggi AGENTS.md.
Il server di sviluppo condiviso è `http://localhost:3000`.
Non arrestarlo e non modificare file condivisi mentre Codex verifica la Francia.

1. Leggi catalogo, geografia, regioni, mappa, report e handoff ES.
2. Esegui una nuova riproduzione di **ogni fonte corrente** con il player reale:

   ```sh
   npm run test:streams -- --country ES --location "ambiente locale, posizione non verificata" --concurrency 2 --headless --output reports/retest-claude-ES.json
   ```

   Indica la posizione reale solo se la conosci. Non dedurla dal paese del canale.
   Mantieni osservazione di 20 secondi, fotogrammi decodificati, avanzamento del
   video e dimensioni valide. HTTP 200 o manifest valido non bastano.
   Non sovrascrivere `streams-ES.json` né altri report precedenti.
3. Per le discrepanze controlla il sito ufficiale dell'emittente, documenta
   pagina e data, prova eventuali alternative pubbliche. Non aggirare DRM,
   autenticazione, blocchi geografici o restrizioni dei player. Non salvare URL
   firmati temporanei come fonti stabili. Gli embed non misurabili restano da
   verificare, anche se la pagina si carica.
4. Verifica tutte le 17 comunità autonome e le città autonome Ceuta e Melilla:
   corrispondenza dei codici fra GeoJSON, regioni e canali; assenza di regioni
   perse; numero dei canali; nazionali separati dai regionali/locali.
5. Controlla città/provincia e pin usando le fonti citate. Le coordinate sono
   centri cittadini approssimativi della sede, non torri trasmittenti. Niente
   assegnazioni ricavate solo dal nome del canale. Una sede nazionale in Madrid
   non rende il canale una TV regionale di Madrid.
6. Prova dal browser desktop e mobile: selezione Spagna, passaggio tra paesi,
   zoom nelle regioni e isole, pin, ricerca, TV nazionali, player e link ufficiali.
   Non confondere la verifica dell'interfaccia con la verifica delle dirette.
7. Registra ogni difetto con evidenza e correzione proposta. Puoi correggere i
   soli file ES elencati sotto, conservando i report storici. Comunica i difetti
   dei file condivisi a Codex nel documento, senza modificarli in parallelo.

## File di tua competenza durante questa verifica

- `data/catalogs/ES.json`, `data/geography/ES.json`, `data/alternatives/ES.json`
- `data/regions/ES.json`, `public/maps/spain.json`, `public/maps/spain-credits.txt`
- `reports/retest-claude-ES.json` e relativo CSV
- `docs/diagnostics/spain-cross-review.md`

Non cambiare file IT, codice condiviso, report di Codex, server o dipendenze.
Non creare repository, commit o deploy: questa fase sarà eseguita da Codex
**dopo** il completamento di entrambe le verifiche.

## Consegna

Scrivi `docs/diagnostics/spain-cross-review.md` con:

- data, ambiente e configurazione del nuovo test;
- conteggi di fonti/canali verificati, falliti, inconcludenti e saltati;
- confronto con i precedenti risultati, distinguendo variazioni temporanee;
- problemi geografici e correzioni, fonti ufficiali, lacune residue;
- esito desktop/mobile e aspetti non verificati;
- stato esplicito: `CONTROLLO CONCLUSO` oppure `CONTROLLO INCOMPLETO`, con motivazione.

Un risultato di playback negativo documentato non va mascherato né promosso.
Il controllo è concluso quando tutto il catalogo corrente è stato esaminato,
le incongruenze sono risolte o chiaramente documentate e i report sono salvati.
Segnala infine a Codex che può leggere questo documento e il tuo handoff Francia.
