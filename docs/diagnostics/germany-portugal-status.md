# Germania e Portogallo: stato al 26 novembre 2026

Primo passaggio completato. I cataloghi contengono solo fonti verificate con il player reale
(20 secondi di riproduzione con fotogrammi decodificati). Passano `check-country-packs`, `tsc`,
`eslint` (resta solo un warning preesistente in `fr-geocode.mjs`) e i test unitari.

## Germania (DE)

- **Catalogo:** 113 canali con 160 fonti verificate (`reports/streams-DE-2.json`: 160 verified,
  87 failed, 10 inconclusive).
- **Per ambito:** 57 nazionali, 21 regionali (terze reti ARD), 33 locali, 1 estero, 1 sconosciuto.
  15 pin.
- **Ricerca:** Codex, in due giri con revisione di Claude
  (`docs/diagnostics/germany-research-coverage.md`).
- **Lacune:** Brema e Renania-Palatinato senza TV locali verificate. Molte sedi non documentate,
  quindi senza pin. ZDF dà 403 da questo ambiente.

## Portogallo (PT)

- **Catalogo:** 23 canali con 24 fonti verificate (`reports/streams-PT-2.json`). Rapporto
  completo in `docs/diagnostics/portugal-handoff.md`.
- **RTP assente:** fuori dal Portogallo la CDN risponde 204, e le pagine pubblicano solo URL con
  token. Per questo Açores e Madeira sono vuote.
- **Peso dei canali religiosi:** 17 canali su 23 sono feed religiosi online (Maná, Kuriakos).
- **TV locali su YouTube:** molte trasmettono solo lì, e il runner non misura YouTube.

## Prossimi passi

1. Rifare il test PT (soprattutto RTP) da una connessione in Portogallo, se disponibile.
2. Decidere se ammettere gli embed YouTube ufficiali con verifica manuale.
3. Controllo incrociato, poi commit e deploy dopo l'approvazione dell'utente.
