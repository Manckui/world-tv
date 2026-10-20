# Lingua e paese

La lingua dell'interfaccia e il paese esplorato sono scelte indipendenti.
La navigazione desktop è allineata a destra. Accanto compare solo la bandiera
della lingua corrente, senza etichetta visibile, bordo o menu. Un clic alterna
italiano e inglese. Il pulsante ha un'area attiva di 44 px e un nome accessibile
che descrive la lingua di destinazione. La barra
immediatamente sopra la mappa contiene l'etichetta «Paese da esplorare» e
il selettore dei paesi attualmente abilitati.

`src/lib/i18n.ts` conserva le traduzioni inglesi della copia italiana e
l'interpolazione dei valori. `LocaleProvider` distribuisce la lingua e la
salva in `world-tv:language`, con fallback in memoria se localStorage non è
disponibile. Il server parte in italiano; il client applica la preferenza
salvata senza differenze di hydration. L'attributo HTML `lang` segue la scelta.
Non ci sono nuove dipendenze o redirect di rotta.

Navigazione, ricerca, preferiti, stati vuoti, errori, mappa, player e nomi dei
paesi sono tradotti. Nomi delle emittenti, città e regioni conservano la forma
locale; il cambio lingua non altera i dati geografici né la lingua trasmessa.
Le pagine incorporate delle emittenti dipendono dai rispettivi player.
Il Laboratorio pubblico è stato rimosso. Gli script di diagnosi restano strumenti locali.

Il sottotitolo della vista mondiale è «Nuovi paesi da tutto il mondo, un po’
alla volta.» / «More countries around the world, one step at a time.» ed è
visibile anche da mobile.

Il test `node scripts/check-languages-ui.mjs` controlla le scelte indipendenti,
la persistenza della lingua, il mantenimento dei preferiti, le traduzioni di
ricerca/player/errori e i layout a 1440, 390 e 320 px. Usa fonti simulate:
non è un controllo della disponibilità delle emittenti.
