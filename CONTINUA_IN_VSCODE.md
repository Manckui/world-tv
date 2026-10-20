# Prompt da incollare in Codex o Claude dentro VS Code

```text
Sto costruendo “World TV Lab”, un sito ispirato a Radio Garden ma dedicato alle televisioni gratuite e pubblicamente accessibili di tutto il mondo. L’idea non è creare il solito sito IPTV: voglio permettere alle persone di esplorare geograficamente cosa stanno trasmettendo in quel momento in altri Paesi. Per esempio: “sono le 13, vediamo cosa guardano in Cile”, poi passare al Vietnam, al Giappone o a una TV locale siciliana.

VISIONE COMPLETA
- Esperienza finale: mondo → Paese → regione/stato → città → emittente TV.
- Prima una mappa 2D con MapLibre e clustering; solo in seguito potremo valutare un globo 3D.
- Le TV nazionali appartengono a un Paese, quelle regionali a una suddivisione e quelle locali a una città/coordinate.
- Un player deve rimanere vicino alla mappa e consentire canale precedente, successivo e “TV casuale”.
- In futuro vorremmo EPG/programmazione, preferiti, cronologia e un checker periodico degli stream.
- Gli stream vanno classificati come disponibili, offline, geobloccati, incompatibili/CORS, DRM o solo player ufficiale.
- Non dobbiamo aggirare DRM, autenticazione, paywall o geoblocking. Preferire sempre stream ufficiali, embed ufficiali o link al broadcaster.
- Fonte iniziale: API pubblica IPTV-org. In futuro potremo importare i dati in PostgreSQL/Supabase e mantenere un catalogo verificato.

OBIETTIVO DELLA FASE ATTUALE
Prima della mappa dobbiamo validare la parte più rischiosa: quanti stream funzionano davvero nel browser. Il repository contiene già un POC Next.js senza mappa: selezione di 6 Paesi, elenco dei canali, ricerca, player HLS, TV casuale e contatori dei test.

STACK ATTUALE
- Next.js 16 con App Router
- React 19 e TypeScript
- hls.js
- Tailwind installato, con UI principalmente definita in globals.css
- API server-side `/api/channels?country=CL`
- dati da `https://iptv-org.github.io/api/channels.json` e `streams.json`

PAESI DEL TEST
- IT Italia
- VN Vietnam
- JP Giappone
- CL Cile
- US Stati Uniti
- ZA Sudafrica

STRUTTURA IMPORTANTE
- `src/app/page.tsx`: pagina
- `src/app/api/channels/route.ts`: API interna
- `src/lib/iptv.ts`: download e join dei dataset IPTV-org
- `src/lib/countries.ts`: Paesi del POC
- `src/components/TvExplorer.tsx`: filtri, lista, random e statistiche
- `src/components/TvPlayer.tsx`: player hls.js e gestione errori
- `src/types/tv.ts`: tipi condivisi

COSA VOGLIO FARE ORA
1. Avvia il progetto e controlla che non ci siano errori di build, lint o runtime.
2. Ispeziona il codice prima di modificarlo e rispetta le regole di `AGENTS.md` per Next.js 16.
3. Prova l’API interna con almeno Cile e Vietnam e verifica che restituisca dati reali.
4. Prova alcuni stream dal browser e migliora la classificazione degli errori, distinguendo almeno manifest HLS, rete/CORS, HTTP 403 o possibile geoblocking e stream offline.
5. Aggiungi un piccolo registro locale dei test (può iniziare con localStorage): canale, Paese, esito, errore, data e ora. Non aggiungere ancora un database.
6. Permetti di esportare i risultati del test in JSON o CSV, così possiamo confrontare i sei Paesi.
7. Mantieni il POC semplice: niente mappa, login, Supabase, EPG o globo 3D finché non abbiamo misurato quanti stream sono realmente utilizzabili.

MODO DI LAVORARE
- Procedi per piccoli passaggi verificabili.
- Prima di ogni modifica importante spiegami brevemente cosa stai facendo.
- Non inventare i risultati degli stream: distingui ciò che hai verificato realmente da ciò che è solo dedotto.
- Non eliminare la UI o le funzioni già presenti senza motivo.
- Dopo ogni fase esegui lint e build.
- Se trovi un limite dovuto a CORS, geoblocking o diritti, segnalalo chiaramente e non tentare bypass.

Per iniziare: esamina il repository, avvia il progetto, prova `/api/channels?country=CL` e dimmi cosa funziona e quali sono i primi problemi reali che trovi. Poi proponimi il primo piccolo miglioramento prima di implementarlo.
```
