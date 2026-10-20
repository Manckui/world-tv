# Continuazione World TV — 20 ottobre 2026

Lavora nella stessa cartella `world-tv-lab-poc`. Leggi `AGENTS.md` e le guide
locali di Next prima di modificare codice. Mantieni React, Next, TypeScript e
SCSS, componenti semplici e commenti dove la logica è complessa.

## Richieste e direzione approvate

- Orbita blu notte e albicocca: Figma https://www.figma.com/design/GrfERAHrkdfDqokEqzyqlw?node-id=26-276 . Non ricominciare il design.
- Espansione progressiva dall'Italia: Codex prepara Spagna, Claude Francia.
- Doppio controllo: Claude verifica Spagna, Codex Francia. Solo dopo entrambi,
  creare repository pubblico GitHub e pubblicare su Vercel.
- Massimo un agente aggiuntivo per Codex. Non creare gruppi di agenti.
- Pin senza nomi permanenti nelle viste paese/regione: nome su hover, focus o
  selezione. Nel globo solo il paese selezionato ha nome e colore arancione;
  disponibili azzurri, non compilati blu scuro.
- Tolto il selettore tecnico delle fonti dal player pubblico. Dopo un errore,
  «Riprova» tenta la fonte successiva. Il Laboratorio è stato eliminato; restano gli script di test locali.
- Italiano / English nell'intestazione, paese in barra distinta sopra la mappa.
  Lingua e paese indipendenti. Sottotitolo: «Nuovi paesi da tutto il mondo,
  un po’ alla volta.», tradotto e visibile anche su mobile.

## Ultime modifiche UI (20 ottobre, pomeriggio)

- Titolo: «Accendi la TV di un altro posto.», tradotto in inglese.
- Navbar a destra e pulsante con sola bandiera che alterna IT/EN, senza bordo.
- Globo iniziale più vicino (zoom 2), testo e pulsante con 24px di margine interno.
- Nessuna cartolina/anteprima TV preselezionata: elenco completo, scheda Tutte attiva.
- Ultima richiesta sostituisce il precedente “non avviare niente”: selezionando
  un Paese parte una TV nazionale casuale, muta per consentire l'autoplay.
  Il sorteggio preferisce dirette verificate HLS/DASH ed esclude embed che richiedono Play. Player
  compatto e lista rimangono visibili su desktop; su mobile player sotto la mappa.
- Sia scelta dalla lista sia Sorprendimi centrano regione e coordinate del pin.
  Si cerca la regione geografica effettiva del punto, distinta dall'area di
  diffusione. Coordinate assenti: solo regione/Paese, mai pin inventati.
- Tutti i canali regionali sono scorrevoli, senza taglio a 3 elementi.
  Titolo, ricerca e filtri non scorrono con i risultati.
- I numeri dei pin sono TV raggruppate per città; clic su un gruppo mostra
  esattamente quei canali. La dicitura include “TV” per evitare ambiguità.
- Eliminati LabPage, TvExplorer, TestLog, CountryClock, pagina/CSS lab e hook
  della vecchia UI. Test automatici preservati da StreamTestHarness.
- Passati check-orbita-ui (1440/390/320), check-languages-ui e check-stream-runner.
  Le fixture UI/test runner non certificano la disponibilità di emittenti reali.

## Stato dei paesi

**Spagna: primo passaggio concluso.** Leggi `docs/diagnostics/spain-handoff.md`:
248 canali, 327 fonti correnti, 218 fonti verificate su 176 canali, 116 pin
con sede documentata, 19 unità territoriali. Non è copertura completa di ogni
emittente. I report originali e di recupero sono completi e conservati;
`verifiedAt` riguarda solo l'URL provato. Le alternative funzionanti sono già
integrate nel catalogo ES. Il retest indipendente di Claude `reports/retest-claude-ES.json` è completo: 327/327 fonti. Manca ancora il rapporto finale di doppio controllo.

