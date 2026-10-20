# France – coverage notes (World TV research, 2026-10-20)

Test location: Italy (IT IP). All HLS/DASH URLs were taken from the broadcaster's own live page (page source, iframe or headless-Chrome network capture). They were then checked with
`curl -H "Origin: http://localhost:3000"` (master + first variant), last re-check 2026-10-20 (see `raw/revalidate.log`).

## Files
- `new-sources.json` – 107 broadcasters checked: **40 candidate_found** (19 HLS + 1 DASH direct, 12 official embeds, 11 external YouTube/Twitch/Kick), **62 no_usable_source**, **5 defunct**.
- `geography.json` – 201 ids (all 95 from `agent-existing.json` plus the 106 new ids; TVR.fr is in both). 130 have city-centre coordinates (Wikidata P625 / Wikipedia coordinates of the documented HQ commune). Confidence: 52 high, 64 medium, 85 low.
- Working material: `found.json` (= new-sources), `raw/` (sniffer logs, address extractions, Wikipedia infobox dumps), `scripts/` (sniff.js, scan.sh, hls.sh, addr*.py/js, build_geo.py, revalidate.py).

## Sources used for the inventory
- Locales.tv federation member list (WP REST `locales.tv/wp-json/wp/v2/chaines`, 50 channels with region tags).
- ARCOM "La numérotation des chaînes" (local LCN 30–38 metropolitan list + overseas LCN tables, June 2025).
- fr.wikipedia category tree "Chaîne de télévision locale en France" (≈170 articles) and infoboxes.
- IPTV-org channels.json (ids, closed dates).

## Direct HLS/DASH found (public, no token, CORS ok)
| Region | Channel | Host | CORS |
|---|---|---|---|
| FR-GES | BFM Alsace | live-cdn-bfmtvals-euw1.bfmtv.bct.nextradiotv.com | * |
| FR-PAC | BFM DICI Alpes du Sud / Haute-Provence, BFM Nice Côte d'Azur, BFM Marseille Provence, BFM Toulon Var | live-cdn-bfmtv{alp,pro,cda,mar,var}-euw1… | * |
| FR-HDF | BFM Grand Lille, BFM Grand Littoral | live-cdn-bfmtv{lil,gdl}-euw1… | * |
| FR-NOR | BFM Normandie | live-cdn-bfmtvnor-euw1… | * |
| FR-GES | Canal 32 (Troyes) | canal32-lineaire.b-cdn.net | * |
| FR-GES | Canal Local Grosblie | live.creacast.com | * |
| FR-BRE | Tébéo (Brest; TébéSud now merged) | tebeo.streamakaci.tv | echo |
| FR-BRE | TVR (Rennes) – new official host | cdn.live.easybroadcast.io | * |
| FR-CVL | BIP TV (Issoudun) | hls-biptv.archistream.live | * |
| FR-NAQ | Kanaldude (Basque) – HLS + DASH | stream1.sarebide.eus | * |
| FR-974 | CNJOI TV (Saint-Benoît) | cloudflarestream.com | * |
| FR-971 | TEVEKA | flux.teveka.net:8443 (AES-128 clear-key HLS, key CORS *) | * |
| MC | Monaco Info | webtv.monacoinfo.com | * |
| ? | L'intelligent TV | video1.getstreamhosting.com:1936 | * |

All BFM regional URLs appear literally in the source of `bfmtv.com/<region>/en-direct/` (IPTV-org only had SFR `ncdn-live-bfm` URLs for most of them).

## Official embeds / external platforms (recorded, not direct)
- Dailymotion (checked live via public DM API): Télénantes x5so98l (on air), Angers Télé x8r7256 (on air), Lyon Capitale TV x7z3zqa (on air), TV Vendée x38yjeb (off air at check; YouTube live_stream is primary), Public Sénat xkxbzc, CNews x3b68jn, CNEWS PRIME x9u4hka, Ubiznews x8dicii (off air).
- YouTube: TV Vendée, LMtv Sarthe (live_stream?channel=…), Mosaïk Cristal, France 24, LCP, Le Média.
- Twitch (embed needs `parent=<our domain>`): TL7 (LE_LIVE_TL7_LOIRE), ASTV (astvstream), Kwezi TV (kwezitv), Chiconi FM-TV (chiconifmtv976).
- Kick: TG+ / TéléGrenoble (kick.com/tgplus).
- Vimeo live event: TLC Cholet (event 3889697).
- Third-party player iframes with tokenised manifests (only the iframe is usable): vià93 (player.infomaniak.com channel 466 – manifest has spark+token), Madinina TV (StreamNexus secureManifest JWT).

