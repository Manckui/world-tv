# Francia — controllo indipendente Codex

**INCOMPLETO — controllo parziale del 20 ottobre 2026, aggiornato dopo la comparsa dei pack provvisori.**

Claude sta ancora completando la consegna nella stessa workspace. I pack sono ora presenti, mentre manca l'handoff conclusivo. Il controllo finale e il retest integrale devono partire dopo la stabilizzazione dei dati. Le verifiche descritte qui riguardano i file effettivamente presenti; non certificano la Francia pronta alla pubblicazione.

## Aggiornamento: difetti concreti dei pack provvisori

Questo aggiornamento è in sola lettura. Non sono stati corretti dati, fonti o pin di Claude mentre la sua consegna è ancora in preparazione.

Il pack corrente contiene **90 canali, 116 fonti, 90 geografie e 53 pin**. Le classificazioni sono 28 nazionali, 15 regionali, 27 locali, 14 esteri e 6 sconosciuti. Il file alternative è presente e vuoto. `reports/streams-FR-official.json` è ora concluso con **20/20 fonti verified**; il primo report degli embed contiene 11 tentativi, di cui 2 positivi e 9 inconcludenti. Il successivo retry degli embed è ancora in corso. `france-handoff.md` resta assente.

| Priorità | Record / problema | Indicazione per la consegna finale |
| --- | --- | --- |
| Bloccante per il validatore | `FashionTVSecrets.fr`: URL Aniview con 18 macro non risolte, fra cui `[ADS.APP_NAME]`, `[ADS.GDPR_CONSENT]`, `[ADS.IFA]` e `[CACHEBUSTER]` | La segnalazione è corretta: riguarda placeholder, non dimostra la presenza di un token segreto. Recuperare una fonte ufficiale stabile e provarla, oppure escludere questa fonte dal pack. Non inventare valori pubblicitari, identificatori o consensi per sostituire le macro. |
| Bloccante per il validatore | `MonteCarloDigitalTelevision.fr`: città e coordinate di Monaco ma `sourceUrl: null`; la nota dice che non c'è un indirizzo documentato | Documentare la località con una fonte primaria oppure lasciare città/coordinate nulle. Il nome “Monte Carlo” non basta a giustificare il pin. |
| Bloccante per il validatore | `TVFamille.mq`: pin Le Robert `[-60.93917, 14.6775]` fuori dalla geometria Martinique corrente | Ricontrollare fonte delle coordinate e costa generalizzata. L'esito non dimostra da solo che la città sia sbagliata: potrebbe essere un problema di approssimazione costiera. Non spostare arbitrariamente il punto solo per far passare il test. |
| Incoerenza da chiarire | `TMA.gp`: `regionCode: FR-972` (Martinique), mentre note e ID richiamano Guadeloupe e genericamente Antilles, senza sede documentata | Verificare l'area effettivamente servita sul sito dell'emittente; se manca evidenza, conservare l'incertezza invece di scegliere Martinique per supposizione. |
| Fonti primarie mancanti | 30 record geografici citano Wikipedia; alcune note ammettono sedi di gruppo “assunte”, per esempio Africa24Sport e TraceGospel | Usare i contatti dell'emittente, avvisi legali, ARCOM o altre fonti primarie per la sede. Un grado di confidenza basso non trasforma un'ipotesi in una posizione documentata. |
| Granularità delle coordinate non documentata | Nessuno dei 53 pin contiene `coordinateSourceUrl` o un'indicazione equivalente verificabile della provenienza numerica e della precisione | Specificare se si tratta di centro abitato, sede esatta o altro e citare la fonte delle coordinate; non presentare cinque decimali come accuratezza della sede. |
| Provenienza dei flussi da completare | 93 delle 116 fonti hanno come `page` solo IPTV-org API | La riproduzione verificata è una prova tecnica; aggiungere la pagina ufficiale che identifica quel flusso con quell'emittente. |
| Produzione HTTPS da ricontrollare | `MDL.fr` e `TMA.gp` usano URL HTTP | Verificare il comportamento reale su HTTPS o trovare un equivalente HTTPS pubblicato dall'emittente; un test su localhost non basta. |

