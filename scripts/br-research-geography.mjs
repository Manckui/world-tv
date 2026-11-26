// Build reports/br-research-geography.json from a curated table. Evidence was
// collected with scripts/br-research-crawl.mjs (public contact/expediente pages),
// scripts/br-research-inspect.mjs and manual checks. Research data, not a
// playback validator. Coordinates are GeoNames city centres (cities500 dump,
// stable https://www.geonames.org/<id> URLs) and every pin is checked with
// d3-geo geoContains against public/maps/brazil.json.
import { readFile, writeFile } from "node:fs/promises";
import { geoContains } from "d3-geo";

const candidates = JSON.parse(await readFile("reports/br-candidates.json", "utf8")).channels;
const sources = JSON.parse(await readFile("reports/br-research-sources.json", "utf8"));
const map = JSON.parse(await readFile("public/maps/brazil.json", "utf8"));

// GeoNames: [geonameId, lat, lon, regionCode]
const G = {
  Garibaldi: [3462557, -29.25611, -51.53361, "BR-RS"], "São José do Rio Preto": [3448639, -20.81972, -49.37944, "BR-SP"],
  Fortaleza: [3399415, -3.71722, -38.54306, "BR-CE"], "São Paulo": [3448439, -23.5475, -46.63611, "BR-SP"],
  Campinas: [3467865, -22.90556, -47.06083, "BR-SP"], "Patos de Minas": [3454783, -18.57889, -46.51806, "BR-MG"],
  Teresina: [3386496, -5.08917, -42.80194, "BR-PI"], "Campos dos Goytacazes": [3467693, -21.75227, -41.33044, "BR-RJ"],
  Belém: [3405870, -1.45583, -48.50444, "BR-PA"], Gravataí: [3462089, -29.94218, -50.99278, "BR-RS"],
  Sertãozinho: [3447651, -21.13778, -47.99028, "BR-SP"], Manaus: [3663517, -3.10194, -60.025, "BR-AM"],
  "Palmas (PR)": [3455459, -26.48417, -51.99056, "BR-PR"], Salvador: [3450554, -12.97563, -38.49096, "BR-BA"],
  Brasília: [3469058, -15.77972, -47.92972, "BR-DF"], "Rio de Janeiro": [3451190, -22.90642, -43.18223, "BR-RJ"],
  Macapá: [3396016, 0.03889, -51.06639, "BR-AP"], "Porto Alegre": [3452925, -30.03283, -51.23019, "BR-RS"],
  Douradina: [6317041, -23.38083, -53.29167, "BR-PR"], Natal: [3394023, -5.795, -35.20944, "BR-RN"],
  Goiânia: [3462377, -16.67861, -49.25389, "BR-GO"], "Nova Friburgo": [3456166, -22.28194, -42.53111, "BR-RJ"],
  "Porto Velho": [3662762, -8.76194, -63.90389, "BR-RO"], Aracaju: [3471872, -10.91111, -37.07167, "BR-SE"],
  "Rio Branco": [3662574, -9.97472, -67.81, "BR-AC"], Recife: [3390760, -8.05389, -34.88111, "BR-PE"],
  "Belo Horizonte": [3470127, -19.92083, -43.93778, "BR-MG"], Curitiba: [3464975, -25.42778, -49.27306, "BR-PR"],
  Florianópolis: [3463237, -27.59667, -48.54917, "BR-SC"], "Campo Grande": [3467747, -20.44278, -54.64639, "BR-MS"],
  Maceió: [3395981, -9.66583, -35.73528, "BR-AL"], "Palmas (TO)": [3474574, -10.16745, -48.32766, "BR-TO"],
};

