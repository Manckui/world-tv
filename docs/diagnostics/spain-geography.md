# Spagna — ricerca geografica e fonti dei pin

Verifica: 20 ottobre 2026. Questo documento riguarda metadati geografici; l'esito di riproduzione dei flussi è gestito dai report dei test video separati.

## Stato della ricerca

- 253 record geografici; il catalogo aggiornato contiene 248 canali, tutti con un record geografico. Restano 5 record predisposti per candidati non ancora inclusi nel catalogo: `catalog:ES:telemadrid`, `catalog:ES:laotra`, `catalog:ES:tpa7`, `catalog:ES:aragontv`, `catalog:ES:rtvce`.
- 121 record con città, provincia, coordinate e fonte della località; 112 regionali/locali e 9 nazionali.
- Tutte le 17 comunità autonome e le 2 città autonome hanno almeno un record geografico documentato. Questo **non certifica 19 territori con TV riproducibili**: alcuni candidati non erano ancora nel catalogo al momento della ricerca, e Ceuta presenta una limitazione geografica nel player ufficiale.
- 132 record senza coordinate precise, mantenuti intenzionalmente senza città/pin. La loro associazione territoriale iniziale deriva dalle sezioni di TDTChannels e resta una classificazione provvisoria con confidenza media.
- Ultimo batch: sedi verificate per Huelva TV, CanalImagen Almansa, Visión 6 TV, EsTuTele, Ràdio Bocairent TV e Canal 6 Totana. Cinque sono servizi locali/comarcali; EsTuTele dichiara copertura dell’intera Comunidad de Madrid. Il feed TV3 Internacional usa la sede documentata del gruppo 3Cat già verificata.

## Criteri

Le sedi sono documentate attraverso contatti, avvisi legali o pagine istituzionali dell'emittente e dell'ente pubblico competente. Una sede societaria viene indicata come tale; non è automaticamente lo studio da cui nasce ogni programma. Il nome del canale non è usato da solo per inventare città o provincia. Le fonti di ogni record sono conservate in `sourceUrl`, con le precisazioni in `notes`.