`MadininaTV.mq` e il player incorporato di `TVR.fr` hanno una prova positiva nel report `embeds-FR-official.json`: non vanno segnalati come completamente privi di evidenza solo perché assenti dal report HLS. Questi due tentativi riportano effettivamente frame decodificati positivi; resta il limite generale del probe degli embed descritto più sotto.

Le regioni/collettività senza canali nel pack corrente sono **Guyane, Mayotte, Pays de la Loire, Nouvelle-Calédonie, Polynésie française e Saint-Pierre-et-Miquelon**. Questo è un conteggio del pack provvisorio, non una dichiarazione che in quelle aree non esistano TV.

### Camera: correzione minima condivisa concordata

Il codice precedente di `WorldMap.tsx` passava l'intera collezione di 21 territori a `projection.fitExtent` nella vista paese. Con gli oltremare dispersi, la Francia metropolitana risultava necessariamente sacrificata nell'inquadratura; una proiezione ortografica non può mostrare simultaneamente entrambe le metà del globo.

Correzione minima proposta e presa in carico dal responsabile del codice condiviso:

- campo opzionale `overviewRegionCodes` in `MapCountry`;
- per FR, fit della vista paese sulle sole 13 regioni metropolitane, inclusa Corsica;
- mantenere tutti i 21 territori nell'elenco e nelle geometrie; selezionando un territorio applicare il fit alla sua feature reale;
- controllare anche la visibilità dei pin dietro l'emisfero, perché la proiezione di un singolo punto non equivale automaticamente al clipping della geometria.

I 13 codici sono `FR-ARA`, `FR-BFC`, `FR-BRE`, `FR-CVL`, `FR-20R`, `FR-GES`, `FR-HDF`, `FR-IDF`, `FR-NOR`, `FR-NAQ`, `FR-OCC`, `FR-PDL`, `FR-PAC`.

Il revisore ha fermato il tentativo di acquisizione della vecchia camera durante la correzione condivisa, senza produrre screenshot validi né dichiarare un PASS visuale. La verifica definitiva della camera aggiornata resta al controllo UI dopo la modifica; nessun file condiviso è stato modificato da questo agente.

## Prima osservazione, ore 14:47 UTC

Al momento di questo controllo non esistono ancora:

- `data/catalogs/FR.json`;
- `data/geography/FR.json`;
- `data/alternatives/FR.json`;
- `docs/diagnostics/france-handoff.md`.

Sono presenti `data/regions/FR.json`, `public/maps/france.json`, i relativi crediti, gli script `fr-*`, `reports/fr-candidates.json` e `reports/streams-FR.json`. Il nuovo `reports/streams-FR-official.json` è in corso: conteneva 4 tentativi all'ultima lettura, quindi non è stato valutato come report concluso. I 101 canali ufficiali annunciati da Claude non sono ancora una consegna finale verificabile nei quattro file mancanti.

Per evitare conflitti, dopo la comunicazione di Claude sono state fermate le modifiche ai suoi dati/script. Il documento presente resta l'unico file aggiornabile dal revisore durante questa fase. Non è stato avviato il retest generico sulla Francia provvisoria: senza pack curato l'API usa i cataloghi upstream e il risultato non misurerebbe la consegna di Claude.

## Audit del primo report

Il report `reports/streams-FR.json`, terminato alle 14:11:07 UTC, contiene:

| Misura | Risultato |
| --- | ---: |
| Canali candidati | 95 |
| Fonti nella coda | 129 |
| Tentativi salvati e completati | 128 |
| Fonti `verified` | 94 |
| Fonti `failed` | 30 |
| Fonti `inconclusive` | 4 |
| Canali con almeno una fonte `verified` | 70 |
| Canali senza fonte `verified` | 25 |

Le 94 fonti con esito positivo hanno tutte evidenze compatibili con il criterio del runner: finestra osservata di almeno 20 secondi, avanzamento sufficiente, fotogrammi decodificati positivi e limiti sulle interruzioni rispettati. Questo è un controllo indipendente dell'evidenza salvata, **non una nuova prova di riproduzione**. Non prova inoltre che ogni URL corrisponda all'identità editoriale dichiarata o che sia ancora disponibile.

I 30 fallimenti sono classificati dal report come 24 `network_cors`, 1 `access_denied`, 3 `unavailable` e 2 `http`. Il luogo è correttamente dichiarato come ambiente locale con posizione non verificata; il paese del canale non è stato usato per fingere un test eseguito in Francia.