const IPTV = "https://iptv-org.github.io/api/feeds.json";
// [scope, regionCode, city, confidence, sourceUrl, note, pin?, extraRegions?]
// pin=true only when the city comes from an official address page.
const N = (src, note, city = null, conf = "medium") => ["national", null, city, conf, src, note];
const T = {
  // --- national: public, institutional, religious, thematic, web/FAST ---
  "CanalEducacao.br": N("https://www.gov.br/mec/pt-br/canal-educacao", "Canale del MEC (EBC), nazionale.", null, "high"),
  "CanalGov.br": N("https://agenciagov.ebc.com.br/sobre", "Canale del Governo federale (EBC), nazionale per regola.", "Brasília", "high"),
  "CanalLibras.br": N("https://www.gov.br/mec/pt-br/canal-libras/", "Canale MEC in Libras, nazionale.", null, "high"),
  "CanalSaude.br": N("https://www.canalsaude.fiocruz.br/", "Canale della Fiocruz, nazionale.", null, "high"),
  "TVBrasil.br": N("https://acessoainformacao.ebc.com.br/", "Rete pubblica EBC; sede Brasília documentata, ambito nazionale.", "Brasília", "high"),
  "TVCamara.br": N("https://www.camara.leg.br/tv", "TV della Câmara dos Deputados, nazionale; sede Brasília.", "Brasília", "high"),
  "TVCamara2.br": N("https://www.camara.leg.br/tv", "Secondo canale della Câmara dos Deputados, nazionale.", "Brasília", "high"),
  "CanalUOL.br": N("https://sobreuol.noticias.uol.com.br/historia/", "Canale del portale UOL, nazionale."),
  "CNNBrasil.br": N("https://www.cnnbrasil.com.br/", "All-news nazionale."),
  "TimesBrasil.br": N("https://timesbrasil.com.br/sobre-nos/", "Canale news/economia nazionale."),
  "VEJAPlusTV.br": N("https://veja.abril.com.br/veja-mais-tv/", "Canale della rivista Veja, nazionale."),
  "SESCTV.br": N("https://portal.sescsp.org.br/pt/sobre-o-sesc/", "Canale culturale del Sesc SP distribuito a livello nazionale; sede San Paolo, ambito nazionale.", "São Paulo", "high"),
  "CulturaFast.br": N("https://cultura.uol.com.br/", "Canale FAST della Fundação Padre Anchieta, distribuzione nazionale online."),
  "TVAparecida.br": N("https://a12.com/fale-conosco/", "Rete cattolica nazionale (Santuário de Aparecida) per regola dell'incarico.", "Aparecida", "high"),
  "RedeVida.br": N("https://redevida.com.br/sobre-a-redevida/", "Rete cattolica nazionale; generatrice a São José do Rio Preto, ufficio commerciale a San Paolo.", "São José do Rio Preto", "high"),
  "RedeGospel.br": N("https://www.redegospel.tv.br/contato", "Rete evangelica nazionale (Renascer), sede San Paolo.", "São Paulo", "high"),
  "RITTV.br": N("https://ongrace.com/fale-conosco/", "Rete evangelica nazionale (Igreja Internacional da Graça de Deus).", null),
  "BoasNovas.br": N("https://boasnovas.tv/contatos/", "Rete religiosa nazionale; contatti a Rio de Janeiro.", "Rio de Janeiro", "high"),
  "FonteTV.br": N("https://redefonte.com.br/site/", "Rete religiosa a diffusione nazionale; sede Goiânia.", "Goiânia", "high"),
  "PlenitudeTV.br": N("https://www.plenitudedotronodedeus.com.br/", "Canale della chiesa Plenitude do Trono de Deus, diffusione nazionale; sede San Paolo.", "São Paulo", "medium"),
  "TVGideoes.br": N("https://www.gideoes.com.br/contato/", "Canale missionario nazionale; sede Camboriú (SC).", "Camboriú", "high"),
  "TVPaiEterno.br": N("https://www.paieterno.com.br/", "Rete cattolica nazionale (Santuário do Pai Eterno, Trindade GO)."),
  "TVEvangelizar.br": N("https://padrereginaldomanzotti.com.br/contato/", "Rete cattolica nazionale (Pe. Reginaldo Manzotti)."),
  "TVUniversal.br": N(IPTV, "Canale religioso nazionale (IURD).", null, "low"),
  "DespertarTV.br": N("https://despertartv.com.br/", "Canale religioso a diffusione nazionale.", null, "low"),
  "RedeImpactoGospelTV.br": N("https://redeimpactogospel.com/", "Web TV religiosa senza area locale documentata.", null, "low"),
  "TVTerceiroAnjo.br": N(IPTV, "Canale religioso senza area locale documentata.", null, "low"),
  "TVMaanaim.br": N(IPTV, "Canale religioso distribuito in Brasile e Portogallo secondo IPTV-org.", null, "low"),
  "catalog:BR:tvmanabrasil": N(IPTV, "Feed brasiliano della rete religiosa Maná, nazionale.", null, "low"),
  "catalog:BR:kuriakoskids": N(IPTV, "Canale religioso per bambini, nazionale.", null, "low"),
  "GospelCartoon.br": N(IPTV, "Canale tematico web nazionale.", null, "low"),
  "GospelMovieTV.br": N("https://ipgotv.net.br/tv/gmovies/", "Canale tematico web nazionale.", null, "low"),
  "NuevoTiempo.br": N("https://www.nuevotiempo.org/tv/", "Feed in spagnolo della rete avventista Novo Tempo, prodotto a Jacareí (SP) per l'America ispanica; tenuto nazionale, non regionale.", "Jacareí", "high"),
  "ISTV.br": N("https://istv.com.br/sobre-nos/", "Rete educativa con canali in più città e in rete nazionale; sede Guarujá (SP).", "Guarujá", "high"),
  "AgroBrasilTV.br": N("https://www.agrobrasiltv.com.br/", "Canale tematico agro nazionale; sede Campo Grande (MS).", "Campo Grande", "high"),
  "AgroCanal.br": N("https://sba1.com/contato", "Canale tematico agro nazionale (SBA); sede Campo Grande (MS).", "Campo Grande", "high"),
  "CanaldoCriador.br": N("https://canaldocriador.com.br/nossa-historia/", "Canale tematico agro nazionale."),
  "TerraViva.br": N(IPTV, "Canale agro del Grupo Bandeirantes, nazionale."),
  "AmazonSat.br": N(IPTV, "Canale satellitare a tema amazzonico distribuito a livello nazionale (parabólica); tenuto nazionale.", null, "low"),
  "1001Noites.br": N("https://1001noites.com.br/quem-somos", "Canale di televendita nazionale; sede Rio de Janeiro.", "Rio de Janeiro", "high"),
  "TVLifeAmerica.br": N("http://tvlifeamerica.com/sobre-nos/", "Web TV con sedi a Belo Horizonte, Danbury (USA) e Mozambico; nessuna copertura locale.", "Belo Horizonte", "medium"),
  "LamoreRockShowWebTV.br": N("https://www.lamorerockshowwebtv.com.br/quemsomos/", "Web TV musicale personale, senza area locale.", null, "low"),
  "ElementalChannel.br": N("https://elementalchannel.com.br/sobre/", "Web TV tematica nazionale.", null, "low"),
  "ElyTV.br": N("https://elementalchannel.com.br/", "Web TV dello stesso gruppo di Elemental Channel.", null, "low"),
  "PlayTV.br": N("https://playtv.com.br/", "Rete giovanile a diffusione nazionale; area IPTV-org SP non indicativa.", null, "low"),
  "RedeBrasil.br": N("https://rbtv.com.br/", "Rede Brasil de Televisão, rete nazionale."),
  "RedeGlobo.br": N("https://redeglobo.globo.com/", "Rete nazionale (fuori ambito sorgenti)."),
  "SBTNacional.br": N("https://www.sbt.com.br/", "Rete nazionale (fuori ambito sorgenti)."),
  "Combate.br": N(IPTV, "Canale sportivo Globo, nazionale."),
  "RedeNGT.br": N("https://redengt.com.br/", "Rete NGT, distribuzione nazionale.", null, "low"),
  "ComedyCentralBrasil.br": N(IPTV, "Canale tematico nazionale."), "SonyChannel.br": N("https://br.sonychannel.com/", "Canale tematico nazionale."),
  "TikTokRadioBrasil.br": N(IPTV, "Canale FAST nazionale."), "catalog:BR:tracebrazuca": N(IPTV, "Feed brasiliano di Trace, nazionale."),
  "CINDIETV.br": N("https://www.cindie.com/", "Canale cinema, distribuzione nazionale/sudamericana.", null, "low"),
  "NSports.br": N("https://nsports.com.br/", "Canale sportivo nazionale."), "ShowdoMilhao.br": N("https://www.showdomilhao.com.br/", "Canale FAST nazionale."),
  "PetloversTV.br": N("https://petloverstv.com.br/", "Canale tematico nazionale.", null, "low"), "TVPlusPet.br": N("https://www.tvmaispet.com.br/", "Canale tematico nazionale.", null, "low"),
  "LaboralTV.br": N(IPTV, "Canale tematico (sicurezza sul lavoro), nazionale.", null, "low"),
  "Geekdot.br": N("https://geekdot.live/", "Web TV tematica nazionale.", null, "low"), "KpopTVPlay.br": N(IPTV, "Web TV tematica nazionale.", null, "low"),
  "GhostTV.br": N(IPTV, "Web TV tematica nazionale.", null, "low"), "ClassiqueTV.br": N(IPTV, "Web TV tematica nazionale.", null, "low"),
  "RetroCartoon.br": N(IPTV, "Web TV tematica nazionale.", null, "low"), "SeriesClassic.br": N(IPTV, "Web TV tematica nazionale.", null, "low"),
  "TVSeries.br": N(IPTV, "Web TV tematica nazionale.", null, "low"), "Loading.br": N(IPTV, "Canale giovanile nazionale.", null, "low"),
  "Lke.br": N("http://www.canallike.com.br/", "Canale tematico nazionale.", null, "low"), "COMBrasil.br": N(IPTV, "Canale FAST nazionale.", null, "low"),
  "GloobWeb.br": N(IPTV, "Feed web non ufficiale di Gloob (Globo), nazionale.", null, "low"),
  "NickOnline.br": N(IPTV, "Feed web tematico, nazionale.", null, "low"), "NickOnlineBobEsponja.br": N(IPTV, "Feed web tematico, nazionale.", null, "low"),
  "MyTimeMovieNetwork.br": N(IPTV, "Canale cinema web, nazionale.", null, "low"), "PlusMaisUm.br": N("https://maisumtv.com/", "Web TV generalista senza area locale documentata.", null, "low"),
  "TVMaticComedy.br": N(IPTV, "Canale FAST TVMatic, nazionale.", null, "low"), "TVMaticCrafts.br": N(IPTV, "Canale FAST TVMatic, nazionale.", null, "low"),
  "TVMaticFacebook.br": N(IPTV, "Canale FAST TVMatic, nazionale.", null, "low"), "TVMaticFight.br": N(IPTV, "Canale FAST TVMatic, nazionale.", null, "low"),
  "TVMaticFunny.br": N(IPTV, "Canale FAST TVMatic, nazionale.", null, "low"), "TVMaticTikTok.br": N(IPTV, "Canale FAST TVMatic, nazionale.", null, "low"),
  "MBCBrasilTV.br": N("https://mbcbrasil.tv.br/canais/rede-mbc-brasil", "Rete web senza sede documentata nell'HTML pubblico.", null, "low"),
  "RCTVBrasil.br": N("https://rctvbrasil.com.br/canais/rctv-brasil", "Rete web senza sede documentata nell'HTML pubblico.", null, "low"),
  "RedeMetropole.br": N("https://www.redemetropole.com/", "Portale/web TV con notizie nazionali; sede non documentata.", null, "low"),
  "TVLatinaSat.br": N("https://latinasat.com.br/", "Canale via satellite senza sede documentata.", null, "low"),
  // --- foreign ---
  "catalog:BR:fifaportuguese": ["foreign", null, null, "high", "https://www.plus.fifa.com/", "Feed in portoghese di FIFA+ (Svizzera)."],
  "catalog:BR:redbulltvbr": ["foreign", null, null, "high", "https://www.redbull.com/br-pt/", "Feed brasiliano FAST di Red Bull TV (Austria)."],
  "TVBRICSPortuguese.br": ["foreign", null, null, "high", "https://tvbrics.com/", "Feed in portoghese della rete TV BRICS (Russia)."],
  "catalog:BR:angeltvportuguese": ["foreign", null, null, "low", IPTV, "Feed in portoghese della rete religiosa internazionale Angel TV; paese d'origine non documentato qui."],
  // --- regional: public/educational state TV and state affiliates ---
  "TVCultura.br": ["regional", "BR-SP", "São Paulo", "high", "https://cultura.uol.com.br/", "TV pubblica dello Stato di San Paolo (Fundação Padre Anchieta); sede Rua Cenno Sbrighi.", true],
  "RedeMinas.br": ["regional", "BR-MG", null, "medium", "http://redeminas.tv/", "TV pubblica educativa di Minas Gerais; sito ufficiale non leggibile dall'Italia (403), nessun pin."],
  "TVERS.br": ["regional", "BR-RS", "Porto Alegre", "high", "https://www.tve.com.br/a-emissora", "TV educativa dello Stato del Rio Grande do Sul; sede Rua Corrêa Lima.", true],
  "TVEBahia.br": ["regional", "BR-BA", "Salvador", "high", "https://www.ba.gov.br/irdeb/institucional/tve", "TV educativa della Bahia (IRDEB); sede Rua Pedro Gama, Salvador.", true],
  "CulturaPara.br": ["regional", "BR-PA", null, "medium", "http://www.portalcultura.com.br/", "TV Cultura do Pará (Funtelpa), pubblica statale; sito non raggiungibile dall'Italia, nessun pin."],
  "TVEncontrodasAguas.br": ["regional", "BR-AM", "Manaus", "medium", "https://tveradioencontrodasaguas.com.br/sobre-a-tv/", "TV pubblica dell'Amazonas; indirizzo ufficiale Av. Barcelos, CEP 69025-280 (Manaus).", true],
  "TVAldeia.br": ["regional", "BR-AC", null, "medium", "https://www.tvaldeia.com/", "TV pubblica dello Stato dell'Acre; sede non riportata nell'HTML consultato, nessun pin."],
  "CanalFDR.br": ["regional", "BR-CE", "Fortaleza", "high", "https://fdr.org.br/canalfdr/tvcontato/", "Canale educativo della Fundação Demócrito Rocha, Ceará; sede Av. Aguanambi.", true],
  "TVAssembleiaCeara.br": ["regional", "BR-CE", "Fortaleza", "high", "https://www.al.ce.gov.br/", "TV dell'Assemblea legislativa del Ceará; sede Av. Desembargador Moreira.", true],
  "TVAssembleiaPiaui.br": ["regional", "BR-PI", null, "medium", "https://www.alepi.pi.gov.br/", "TV dell'Assemblea legislativa del Piauí; sito non raggiungibile dall'Italia, nessun pin."],
  "TVGazeta.br": ["regional", "BR-SP", "São Paulo", "high", "https://www.tvgazeta.com.br/sobre/", "Emittente commerciale della città/Stato di San Paolo (Fundação Cásper Líbero); sede Av. Paulista.", true],
  "TVFronteira.br": ["regional", "BR-SP", null, "low", "https://redeglobo.globo.com/sp/tvfronteira/", "Affiliata Globo dell'ovest paulista; il sito del candidato rimanda a TV TEM, nessun pin."],
  "TVThathi.br": ["regional", "BR-SP", null, "low", "https://www.thmais.com.br/", "Grupo Thathi, emittente dell'interno paulista (Ribeirão Preto); sito ufficiale 403 dall'Italia, nessun pin."],
  "SICTV.br": ["regional", "BR-RO", "Porto Velho", "high", "https://www.sictv.com.br/", "SIC TV, affiliata Record in Rondônia; sede Av. Prefeito Chiquilito Erse. Lo stream del candidato (parecisfm) non sembra di SIC TV.", true],
  "RBATV.br": ["regional", "BR-PA", "Belém", "high", "https://rbatv.dol.com.br/fale-conosco-2/", "Affiliata Band del Pará; sede Av. Almirante Barroso.", true],
  "TVMarajoara.br": ["regional", "BR-PA", "Belém", "high", "https://www.grupomarajoara.com.br/contato/", "Emittente del Grupo Marajoara; sede Tv. Quintino Bocaiúva.", true],
  "TVACritica.br": ["regional", "BR-AM", "Manaus", "medium", "https://www.acritica.com/institucional/", "Emittente della Rede Calderaro; indirizzo ufficiale Av. André Araújo, CEP 69067-375 (Manaus).", true],
  "AratuOn.br": ["regional", "BR-BA", null, "low", "https://aratuon.com.br/", "Canale news del Grupo Aratu (Bahia); sede non riportata nell'HTML consultato."],
  "ODiaTV.br": ["regional", "BR-PI", "Teresina", "high", "https://portalodia.com/expediente", "Emittente del Grupo O Dia; sede Rua Governador Arthur de Vasconcelos.", true],
  "RedeMeioNorte.br": ["regional", "BR-PI", null, "medium", "https://www.meionews.com/tv-meionorte", "Rete del Piauí con copertura anche nel Maranhão; sede non riportata nell'HTML consultato.", false, ["BR-MA"]],
  "TVMeio.br": ["regional", "BR-PI", null, "low", IPTV, "Stream 'redemeio': probabilmente legato alla Rede Meio Norte (PI); identità da verificare."],
  "TVArapuan.br": ["regional", "BR-PB", null, "low", IPTV, "Emittente di João Pessoa secondo l'area IPTV-org; sito ufficiale senza indirizzo."],
  "TVBrasilOeste.br": ["regional", "BR-MT", null, "low", IPTV, "Area IPTV-org Cuiabá; sito ufficiale senza indirizzo leggibile."],
  "TVVilaReal.br": ["regional", "BR-MT", null, "low", "https://www.gazetadigital.com.br/", "Collegata al Grupo Gazeta (Mato Grosso) secondo il sito indicato; nessuna sede."],
  "TVClube.br": ["regional", "BR-PE", null, "low", "https://tvclubepe.op9.com.br/", "TV Clube di Pernambuco (sito tvclubepe); sito non raggiungibile."],
  "TVDifusoraLeste.br": ["regional", "BR-MA", null, "low", IPTV, "Area IPTV-org Caxias (MA); sito ufficiale senza indirizzo."],
  "TVAliancaCatarinense.br": ["regional", "BR-SC", null, "low", IPTV, "Area IPTV-org Santa Catarina; sito non raggiungibile."],
  "TVSuldeMinas.br": ["regional", "BR-MG", null, "low", "http://www.tvsuldeminas.com.br/pagina/quem-somos", "Emittente del Sud di Minas Gerais; indirizzo non estratto."],
  "TVGuara.br": ["regional", "BR-PR", null, "low", "https://massa.com.br/rede-massa-curitiba/", "Il candidato rimanda alla Rede Massa (Paraná); identità della TV Guará da verificare."],
  "CanaldoInter.br": ["regional", "BR-RS", null, "low", "https://internacional.com.br/clube", "Canale del club Internacional di Porto Alegre; trattato come regionale RS, nessun pin."],
  // --- local ---
  "AdessoTV.br": ["local", "BR-RS", "Garibaldi", "high", "https://www.adessotv.com.br/contato", "TV locale; contatto Tv. Raul Cisilotto, Garibaldi/RS.", true],
  "BR8TV.br": ["local", "BR-SP", "São José do Rio Preto", "high", "https://br8news.com.br/", "Canale news con indirizzo Rua Floriano Peixoto, São José do Rio Preto/SP.", true],
  "Blitstv.br": ["local", "BR-SP", "Campinas", "high", "https://blitstv.com.br/", "Il sito ufficiale indica la sede a Campinas-SP.", true],
  "CanalRicos.br": ["local", "BR-SP", "São Paulo", "high", "https://www.canalricos.com.br/about", "TV locale del quartiere Perus, San Paolo.", true],
  "NTV.br": ["local", "BR-MG", "Patos de Minas", "high", "https://www.ntv.tv.br/", "TV locale; sede Rua Major Gote, Patos de Minas-MG.", true],
  "PlenaTV.br": ["local", "BR-RJ", "Campos dos Goytacazes", "high", "https://www.folha1.com.br/expediente", "TV del gruppo Folha da Manhã; sede Rua Carlos Lacerda, Campos/RJ.", true],
  "SOUTV.br": ["local", "BR-RS", "Gravataí", "high", "https://www.soutv.com.br/", "TV locale; sede Av. Dorival Cândido Luz de Oliveira, Gravataí/RS.", true],
  "STZTV.br": ["local", "BR-SP", "Sertãozinho", "high", "https://stztv.org.br/fale-conosco.html", "TV locale; sede Rua Jordão Borghetti, Sertãozinho-SP.", true],
  "TVAFolha.br": ["local", "BR-PR", "Palmas (PR)", "high", "https://www.jornalafolha.com.br/contato", "TV del giornale A Folha; sede Palmas/PR.", true],
  "TVCamaraSalvador.br": ["local", "BR-BA", "Salvador", "high", "https://www.cms.ba.gov.br/contatos", "TV della Câmara Municipal de Salvador.", true],
  "TVComunitaria.br": ["local", "BR-DF", "Brasília", "high", "https://tvcomunitariadf.com/contato/", "Canale comunitario di Brasília (SIG).", true],
  "TVCRio.br": ["local", "BR-RJ", "Rio de Janeiro", "high", "https://tvcomunitaria.rio/", "TV comunitaria di Rio de Janeiro; sede Rua Joaquim Silva.", true],
  "TVDiarioMacapa.br": ["local", "BR-AP", "Macapá", "high", "https://www.diariodoamapa.com.br/fale-conosco/", "TV del Diário do Amapá; sede Av. Coriolano Jucá, Macapá.", true],
  "TVGazin.br": ["local", "BR-PR", "Douradina", "high", "https://tvgazin.com.br/contato.php", "TV del gruppo Gazin; sede Rodovia Antonio Pedrozo, Douradina-PR.", true],
  "TVGRANDENATALHDTVBRASIL.br": ["local", "BR-RN", "Natal", "medium", "https://tvgrandenatalhd.blogspot.com/", "Web TV locale; indirizzo Natal-RN pubblicato sul blog dell'emittente.", true],
  "TVShowFortaleza.br": ["local", "BR-CE", "Fortaleza", "high", "https://www.tvshowfortaleza.com/contato", "TV locale; sede Av. Antonio Augusto, Fortaleza.", true],
  "TVUFG.br": ["local", "BR-GO", "Goiânia", "high", "https://tvufg.org.br/institucional/", "TV universitaria UFG (Fundação RTVE); Câmpus Samambaia, Goiânia.", true],
  "TVZoom.br": ["local", "BR-RJ", "Nova Friburgo", "high", "https://tvzoom.com.br/fale-conosco/", "TV locale; sede Av. Conselheiro Julius Arp, Nova Friburgo/RJ.", true],
  "TVMackenzie.br": ["local", "BR-SP", "São Paulo", "medium", "https://www.mackenzie.br/tv", "TV universitaria Mackenzie; sede universitaria Rua da Consolação (São Paulo).", true],
  "TVUFOP.br": ["local", "BR-MG", null, "medium", "https://tvufop.com.br/", "TV universitaria UFOP (Ouro Preto); sede non riportata nell'HTML consultato, nessun pin."],
  "UnisulTV.br": ["local", "BR-SC", null, "medium", "https://unisultv.blogspot.com/p/sobre-unisul-tv.html", "TV universitaria Unisul (SC); sede non documentata."],
  "SantaCeciliaTV.br": ["local", "BR-SP", null, "medium", "https://noticias.unisanta.br/wp-content/uploads/2024/06/Jornal-dos-Jogos-2022-Edicao-1-Frente.pdf", "TV del sistema Santa Cecília (Unisanta, Santos); sede non documentata."],
  "TCM10HD.br": ["local", "BR-RN", null, "medium", "https://tcmnoticia.com.br/", "Canale TCM di Mossoró (gruppo TCM Telecom); sede non riportata nell'HTML."],
  "TVParaense.br": ["local", "BR-PA", null, "medium", "https://portaltvparaense.com.br/", "Portale/TV con notizie di Castanhal-PA (dicitura editoriale, non indirizzo)."],
  "Canal38.br": ["local", "BR-PR", null, "medium", "https://canal38.com.br/", "Notizie di Arapongas/Apucarana (PR) sul sito ufficiale; sede non riportata."],
  "CanalSete.br": ["local", "BR-MG", null, "medium", "http://www.canalsete.com.br/", "Il sito indica programmazione per São Sebastião do Paraíso-MG e regione (copertura, non indirizzo)."],
  "TVSimCachoeiro.br": ["local", "BR-ES", null, "medium", "https://simnoticias.com.br/", "Edizione di Cachoeiro de Itapemirim del gruppo Sim (Espírito Santo)."],
  "TVSimSaoMateus.br": ["local", "BR-ES", null, "medium", "https://simnoticias.com.br/", "Edizione di São Mateus del gruppo Sim (Espírito Santo)."],
  "FalaLitoral.br": ["local", "BR-SC", null, "low", IPTV, "Area IPTV-org Balneário Camboriú; sito senza indirizzo."],
  "TVPadreCicero.br": ["local", "BR-CE", null, "low", "http://www.tvpadrecicero.com.br/pagina/quem-somos", "TV di Juazeiro do Norte (Ceará); indirizzo non estratto."],
  "TVCOMMaceio.br": ["local", "BR-AL", null, "low", "https://tvcommaceio.tv.br/contato/", "TV comunitaria di Maceió; indirizzo non estratto."],
  "TVNBN.br": ["local", "BR-BA", null, "low", "https://www.tvnbn.com.br/", "Notizie della Bahia; area IPTV-org BA."],
  "SertaoTV.br": ["local", "BR-CE", null, "low", "https://sertaotvceara.com.br/", "TV del sertão cearense (area IPTV-org CE)."],
  "TVVicosa.br": ["local", "BR-MG", null, "low", "https://fratevi.org.br/", "Area IPTV-org Viçosa (MG); sito della fondazione senza indirizzo estratto."],
  "TVPassoFundo.br": ["local", "BR-RS", null, "low", IPTV, "Area IPTV-org Passo Fundo; sito non raggiungibile."],
  "TVBrusque.br": ["local", "BR-SC", null, "low", "https://www.tvbrusque.com.br/", "TV di Brusque (SC); sito 403 dall'Italia."],
  "TVCarioca.br": ["local", "BR-RJ", null, "low", "http://www.tvcarioca.net/", "TV carioca (RJ); sito 403 dall'Italia."],
  "TVCuruca.br": ["local", "BR-SP", null, "low", "https://www.tvcurucasp.com.br/", "Area IPTV-org SP; sito senza indirizzo."],
  "TVMaisMarica.br": ["local", "BR-RJ", null, "low", IPTV, "Area IPTV-org Maricá (RJ)."],
  "CaboFrioTV.br": ["local", "BR-RJ", null, "low", IPTV, "Area IPTV-org Cabo Frio (RJ)."],
  "ArarunaTV.br": ["local", "BR-PB", null, "low", IPTV, "Area IPTV-org Araruna (PB)."],
  "TVitape.br": ["local", "BR-SP", null, "low", IPTV, "Area IPTV-org Itapetininga (SP)."],
  "VRTChannel.br": ["local", "BR-SP", null, "low", IPTV, "Area IPTV-org Guarulhos (SP)."],
  "TVEmpire.br": ["local", "BR-MG", null, "low", IPTV, "Area IPTV-org Uberlândia (MG)."],
  "RedePremiumTV.br": ["local", "BR-SP", null, "low", IPTV, "Area IPTV-org Osasco (SP)."],
  "TVDigitalBirigui.br": ["local", "BR-SP", null, "low", IPTV, "Area IPTV-org SP; TV di Birigui."],
  "TVBirigui.br": ["local", "BR-SP", null, "low", IPTV, "Stesso stream 'tvdigitalbirigui' di TV Digital Birigui (SP)."],
  "RedeSPTV.br": ["local", "BR-SP", null, "low", IPTV, "Area IPTV-org SP."], "AlphaChannel.br": ["local", "BR-SP", null, "low", IPTV, "Area IPTV-org SP."],
  "ChromaTV.br": ["local", "BR-SP", null, "low", IPTV, "Area IPTV-org SP."], "ConecTVBrasil.br": ["local", "BR-SP", null, "low", IPTV, "Area IPTV-org SP."],
  "TVdasArtes.br": ["local", "BR-SP", null, "low", IPTV, "Area IPTV-org SP."], "ConectaMaisTV.br": ["local", "BR-PR", null, "low", IPTV, "Area IPTV-org PR."],
  "J3NEWSTV.br": ["local", "BR-RJ", null, "low", IPTV, "Area IPTV-org RJ."], "TVSaoRaimundo.br": ["local", "BR-AM", null, "low", IPTV, "Area IPTV-org Amazonas."],
  "TVAlternativa.br": ["local", "BR-PE", null, "low", "https://tvalternativa.com.br/", "Il sito pubblica notizie della Zona da Mata Norte di Pernambuco."],
  "CatveFM.br": ["local", "BR-PR", null, "low", IPTV, "Gruppo Catve di Cascavel (PR) secondo fonti secondarie; sito ufficiale 403."],
  "CatveMasterTV.br": ["local", "BR-PR", null, "low", IPTV, "Gruppo Catve di Cascavel (PR) secondo fonti secondarie; sito ufficiale 403."],
  "Catve2.br": ["local", "BR-PR", null, "low", IPTV, "Gruppo Catve di Cascavel (PR) secondo fonti secondarie; sito ufficiale 403."],
  "TVSulBahia.br": ["local", "BR-BA", null, "low", IPTV, "TV Sul Bahia di Teixeira de Freitas secondo fonti secondarie."],
  "CinturaoVerde.br": ["local", "BR-PR", null, "low", "https://redecinturaoverde.com.br/canais/cinturao-verde", "Rete Cinturão Verde, indicata a Cianorte (PR) da fonti secondarie."],
  "TV3Curitiba.br": ["local", "BR-PR", null, "low", "https://tvcanal3.com.br/canais/tv3-curitiba", "Stato dedotto dal nome (Curitiba); nessuna sede documentata."],
  "Canal25Jundiai.br": ["local", "BR-SP", null, "low", IPTV, "Stato dedotto dal nome (Jundiaí); nessuna sede documentata."],
  "TVCidadedePetropolis.br": ["local", "BR-RJ", null, "low", IPTV, "Stato dedotto dal nome (Petrópolis); nessuna sede documentata."],
  "TVPetropolis.br": ["local", "BR-RJ", null, "low", IPTV, "Stato dedotto dal nome (Petrópolis); nessuna sede documentata."],
  "TVInterlagos.br": ["local", "BR-SP", null, "low", IPTV, "Stato dedotto dal nome (quartiere Interlagos, San Paolo); nessuna sede documentata."],
  "TVLitoralRN.br": ["local", "BR-RN", null, "low", IPTV, "Stato dedotto dal nome (RN); nessuna sede documentata."],
  "TVPantanalMS.br": ["local", "BR-MS", null, "low", IPTV, "Stato dedotto dal nome (MS); nessuna sede documentata."],
};
// Unknown: no documentable area (local-looking web channels without evidence).
for (const id of ["AugeTV.br", "BemMelhor.br", "CanalMetropolitanodeNoticias.br", "CanalSTART.br", "ConexaoTV.br", "DemaisTV.br", "EUTV.br", "LiderTV.br", "MKKWebTV.br", "NovaEraTV.br", "RedeRC.br", "catalog:BR:tele6", "TVAdorar.br", "TVCAJUIWEB.br", "TVDestak.br", "TVDifusao.br", "TVFuturo.br", "TVGraoPara.br", "TVLiberdade.br", "TVMetropole.br", "TVMon.br", "TVProfissao.br", "TVSolComunidade.br", "TVideoNews.br", "UMATV.br"])
  T[id] = ["unknown", null, null, "low", candidates.find(c => c.id === id)?.website || IPTV, "Nessuna prova ufficiale di sede o area: lasciato unknown invece di indovinare."];