## Regions / territories with no new usable local source
- **Bourgogne-Franche-Comté**: only the existing Brionnais TV; Voo TV (Dijon) defunct 2014; no other local TV found.
- **Occitanie**: only the existing ViàOccitanie and Littoral FM TV. TV Tarn site down; OCtele (Occitan web TV) has VOD only; Télé Bleue domain now an escape-game site.
- **Corse**: only existing Télé Paese; Via Stella is France 3 (not usable).
- **Guyane (973)**: only existing Télé Péyi. KTV (Kourou, TNT LCN 10) has no website; Web TV Guyane is a paid platform; Antenne Créole Guyane / ViàGuyane defunct.
- **Nouvelle-Calédonie**: Caledonia (site unreachable), NC9 (parked domain) – nothing usable.
- **Polynésie française**: only existing TNTV; IO TV no site; Tahiti Web Radio TV no video.
- **Saint-Pierre-et-Miquelon / Wallis-et-Futuna**: only La 1ère (not usable).
- **Nouvelle-Aquitaine**: TV7 Bordeaux and TVPI now live on sudouest.fr behind Imperva/Incapsula bot protection (could not be inspected – re-check manually in a real browser); 7ALimoges, NA TV, Télé Millevaches: VOD only.

## Official players NOT usable and why
- **France Télévisions (France 3 national + 24 regional "ICI" editions + Via Stella, all 9 "La 1ère", franceinfo)**: player calls `k7.ftven.fr` → `hdfauth.ftven.fr` token service → `simulcast-*.ftven.fr/<HMAC path token>/…/index.m3u8?hdnea=exp=…`. Short-lived signed URLs, francetv-only player; France 3 page did not even load a manifest from Italy (geo). Marked no_usable_source.
- **LCI / TF1** (tf1info.fr/direct): TF1 player + Gigya, no public manifest.
- **NOVO19** (Ouest-France, national TNT 2025): Red Bee Media OTT app, entitlement-based.
- **T18, Europe 1 TV, CNews website, NRJ Paris**: Cloudflare challenge (403) for automated clients – could not inspect (CNews/CNEWS Prime recorded via the official CNEWS Dailymotion account instead).
- **TV7 Bordeaux, TVPI**: Incapsula bot wall on sudouest.fr.
- **Twitch/Kick/YouTube** manifests are session-tokenised: only the platform iframe is usable.

## Defunct / closed (confirmed)
- BFM Paris Île-de-France – closed 14 Mar 2025 (ARCOM abrogation from 15 Mar 2025).
- Wéo Nord-Pas-de-Calais and Wéo Picardie – closed 25 Jan 2026 after judicial liquidation (21 Jan 2026).
- Voo TV (Dijon, 2009–2014); IDF1 → rebranded 20 Minutes TV IdF; Alsace 20 → BFM Alsace; Mirabelle TV → Moselle TV; TébéSud → merged into tebeo.bzh.
- BFM Lyon: off local TNT since 28 Jun 2024 but web stream still live (existing candidate).

## Geography caveats
- City is only set when a postal address / infobox HQ was actually seen (mentions légales, contact page, Wikipedia infobox). Where a channel name contains a place (Brionnais TV, Cannes Lérins TV, TV Erstein, Canal Gambsheim, TV Tarn, TV78, Radio TV Basse-Terre) but no address was found, city/département are left null.
- Annonces-légales pages of Canal 32 / TL7 / TG+ / Moselle TV list *other* companies' addresses – they were ignored.
- Tébéo: Wikipedia infobox gives Brest (19 rue Jean-Macé); tebeo.bzh mentions légales give the operating SAS registered office in Morlaix – Brest used, note kept.
- Locales.tv lists Beffroi Vision under Grand Est – it is in Le Cateau-Cambrésis (Nord, FR-HDF).
- Thematic channels: French-licensed international channels (Trace, TV5MONDE, Africa 24, Qwest, Museum TV, MyZen, Clubbing TV, FashionTV per Wikipedia HQ Paris) are scope "national" with HQ city; channels operated abroad are "foreign" with their country (Euronews BE, Africanews CG, CGTN CN, FIFA+ CH, Gong GB, RT France RU – closed 2023, Monaco channels MC). Persiana/4Music, Sony One, Mr Bean, NatureTime FAST feeds: foreign/unknown, no city.
- Wallis-et-Futuna uses regionCode FR-WF (not in the requested list).