### Difetto 128/129: individuato e corretto per le esecuzioni future

La fonte assente è:

- canale `LEquipe.fr`, L'Équipe;
- formato `embed`;
- URL `https://geo.dailymotion.com/player.html?video=x2lefik`.

`scripts/fr-probe.mjs` esclude intenzionalmente gli embed dai tentativi, ma li includeva nella coda e impostava comunque `run.status: "complete"` alla fine. È stato corretto prima del congelamento: calcola `pendingSources` e assegna `limited` quando restano elementi della coda senza tentativo concluso. Il report storico di Claude è stato lasciato immutato; la sua etichetta `complete` va letta come errata per questa coda.

### Limite del probe degli embed, ancora da risolvere

`scripts/fr-probe-embeds.mjs` accetta attualmente `(best.frames === null || best.frames > 0)` per assegnare `verified`. Quindi un risultato positivo di questo script potrebbe essere privo di una misura dei fotogrammi decodificati. Inoltre confronta due campioni e non registra la continuità durante l'intervallo; l'identità del video si basa sull'indice del frame e del nodo, che può cambiare con pubblicità o navigazioni.

Il probe non è stato eseguito né modificato dal revisore. Prima di accettarne risultati come prova definitiva, richiedere frame misurati e progressione osservata dello stesso video per l'intera finestra. Un semplice HTTP 200, un evento `playing` o il caricamento dell'iframe non devono diventare `verified`.

## Audit geografico della mappa

I 21 codici del file regioni corrispondono ai 21 codici della GeoJSON, senza duplicati. Sono rappresentate le 18 regioni statistiche/amministrative utilizzate dall'INSEE e tre ulteriori territori: Nouvelle-Calédonie, Polynésie française e Saint-Pierre-et-Miquelon. Non sono quindi “21 regioni francesi” omogenee. La [carta INSEE 2026](https://www.insee.fr/fr/statistiques/fichier/8887940/pa_ind_16_4.pdf) conferma le 18 regioni e i rispettivi codici INSEE usati dalla trasformazione.

I controlli hanno rilevato geometrie non vuote, anelli chiusi e orientamento adatto a d3-geo. Corsica e le cinque regioni d'oltremare sono presenti. Le coordinate degli oltremare sono reali e non vengono spostate artificialmente accanto alla Francia metropolitana.

### Correzione effettuata: isole eliminate dalla semplificazione del globo

Le tre collettività erano copiate da `public/maps/world.json`, semplificato per una visione mondiale. Questo aveva eliminato isole intere: Saint-Pierre-et-Miquelon era ridotto a un triangolo su Miquelon, senza l'isola di Saint-Pierre.

| Territorio | Poligoni / vertici prima | Poligoni / vertici dopo |
| --- | ---: | ---: |
| Nouvelle-Calédonie | 3 / 23 | 6 / 127 |
| Polynésie française | 3 / 16 | 21 / 185 |
| Saint-Pierre-et-Miquelon | 1 / 4 | 2 / 24 |

Sono stati ripristinati i contorni originali [Natural Earth 1:50m, versione 5.1.2](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson), senza ulteriore semplificazione. Il punto rappresentativo della città di Saint-Pierre ricade ora nel poligono; tutti i 21 contorni mantengono l'orientamento corretto. La cartografia resta generalizzata alla scala della fonte, non catastale né esaustiva di ogni isolotto.

`scripts/fr-prepare-map.mjs` richiede ora il file Natural Earth originale come secondo argomento, così una rigenerazione non reintroduce il problema:

```sh
node scripts/fr-prepare-map.mjs /tmp/world-tv-fr-regions-om.geojson /tmp/world-tv-fr-ne50m-countries.geojson
```