// New entries from reports/br-research-sources.json.
const R = (code, city, conf, src, note, pin = !!city) => ["regional", code, city, conf, src, note, pin];
Object.assign(T, {
  "TVBrasilCentral.br": R("BR-GO", null, "high", "https://goias.gov.br/abc/", "TV pubblica dello Stato di Goiás (Agência Brasil Central)."),
  "TVCeara.br": R("BR-CE", "Fortaleza", "high", "https://www.tvceara.ce.gov.br/", "TV pubblica del Ceará (TVC); sede Rua Osvaldo Cruz."),
  "TVAlese.br": R("BR-SE", "Aracaju", "medium", "https://al.se.leg.br/", "TV dell'Assemblea di Sergipe; indirizzo Av. Ivo do Prado, CEP 49010-050 (Aracaju)."),
  "TVAssembleiaRN.br": R("BR-RN", "Natal", "high", "https://www.al.rn.leg.br/", "TV dell'Assemblea del Rio Grande do Norte; Praça Sete de Setembro, Natal."),
  "catalog:BR:tvalems": R("BR-MS", "Campo Grande", "high", "https://www.al.ms.gov.br/", "TV dell'Assemblea del Mato Grosso do Sul; Parque dos Poderes, Campo Grande."),
  "catalog:BR:tvassembleiaal": R("BR-AL", "Maceió", "high", "https://www.al.al.leg.br/", "TV dell'Assemblea di Alagoas; Praça Dom Pedro II, Maceió."),
  "TVALESP.br": R("BR-SP", "São Paulo", "high", "https://www.al.sp.gov.br/", "TV dell'Assemblea di San Paolo; Av. Pedro Álvares Cabral."),
  "TVAssembleiaMinasGerais.br": R("BR-MG", "Belo Horizonte", "high", "https://www.almg.gov.br/", "TV dell'Assemblea di Minas Gerais; Rua Rodrigues Caldas."),
  "TVALERJ.br": R("BR-RJ", "Rio de Janeiro", "high", "https://www.alerj.rj.gov.br/", "TV dell'Assemblea di Rio de Janeiro; Rua da Ajuda."),
  "TVALBA.br": R("BR-BA", "Salvador", "high", "https://www.al.ba.gov.br/", "TV dell'Assemblea della Bahia; CAB, Salvador."),
  "catalog:BR:tvalepe": R("BR-PE", "Recife", "high", "https://www.alepe.pe.gov.br/", "TV dell'Assemblea di Pernambuco; Rua da União, Recife."),
  "catalog:BR:tvalepa": R("BR-PA", "Belém", "medium", "https://www.alepa.pa.gov.br/", "TV dell'Assemblea del Pará; Palácio Cabanagem, CEP 66020-070 (Belém)."),
  "TVAssembleiaParana.br": R("BR-PR", "Curitiba", "high", "https://www.assembleia.pr.leg.br/", "TV dell'Assemblea del Paraná; Praça N. Sra. de Salete, Curitiba."),
  "catalog:BR:tvalesc": R("BR-SC", "Florianópolis", "high", "https://www.alesc.sc.gov.br/", "TV dell'Assemblea di Santa Catarina; Rua Dr. Jorge Luz Fontes."),
  "catalog:BR:tvaleac": R("BR-AC", "Rio Branco", "high", "https://www.al.ac.leg.br/", "TV dell'Assemblea dell'Acre; Rua Arlindo Porto Real, Rio Branco."),
  "catalog:BR:tvalero": R("BR-RO", "Porto Velho", "high", "https://www.al.ro.leg.br/", "TV dell'Assemblea di Rondônia; Av. Farquar, Porto Velho."),
  "catalog:BR:tvaleto": R("BR-TO", "Palmas (TO)", "high", "https://www.al.to.leg.br/", "TV dell'Assemblea del Tocantins; Praça dos Girassóis, Palmas."),
  "TVAssembleiaParaiba.br": R("BR-PB", null, "medium", "https://www.al.pb.leg.br/tvalpb/", "TV dell'Assemblea della Paraíba."),
  "AssembleiaLegislativaTV.br": R("BR-RS", null, "medium", "http://www2.al.rs.gov.br/tvassembleia/", "TV dell'Assemblea del Rio Grande do Sul; sito non raggiungibile dall'Italia."),
  "TVAssembleiaMatoGrosso.br": R("BR-MT", null, "medium", "https://www.al.mt.gov.br/institucional/tv/", "TV dell'Assemblea del Mato Grosso; sito non raggiungibile dall'Italia."),
  "catalog:BR:tvalego": R("BR-GO", null, "medium", "https://portal.al.go.leg.br/", "TV dell'Assemblea di Goiás; sito non raggiungibile dall'Italia."),
  "catalog:BR:tvales": R("BR-ES", null, "medium", "https://www.al.es.gov.br/", "TV dell'Assemblea dell'Espírito Santo; sito non raggiungibile dall'Italia."),
  "catalog:BR:tvdistrital": R("BR-DF", null, "medium", "https://www.cl.df.gov.br/", "TV della Câmara Legislativa del Distrito Federal; sito non raggiungibile dall'Italia."),
  "catalog:BR:tvaleam": R("BR-AM", null, "medium", "https://www.aleam.gov.br/", "TV dell'Assemblea dell'Amazonas; sito non raggiungibile dall'Italia."),
  "catalog:BR:tvalema": R("BR-MA", null, "medium", "https://www.al.ma.leg.br/", "TV dell'Assemblea del Maranhão; sito non raggiungibile dall'Italia."),
  "catalog:BR:tvaleap": R("BR-AP", null, "medium", "https://www.al.ap.gov.br/", "TV dell'Assemblea dell'Amapá; sito non raggiungibile dall'Italia."),
  "catalog:BR:tvalerr": R("BR-RR", null, "medium", "https://www.al.rr.leg.br/", "TV dell'Assemblea di Roraima; sito non raggiungibile dall'Italia."),
  "TVParanaTurismo.br": R("BR-PR", null, "medium", "https://www.parana.pr.gov.br/aen", "TV pubblica dello Stato del Paraná."),
  "catalog:BR:tvpernambuco": R("BR-PE", null, "medium", "https://www.tvpe.pe.gov.br/", "TV pubblica dello Stato di Pernambuco; sito non raggiungibile dall'Italia."),
  "catalog:BR:tvantares": R("BR-PI", null, "medium", "https://www.tvantares.pi.gov.br/", "TV pubblica del Piauí (Fundação Antares); sito non raggiungibile dall'Italia."),
  "catalog:BR:aperipe": R("BR-SE", null, "medium", "https://aperipe.com.br/", "TV pubblica di Sergipe (Aperipê)."),
  "catalog:BR:redesat": R("BR-TO", null, "medium", "https://redesat.to.gov.br/", "TV pubblica del Tocantins (Redesat); sito non raggiungibile dall'Italia."),
  "TVECultura.br": R("BR-MS", null, "medium", "https://www.portaldaeducativa.ms.gov.br/", "TV educativa del Mato Grosso do Sul; sito non raggiungibile dall'Italia."),
  "TVEducativaES.br": R("BR-ES", null, "high", "https://rtv.es.gov.br/", "TV educativa dell'Espírito Santo (RTV-ES)."),
  "catalog:BR:unbtv": ["local", "BR-DF", "Brasília", "high", "https://unbtv.unb.br/", "TV universitaria dell'UnB; Campus Darcy Ribeiro, Brasília.", true],
  "TVUniversitaria.br": ["local", "BR-PE", null, "medium", "http://tvu.ntvru.ufpe.br/", "TV universitaria UFPE (Recife); nessun indirizzo estratto."],
  "catalog:BR:tvufrr": ["local", "BR-RR", null, "medium", "https://ufrr.br/rtv/", "Rádio e TV universitaria UFRR (Roraima)."],
  "catalog:BR:tvurn": ["local", "BR-RN", null, "medium", "https://tvu.ufrn.br/", "TV universitaria UFRN (Natal); sito non raggiungibile dall'Italia."],
  "TVSenado.br": N("https://www12.senado.leg.br/tv", "TV del Senado Federal, nazionale per regola.", "Brasília", "high"),
  "TVJustica.br": N("https://radioetvjustica.jus.br/", "TV del Supremo Tribunal Federal, nazionale per regola.", "Brasília", "high"),
  "CanalFutura.br": N("https://www.futura.org.br/", "Canale educativo della Fundação Roberto Marinho, nazionale per regola.", null, "high"),
  "TVEscola.br": N("https://www.tvescola.org.br/", "Canale educativo nazionale.", null, "medium"),
});