**Francia: consegna ancora in preparazione**, secondo il messaggio di Claude
riportato dall'utente. Catalogo e geografia FR ora esistono (prima versione
di 90 canali); manca l'handoff definitivo. Claude scrive i pacchetti nella stessa cartella e sta
provando altre fonti ufficiali in `reports/streams-FR-official.json`.
Non confondere un pacchetto provvisorio con il catalogo definitivo.

Codex ha fatto un audit preliminare, salvato in
`docs/diagnostics/france-cross-review.md` con stato INCOMPLETO. Il vecchio
report ha 128 test su 129 fonti: 94 successi relativi a 70 canali. Manca il
controllo dell'embed L'Équipe. Corretto lo script che marcava complete anche
una coda parziale; il report storico è immutato. Ripristinate isole mancanti
nelle mappe d'oltremare. Il probe embed di Claude ammette frame non misurati:
non usarne il solo verdetto per certificare riproduzione.

Quando `docs/diagnostics/france-handoff.md` dichiara terminato il primo
passaggio, fare la revisione completa delle sedi/pin e il retest indipendente
in `reports/retest-codex-FR.json`, senza sovrascrivere i report di Claude.
Non modificare in parallelo i file FR mentre Claude li prepara.

## Implementazione corrente

- `src/lib/country-pack.ts`, `load-map-countries.ts`: pacchetti locali e paesi
  abilitati quando catalogo, regioni e mappa esistono. Francia predisposta.
- `src/lib/iptv.ts`: i pacchetti locali non dipendono dai download IPTV-org;
  Italia conserva il flusso esistente. Non cancellare esclusioni dell'utente.
- `src/lib/i18n.ts`, `src/components/orbita/LocaleProvider.tsx`: traduzioni
  inglesi, lingua salvata in localStorage, fallback di sessione e HTML lang.
- `OrbitaExplorer`, `WorldMap`, `ChannelList`, `PlayerPanel`: UI pubblica IT/EN.
  Nomi propri delle TV/città/regioni conservati. `/lab` e i relativi componenti sono stati eliminati.
- `docs/design/languages.md`: dettagli di lingua e selettori.
- `CONTRIBUTING.md`, issue template paese e PR template già pronti in locale.

Il server condiviso è `http://localhost:3000`. Non arrestarlo mentre vengono
eseguiti test reali. `/?stream-test=1` deve continuare a esporre il bridge del
locale `StreamTestHarness`, disponibile solo in sviluppo. Non cambiare i criteri dei test per far apparire più successi.

## Verifiche

- Lint, TypeScript e validazione ES passati dopo integrazione fonti e IT/EN.
- Regressione Orbita passata dopo la traduzione e lo spostamento del paese.
- Test dedicato `scripts/check-languages-ui.mjs`: passato; verifica indipendenza
  lingua/paese, persistenza, preferiti, player/errori e dimensioni 1440/390/320
  con canali simulati.
- `scripts/check-countries-ui.mjs`: navigazione ES/IT e pin; passato prima della
  traduzione. Mantiene le etichette italiane come default.
- `npm run build -- --webpack`: passato dopo IT/EN e integrazione ES.
  Ripetere solo se ulteriori modifiche al codice lo richiedono; resta la prova
  sul dominio pubblico prima di annunciare la disponibilità.

## Pubblicazione e community: ancora da fare

L'utente ha autorizzato GitHub pubblico e Vercel **dopo il doppio controllo**.
GitHub è connesso come Manckui; non esiste ancora una repository Git locale.
Vercel era stato suggerito ma la connessione va verificata. Non inventare URL.
Prima del deploy: verifica build, attribuzioni/licenze dei dati, file da
pubblicare ed esclusione dei report grezzi con token temporanei. La rotta
POST `/api/excluded-channels` oggi scrive senza autenticazione: rendere questa
mutazione disponibile solo nello sviluppo locale prima dell'esposizione pubblica.

L'utente chiede anche come trovare aiuto: preparare README inglese, demo breve,
issue piccole per una TV/regione, guida per non programmatori, collegamento
«Contribuisci» e messaggio di lancio con demo e repository. Non pubblicare post
social o contattare persone senza istruzione esplicita. Show HN richiede una
demo utilizzabile; non promettere «tutte le TV del mondo» finché non è vero.