Le prime 18 geometrie derivano da IGN Admin Express COG **edizione 2018**, distribuite da [france-geojson](https://github.com/gregoiredavid/france-geojson). Il millesimo, prima assente, è stato aggiunto ai crediti. Natural Earth è in pubblico dominio; la [documentazione del produttore](https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries-2/) chiarisce scala e distinzione dei territori.

### Limiti geografici da mantenere visibili

- Saint-Barthélemy, Saint-Martin e Wallis-et-Futuna non sono inclusi nella mappa attuale. Non dichiarare completa la copertura di tutte le collettività d'oltremare. La loro esistenza e distinzione dai DROM sono documentate nella [carta INSEE degli oltremare](https://www.insee.fr/fr/statistiques/fichier/1302192/carte_livret_25.pdf).
- I centroidi di Guadeloupe e Polynésie française cadono in mare: sono centri geometrici utilizzabili per inquadrare un arcipelago, non sedi di emittenti. Non devono diventare automaticamente pin di città.
- Adattare la camera contemporaneamente ai 21 territori dispersi dilata l'inquadratura a scala mondiale. La navigazione UI di Francia metropolitana e oltremare deve essere controllata dopo le modifiche condivise dell'interfaccia.
- Il controllo di appartenenza dei pin delle TV alle rispettive regioni resta impossibile finché manca `data/geography/FR.json`.

## Qualità dell'inventario iniziale

Il primo inventario è esplicitamente un insieme di candidati, non un catalogo curato finale. Contiene 19 canali senza sito ufficiale registrato. Include 82 record marcati FR, 5 GP, 6 MQ, 1 GF e 1 PF; Antenne Réunion è tra i record FR, perciò il solo campo paese non permette di contare la copertura territoriale.

Sono presenti fonti multiple dello stesso canale, per esempio 14 per Trace Urban: il numero di fonti non equivale al numero di emittenti o di territori coperti. Tre URL iniziali usano HTTP (`GolfPlus.fr`, `MDL.fr`, `TMA.gp`), da ricontrollare nell'origine HTTPS finale; non si può dedurre il funzionamento in produzione da un test su localhost.

Nella consegna finale occorre confrontare ogni fonte con la pagina dell'emittente e separare sede, copertura editoriale e paese. I metadati di una playlist, il suffisso `.fr` o la lingua francese da soli non dimostrano che un canale sia nazionale o locale francese. Nessun pin è stato inventato sulla base di questi indizi.

## File modificati durante questo controllo

Prima del congelamento concordato con Claude:

- `public/maps/france.json`: ripristino delle isole per i tre territori;
- `data/regions/FR.json`: ricalcolo dei centroidi dalle geometrie ripristinate;
- `public/maps/france-credits.txt`: fonte Natural Earth diretta e millesimo IGN;
- `scripts/fr-prepare-map.mjs`: rigenerazione dai contorni originali;
- `scripts/fr-probe.mjs`: stato `limited` per una coda non completamente testata.

`node --check` passa per i due script modificati. Il report storico `reports/streams-FR.json` e il report ufficiale in corso non sono stati sovrascritti. Non sono stati modificati codice condiviso, dati IT/ES, processo del server, pubblicazione GitHub o Vercel.

## Condizioni per chiudere il controllo

1. Ricevere `france-handoff.md` concluso e i pack FR definitivi; controllare ID, formati, fonti, classificazioni, sedi, coordinate e corrispondenza tra catalogo, geografia e regioni.
2. Attendere che `streams-FR-official.json` sia terminato; confrontare coda e tentativi, controllando evidenze e lacune.
3. Eseguire il retest indipendente del catalogo consegnato con il player reale:

   ```sh
   npm run test:streams -- --country FR --location "ambiente locale, posizione non verificata" --concurrency 2 --headless --output reports/retest-codex-FR.json
   ```

4. Ricontrollare le discrepanze sulle pagine ufficiali senza aggirare login, DRM o restrizioni geografiche. Distinguere ciò che funziona sul sito dell'emittente da ciò che funziona incorporato nell'app.
5. Dopo il via del responsabile UI, verificare selezione della Francia, regioni, Corsica e oltremare con i dati definitivi, quindi aggiornare questo documento a **CONTROLLO CONCLUSO** soltanto se le verifiche sono effettivamente terminate.

## Aggiornamento della UI condivisa

Codex ha aggiunto `overviewRegionCodes` al modello dei paesi: la vista Francia
inquadra le 13 regioni metropolitane, inclusa Corse. Tutti i 21 territori
restano nel catalogo regionale; la selezione di un territorio d’oltremare
usa la sua geometria e le sue coordinate reali. Verifica visuale di Francia
e Polinesia eseguita su desktop e mobile. Il test dedicato è
`scripts/check-france-map-ui.mjs`. Questo non completa il controllo dei canali.
