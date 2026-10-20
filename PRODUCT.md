# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

Un sito divertente per scoprire e guardare televisioni attraverso una mappa interattiva del mondo, ispirato al meccanismo di esplorazione geografica delle radio.

## Capabilities and Constraints

Il sito comprende Italia e Spagna; la Francia è in preparazione e comparirà quando saranno presenti i suoi dati. Sono disponibili ricerca, elenco di canali, scelta casuale, preferiti locali e player. La mappa consente esplorazione del globo, zoom sul Paese e selezione delle regioni. Gli altri Paesi vengono aggiunti progressivamente.

L'interfaccia pubblica è disponibile in italiano e inglese. Nell'intestazione si sceglie la lingua; una barra separata sopra la mappa identifica il Paese da esplorare. Le due scelte sono indipendenti. Il sottotitolo chiarisce che nuovi Paesi da tutto il mondo vengono aggiunti un po' alla volta.

L'utente ha approvato il mockup Orbita desktop/mobile e ne ha richiesto l'implementazione nel sito esistente con React, Next.js, TypeScript e SCSS. Preferisce codice semplice e commenti sulla logica più complessa.

L'utente ha scelto Orbita. La navigazione deve consentire lo zoom dal mondo al Paese e poi alle singole regioni per vedere le emittenti locali e regionali, dove presenti. L'assenza di canali in una regione deve essere gestita esplicitamente.

## Brand Commitments

Il progetto attuale si chiama World TV. Il nome definitivo è aperto; World TV è un nome di lavoro per le proposte.

L'utente richiede un risultato innovativo, esteticamente curato, non banale e funzionale. Ha indicato come riferimento estetico il file Figma akappa furniture, pagina v2 — Claude Design: https://www.figma.com/design/xUYKOgGGVMIP7ehcQwN32I/akappa-furniture?node-id=13-128 .

## Evidence on Hand

`src/components/orbita` contiene la nuova interfaccia. `src/components/StreamTestHarness.tsx` conserva solo il supporto ai test automatici locali su `/?stream-test=1`. La pagina Laboratorio è stata rimossa. `data/geography/IT.json` contiene le associazioni geografiche dei canali. Non è presente una guida programmi EPG. I canali nazionali non vanno assegnati alle regioni sulla base della sola sede.

## Open Decisions

Nome definitivo e ordine dei prossimi Paesi. La direzione visiva scelta è Orbita; lingua e preferiti sono locali al browser, senza account.