const ids = [...candidates.map(c => c.id), ...sources.map(s => s.id)];
const missing = ids.filter(id => !T[id]);
if (missing.length) throw new Error(`voci mancanti: ${missing.join(", ")}`);
const result = {};
for (const id of [...new Set(ids)].sort()) {
  const [scope, regionCode, city, confidence, sourceUrl, notes, pin = false, extraRegions = []] = T[id];
  const place = pin && city ? G[city] : null;
  if (pin && !place) throw new Error(`${id}: città senza GeoNames ${city}`);
  if (place && place[3] !== regionCode) throw new Error(`${id}: ${city} non è in ${regionCode}`);
  if ((scope === "regional" || scope === "local") && !regionCode) throw new Error(`${id}: ${scope} senza regionCode`);
  const foreignCountry = { "catalog:BR:fifaportuguese": "CH", "catalog:BR:redbulltvbr": "AT", "TVBRICSPortuguese.br": "RU", "catalog:BR:angeltvportuguese": null }[id];
  result[id] = {
    scope, regionCode: scope === "national" || scope === "foreign" ? null : regionCode, extraRegions,
    city: city ? city.replace(/ \((PR|TO)\)$/, "") : null, province: null,
    countryCode: scope === "foreign" ? foreignCountry : "BR",
    lat: place ? place[1] : null, lon: place ? place[2] : null,
    coordinateSourceUrl: place ? `https://www.geonames.org/${place[0]}` : null,
    confidence, sourceUrl, notes: place ? `${notes} Pin: centro urbano GeoNames, non trasmettitore.` : notes,
  };
}
// The simplified state map cuts some coastal city centres. Never move a pin:
// drop it, keep the documented city, and record the reason.
const dropped = [];
for (const [id, geo] of Object.entries(result)) {
  if (geo.lat === null) continue;
  const feature = map.features.find(f => f.properties.code === geo.regionCode);
  if (!feature) throw new Error(`${id}: regione ${geo.regionCode} assente dalla mappa`);
  if (!geoContains(feature, [geo.lon, geo.lat])) {
    dropped.push(`${id} (${geo.city})`);
    Object.assign(geo, { lat: null, lon: null, coordinateSourceUrl: null });
    geo.notes = geo.notes.replace(" Pin: centro urbano GeoNames, non trasmettitore.", " Pin omesso: il centro GeoNames cade fuori dal poligono semplificato della mappa (costa).");
    continue;
  }
  if (!geo.sourceUrl || /search|\?q=/.test(geo.coordinateSourceUrl)) throw new Error(`${id}: prova o coordinateSourceUrl non valida`);
}
await writeFile("reports/br-research-geography.json", JSON.stringify(result, null, 2) + "\n");
const count = key => Object.values(result).reduce((acc, g) => (acc[g[key] ?? "—"] = (acc[g[key] ?? "—"] ?? 0) + 1, acc), {});
console.log(`geography: ${Object.keys(result).length} voci, ${Object.values(result).filter(g => g.lat !== null).length} pin`);
console.log(JSON.stringify(count("scope")));
if (dropped.length) console.log(`pin omessi (fuori poligono): ${dropped.join(", ")}`);
console.log(JSON.stringify(Object.fromEntries(Object.entries(count("regionCode")).sort())));