I pin sono **centri abitati indicativi**: le coordinate provengono dal [dataset Spagna di GeoNames](https://download.geonames.org/export/dump/ES.zip), attribuito a [GeoNames](https://www.geonames.org/) (licenza CC BY). Sono arrotondate a quattro decimali, senza trasformare questa precisione numerica in una promessa di accuratezza della sede. `coordinateSourceUrl` rimanda al singolo luogo GeoNames e `coordinatePrecision: "city"` esplicita la granularità. Non rappresentano un trasmettitore, un indirizzo esatto o un perimetro di ricezione terrestre.

`scope: national` conserva `regionCode: null`: RTVE nazionale, TRECE, El Toro TV e Negocios TV non diventano TV regionali di Madrid solo perché la sede del gestore è lì. I feed territoriali RTVE catalani e canari sono separati dai feed nazionali. Le emittenti regionali mantengono l'origine editoriale regionale anche quando la loro diretta web è visibile altrove. Per gruppi con più sedi si usa una sede rappresentativa documentata e si segnala la pluralità nelle note.

I canali istituzionali delle Cortes e del Parlamento possono trasmettere solo durante le sessioni; il pin verifica il luogo dell'istituzione, non un palinsesto continuo. Alcuni record del catalogo iniziale sono radio visuali o feed tematici: la loro classificazione editoriale/video va verificata separatamente dal luogo.

La verifica spaziale con `d3-geo.geoContains` ha controllato tutti i 112 pin con regione contro `public/maps/spain.json`: nessun punto ricade fuori dalla regione assegnata. I 9 pin nazionali sono esclusi da questo controllo perché non hanno assegnazione regionale.

## Fonti consultate per città e provincia

I gruppi condividono una fonte di sede; le singole note nel JSON precisano quando si tratta di feed o sedi differenti. Una fonte di sede non dimostra da sola ogni confine dell'area di diffusione.

| Territorio | Città / provincia | Canali | Fonte della sede |
| --- | --- | --- | --- |
| ES-AN | Almería / Almería | Interalmería TV | [Fonte](https://www.interalmeria.tv/directo/) |
| ES-AN | Coín / Málaga | Canal Coín | [Fonte](https://canalcoin.com/contact/) |
| ES-AN | Cádiz / Cádiz | Onda Cádiz | [Fonte](https://ondacadiz.es/empresa/donde-estamos) |
| ES-AN | Cádiz / Cádiz | 7TV Cádiz | [Fonte](https://www.7tvandalucia.es/estaticas/contacto.html) |
| ES-AN | Estepona / Málaga | Estepona TV | [Fonte](https://www.estepona.es/delegaciones/rtv-estepona) |
| ES-AN | Fuengirola / Málaga | Fuengirola TV | [Fonte](https://fuengirolatv.com/politica-de-privacidad/) |
| ES-AN | Granada / Granada | 101TV Granada | [Fonte](https://www.101tv.es/publicidad/) |
| ES-AN | Huelva / Huelva | Huelva TV | [Fonte](https://alacarta.huelvatv.com/publicidad/) |
| ES-AN | Huelva / Huelva | Teleonuba | [Fonte](https://teleonuba.es/solicitar-un-video/) |
| ES-AN | Jerez de la Frontera / Cádiz | 7TV Andalucía, 7TV Jerez | [Fonte](https://www.7tvandalucia.es/estaticas/contacto.html) |
| ES-AN | Lepe / Huelva | CanalCosta | [Fonte](https://canalcostatv.es/direccion/) |
| ES-AN | Manilva / Málaga | Manilva TV | [Fonte](https://www.rtvmanilva.com/contacto/) |
| ES-AN | Marbella / Málaga | Marbella TV | [Fonte](https://rtvmarbella.tv/contacto/) |
| ES-AN | Mijas / Málaga | Mijas 3.40 TV | [Fonte](https://mijascomunicacion.com/informacion/aviso-legal/) |
| ES-AN | Motril / Granada | Telemotril | [Fonte](https://telemotril.com/contacto/) |
| ES-AN | Málaga / Málaga | 101TV Málaga, 101TV Málaga Cofrade | [Fonte](https://www.101tv.es/aviso-legal/) |
| ES-AN | Málaga / Málaga | 7TV Málaga | [Fonte](https://www.7tvandalucia.es/estaticas/contacto.html) |
| ES-AN | Málaga / Málaga | Canal Málaga | [Fonte](https://www.malaga.eu/el-ayuntamiento/organizacion-municipal/areas-de-gobierno/index.html?idUnidad=703) |
| ES-AN | San Juan de Aznalfarache / Sevilla | Canal Sur 2 Accesible, Canal Sur Andalucía, Canal Sur Más Noticias | [Fonte](https://www.canalsur.es/rtva/visitas/) |
| ES-AN | Sevilla / Sevilla | 101TV Sevilla, 101TV Sevilla Cofrade | [Fonte](https://www.101tv.es/publicidad/) |
| ES-AN | Sevilla / Sevilla | 7TV Sevilla | [Fonte](https://www.7tvandalucia.es/estaticas/contacto.html) |
| ES-AN | Torremolinos / Málaga | Torremolinos TV | [Fonte](https://torremolinostv.com/) |
| ES-AR | Zaragoza / Zaragoza | Aragón TV, Aragón TV Internacional | [Fonte](https://www.aragonplay.es/directos) |
| ES-AS | Gijón / Asturias | catalog:ES:tpa7 | [Fonte](https://corporativo.rtpa.es/donde-estamos) |
| ES-CB | San Vicente de la Barquera / Cantabria | Saja Nansa TV | [Fonte](https://www.afodeb.es/onda-occidental) |
| ES-CE | Ceuta / Ceuta | RTVCE | [Fonte](https://www.rtvce.es/estaticas/portal-transparencia.html) |
| ES-CL | Valladolid / Valladolid | Cortes de Castilla y León | [Fonte](https://www.ccyl.es/Home/AvisoLegal) |
| ES-CM | Albacete / Albacete | Visión 6 TV | [Fonte](https://visionseis.tv/sugerencias/) |
| ES-CM | Almansa / Albacete | CanalImagen Almansa | [Fonte](https://zonacliente.almatelecom.es/videos/canalimagen) |
| ES-CM | Toledo / Toledo | Castilla-La Mancha Media (CMM), Castilla-La Mancha Radio (CMM) | [Fonte](https://www.cmmedia.es/informacion-corporativa/contactanos) |
| ES-CN | Arrecife / Las Palmas | Lancelot TV | [Fonte](https://correo.lancelot.tv/contacto.php) |
| ES-CN | Las Palmas de Gran Canaria / Las Palmas | 24h Canarias, La 1 Canarias, La 2 Canarias | [Fonte](https://www.rtve.es/centros-territoriales/) |
| ES-CN | Santa Cruz de Tenerife / Santa Cruz de Tenerife | TV Canaria (RTVC) | [Fonte](https://rtvc.es/direcciones-territoriales/) |
| ES-CN | Santa Cruz de Tenerife / Santa Cruz de Tenerife | Atlántico Televisión | [Fonte](https://www.atlanticotelevision.com/aviso-legal/) |
| ES-CT | Barcelona / Barcelona | betevé | [Fonte](https://beteve.cat/privacitat/) |
| ES-CT | El Vendrell / Tarragona | RTV El Vendrell | [Fonte](https://www.rtvelvendrell.cat/contacte/) |
| ES-CT | Granollers / Barcelona | VOTV | [Fonte](https://votv.cat/contacte/) |
| ES-CT | L’Hospitalet de Llobregat / Barcelona | L'Hospitalet TV | [Fonte](https://lhdigital.cat/contacte/) |
| ES-CT | Reus / Tarragona | Canal Reus | [Fonte](https://canalreus.cat/contactans/) |
| ES-CT | Sant Cugat del Vallès / Barcelona | 24h Catalunya, La 1 Catalunya, La 2 Cat, Ràdio 4 | [Fonte](https://www.rtve.es/centros-territoriales/) |
| ES-CT | Sant Joan Despí / Barcelona | 33, 3Cat Anime, 3Cat Càmeres del temps, 3Cat Doraemon, 3Cat Exclusiu 1, 3Cat Exclusiu 2, 3Cat Exclusiu 3, 3Cat Exclusiu 4, 3Cat Joc de Cartes, 3Cat Plats bruts, 3Cat Verdi Clàssics, 3Cat Vinagreta, 3CatInfo, Esport3, SX3, TV3, TV3 Internacional | [Fonte](https://www.3cat.cat/corporatiu/en/on-som/) |
| ES-CT | Tarragona / Tarragona | TAC 12 | [Fonte](https://www.tac12.tv/contacte) |
| ES-CT | Terrassa / Barcelona | Canal Terrassa | [Fonte](https://terrassadigital.cat/installacions-i-equipaments/terrassadigital-cat/) |
| ES-CT | Vilafranca del Penedès / Barcelona | Penedès TV | [Fonte](https://www.diba.cat/ca/web/municipis/inici/-/menudirectori/default/ooaa/08305) |
| ES-EX | Mérida / Badajoz | Canal Extremadura, EXN24 (Extremadura Noticias), Infantil (Canal Extremadura), Semos asina (Canal Extremadura), Toros (Canal Extremadura) | [Fonte](https://www.canalextremadura.es/aviso-legal) |
| ES-GA | Santiago de Compostela / A Coruña | TVG, TVG 2, TVG Cativ@s, TVG Eventos, TVG Mira Radio Galega, TVG Mociñ@s, TVG Pequerrech@s, TVG Universo Castelao, TVG Xabarin | [Fonte](https://www.crtvg.es/aviso-legal) |
| ES-IB | Palma / Illes Balears | Canal 4 TV Mallorca | [Fonte](https://grup4.com/contact/) |
| ES-MC | Murcia / Murcia | Popular TV Murcia | [Fonte](https://populartvrm.com/contacto) |
| ES-MC | Totana / Murcia | Canal 6 Totana | [Fonte](http://www.totanaweb.es/) |
| ES-MD | Madrid / Madrid | EsTuTele | [Fonte](https://estutele.com/) |
| ES-MD | Pozuelo de Alarcón / Madrid | catalog:ES:laotra, catalog:ES:telemadrid | [Fonte](https://www.telemadrid.es/corporativo/directorio/) |
| ES-ML | Melilla / Melilla | Popular TV Melilla | [Fonte](https://populartvmelilla.com/contacto) |
| ES-NC | Berriozar / Navarra | Xaloa Telebista | [Fonte](https://xaloatelebista.eus/kontaktua/) |
| ES-PV | Arrasate / Gipuzkoa | Goiena Eus | [Fonte](https://goiena.eus/kontaktua/) |
| ES-PV | Bilbao / Bizkaia | ETB 1, ETB 1 On, ETB 2, ETB 2 On, ETB Deportes (Kirolak 360), ETB Eventos 1, ETB Eventos 2, Euskadi Meteo (ETB On) | [Fonte](https://www.eitb.eus/es/portal-privacidad/contactos/) |
| ES-PV | Donostia / San Sebastián / Gipuzkoa | Hamaika TV | [Fonte](https://www.hamaika.eus/kontaktua-hamaika.html) |
| ES-RI | Logroño / La Rioja | Parlamento de La Rioja | [Fonte](https://transparencia.parlamento-larioja.org/relaciones-con-la-ciudadania/atencion-ciudadana/atencion-al-ciudadano) |
| ES-VC | Alicante / Alicante | Alacantí TV | [Fonte](https://alacantitv.com/informacion-legal/) |
| ES-VC | Alzira / València | Ribera TV | [Fonte](https://valenciatelevisio.com/contacto/) |
| ES-VC | Biar / Alicante | Intercomarcal TV | [Fonte](https://www.intercomarcal.com/contacto/) |
| ES-VC | Bocairent / València | Ràdio Bocairent TV | [Fonte](https://www.gva.es/contenidos/publicados/Emisoras_de_radio_14.pdf) |
| ES-VC | Burjassot / València | À Punt | [Fonte](https://www.apuntmedia.es/index.php/contacte) |
| ES-VC | Elche / Alicante | TeleElx | [Fonte](https://teleelx.es/nosotros/) |
| ES-VC | Paterna / València | 7 TeleValencia | [Fonte](https://7televalencia.com/aviso-legal/) |
| Nazionale | Madrid / Madrid | El Toro TV | [Fonte](https://eltorotv.com/contacto) |
| Nazionale | Madrid / Madrid | TRECE | [Fonte](https://www.fundacioncope.com/aviso-legal/) |
| Nazionale | Madrid / Madrid | Negocios TV | [Fonte](https://www.negocios.com/estaticas/privacidad.html) |
| Nazionale | Pozuelo de Alarcón / Madrid | 24h, Clan, La 1, La 2, RNE para todos, Teledeporte | [Fonte](https://www.rtve.es/contacto/rtve/) |

## Candidati streaming ufficiali: Aragón e Ceuta

### Aragón TV Internacional

- Pagina verificata: [diretti Aragón Play](https://www.aragonplay.es/directos). La pagina e il player identificano esplicitamente **Aragón TV Internacional**, distinto dal feed domestico Aragón TV.
- Durante una sessione Chrome anonima, senza account e senza interazioni di autenticazione, il player ha richiesto HLS e ottenuto master e playlist varianti HTTP 200. È evidenza del funzionamento sul sito ufficiale, non ancora del funzionamento integrato in Orbita.
- Endpoint HLS candidato, osservato nel traffico del player: `https://eu.mdstrm.com/live-stream-playlist/699341967864450d4f062ba9.m3u8`.
- Il player aggiunge un `access_token` temporaneo e parametri della sessione, poi riceve un redirect verso il CDN Mediastream. **Non sono stati salvati token nel repository.** L'URL senza parametri è solo un candidato da provare: non assumere che sia riproducibile fuori dal sito ufficiale. Se richiede autorizzazione della sessione, usare la pagina ufficiale come alternativa invece di fissare un token nel catalogo.
- Metadati predisposti con ID separato `catalog:ES:aragontvinternacional`, regione ES-AR, sede Zaragoza. L'edizione internazionale mantiene origine editoriale aragonese; non va presentata come servizio locale della sola città.

### Radio Televisión Ceuta

- La [home ufficiale RTVCE](https://www.rtvce.es/) collega la diretta a [CeutaPlay — Directo](https://www.ceutaplay.es/pages/live/directo). Anche il [precedente articolo di diretta](https://www.rtvce.es/video/directo/20240422110856073446.html) rimanda lì.
- Verifica Chrome anonima: il player mostrava un messaggio di contenuto non disponibile nella zona corrente; nessuna richiesta HLS rilevata. Non sono stati aggirati i limiti geografici né eseguito un login. Non è stato recuperato un flusso libero incorporabile.
- Il [portale di trasparenza RTVCE](https://www.rtvce.es/estaticas/portal-transparencia.html) conferma il canale ufficiale [YouTube RTVCE](https://www.youtube.com/@radiotelevisionceuta). La verifica di `/live` restituiva la pagina del canale senza una diretta attiva identificabile (nessun badge live o player live). Gli embed della home sono playlist; non dimostrano una diretta lineare.
- RTVCE documenta [dirette YouTube per eventi specifici](https://www.rtvce.es/articulo/sociedad/sabado-x-cuna-legion-directo-rtvce/20260306133825096828.html), ma non è stata trovata una diretta YouTube continua attiva durante la verifica. Il programma dal titolo “Ceuta en Directo” non è prova che il video sia attualmente in diretta.
- Geografia disponibile per `catalog:ES:rtvce` (Ceuta / ES-CE); mantenere la disponibilità video come lacuna documentata fino a una nuova verifica o a una fonte ufficiale riproducibile.

Per Ràdio Bocairent, il documento della Generalitat è una fonte storica della località; il sito attuale conferma il canale TV locale dello stesso operatore. Il pin indica il comune e non certifica che l’indirizzo della guida sia tuttora quello degli studi.

## Sedi ancora da documentare

Questi canali hanno associazione territoriale iniziale ma non una sede verificata in questa ricerca. Non sostituire i valori null con coordinate dedotte dal solo nome.

- **ES-AN** (47): 101TV Antequera, 101TV Costa del Sol, 101TV Cádiz, 7TV Aljarafe, 7TV Almería, 7TV Arcos, 7TV Campo de Gibraltar, 7TV Córdoba, 7TV Granada, 7TV Huelva, 7TV Jaén, 7TV Linares, 7TV Rota, 7TV San Fernando, 8TV Chiclana, 8TV La Janda, 8TV Sierra de Cádiz, 9 la Loma TV, Almería 24h TV, Almería TV, Andalucía Cocina, Canal 45 TV, Canal Doñana, Canal Luz Televisión, Canal San Roque, Cartaya TV, Condavisión, Costa Noroeste TV, Diez TV Andújar, Diez TV Las Villas, Diez TV Úbeda, Huelva Conecta, M95 Marbella, Music TV Granada, Onda Algeciras TV, PTV Córdoba, PTV Granada, PTV Linares, PTV Málaga, PTV Sevilla, Parlamento de Andalucía, Sal TV, TG7, TVM Córdoba, TeleGranada, Televisión Alhaurín, Tuya La Janda TV.
- **ES-AS** (1): Junta General del Principado de Asturias.
- **ES-CB** (3): De Laredu Lin TV, Popular TV Cantabria, Tevecan 9.
- **ES-CL** (2): Junta de Castilla y León, TV Aranda.
- **ES-CM** (7): Alcarria TV, Canal 2000, Canal 4 Mancha, Guada TV Media, Imás TV, TV Hellín, TeleToledo.
- **ES-CN** (12): Afortunadas TV, Ahora TV, Canal 4 Tenerife, Este Canal TV, Factoría de Carnaval, Fuerteventura TV, Mírame TV, NORTEvisión, Noroeste TV, RTV Mogán, Radio Calima TV, Tenerife Plus TV.
- **ES-CT** (14): BDN Badalona TV, Bon Dia TV, Canal 10 Empordà, Canal 4 TV Catalunya, Canal Taronja Anoia, Canal Taronja Central, Canal Taronja Osona i Moianés, Empordà TV, Lleida TV, Piera TV, RTV Cardedeu, TV Costa Brava, TV Sabadell - Vallès, etv.
- **ES-GA** (5): Anove TV, Parlamento de Galicia, TV Ferrol, Telemiño, Xunta de Galicia.
- **ES-IB** (1): TEF.
- **ES-MC** (3): Arabí TV, Canal 1 Mar Menor Torre Pacheco, Consejo de Gobierno de la Región de Murcia.
- **ES-MD** (6): Canal 33 Madrid, Distrito TV, Déjate de Historias TV, LIRA TV, Teleganés, iPROtv.
- **ES-NC** (1): Parlamento de Navarra.
- **ES-PV** (9): 28 Kanala, Durangaldeko TV, Eusko Legebiltzarra, GUKA TB, Goierri Irrati TV, Oizmendi TB, Tele 7, TeleBilbao, Urola TB.
- **ES-RI** (1): TV Rioja.
- **ES-VC** (19): 33TV, 8 La Marina TV, Burriana TeVe, Canal 3 Biar, Canal 56, Ciudades Del Ocio TV, Corts Valencianes, Elche 7 TV, La 8 Mediterráneo, Maestrat TV, Onda 15 TV, Onda Valencia, Punt 3 Vall Uixó, TV 4 La Vall, TV Almassora, Tele Safor, Une Vinalopó, Univers TV, tvA.
- **Nazionale** (1): Real Madrid TV.

## Verifica successiva

Il controllo incrociato deve distinguere tre prove: identità del canale, correttezza della località e riproduzione del video nell'app. Un HTTP 200 del manifest o un pin nel poligono corretto non prova tutti e tre. Nel catalogo effettivo selezionare soltanto le fonti che superano il test del player, mantenendo esplicite le alternative ufficiali e le limitazioni rilevate.
