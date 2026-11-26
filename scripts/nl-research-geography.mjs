// Build reports/nl-research-geography.json from a curated table. Evidence was collected with
// scripts/nl-research-crawl.mjs (public contact/colofon pages), scripts/nl-research-inspect.mjs
// (same pages rendered in Chrome) and the Commissariaat voor de Media register of local public
// broadcasters (verzorgingsgebied + provincie). Cities come only from an official postal address;
// the register documents the province, never a city. Coordinates are GeoNames place centres
// (NL dump, stable https://www.geonames.org/<id> URLs); every pin is checked with d3-geo
// geoContains against public/maps/netherlands.json and dropped (city kept) when it falls outside.
import { readFile, writeFile } from "node:fs/promises";
import { geoContains } from "d3-geo";

const candidates = JSON.parse(await readFile("reports/nl-candidates.json", "utf8")).channels;
const sources = JSON.parse(await readFile("reports/nl-research-sources.json", "utf8"));
const map = JSON.parse(await readFile("public/maps/netherlands.json", "utf8"));

// GeoNames: [geonameId, lat, lon, regionCode]
const G = {
  "Nieuwendijk": [2750285,51.775,4.92083,"NL-NB"],
  "Heiloo": [2754516,52.60252,4.68815,"NL-NH"],
  "Veenoord": [2745753,52.71087,6.84869,"NL-DR"],
  "Haarlem": [2755003,52.38084,4.63683,"NL-NH"],
  "Zelhem": [2743963,52.00667,6.34861,"NL-GE"],
  "Hapert": [2754872,51.36833,5.25694,"NL-NB"],
  "Maastricht": [2751283,50.84833,5.68889,"NL-LI"],
  "Spijkenisse": [2746932,51.845,4.32917,"NL-ZH"],
  "Elburg": [2756232,52.4475,5.84306,"NL-GE"],
  "Zeewolde": [2743997,52.33,5.54167,"NL-FL"],
  "Nuenen": [2749780,51.47,5.55278,"NL-NB"],
  "Sliedrecht": [2747169,51.82083,4.77639,"NL-ZH"],
  "Roermond": [2748000,51.19417,5.9875,"NL-LI"],
  "Son": [2747010,51.51136,5.49282,"NL-NB"],
  "Boxtel": [2758460,51.59083,5.32917,"NL-NB"],
  "Lelystad": [2751738,52.50833,5.475,"NL-FL"],
  "Arnhem": [2759661,51.98,5.91111,"NL-GE"],
  "Puttershoek": [2748389,51.805,4.56806,"NL-ZH"],
  "Bemmel": [2759231,51.89167,5.89861,"NL-GE"],
  "Beek en Donk": [8436503,51.54158,5.62603,"NL-NB"],
  "Tilburg": [2746301,51.55551,5.0913,"NL-NB"],
  "Venray": [2745634,51.525,5.975,"NL-LI"],
  "Oost-Souburg": [2749341,51.46333,3.60417,"NL-ZE"],
  "Leeuwarden": [2751792,53.20271,5.80973,"NL-FR"],
  "Groningen": [2755251,53.21917,6.56667,"NL-GR"],
  "Rotterdam": [2747891,51.9225,4.47917,"NL-ZH"],
  "Oosterhout": [2749450,51.645,4.85972,"NL-NB"],
  "Rijssen": [2748083,52.30667,6.51806,"NL-OV"],
  "Woerden": [2744248,52.085,4.88333,"NL-UT"],
  "Assen": [2759633,52.99667,6.5625,"NL-DR"],
  "Vlagtwedde": [2745461,53.0275,7.10833,"NL-GR"],
  "Maarheeze": [2751325,51.31167,5.61667,"NL-NB"],
  "Volendam": [2745340,52.495,5.07083,"NL-NH"],
  "Meppel": [2750947,52.69583,6.19444,"NL-DR"],
  "Hengelo": [2754394,52.26583,6.79306,"NL-OV"],
  "Landgraaf": [10242474,50.98482,5.83218,"NL-LI"],
  "Purmerend": [2748413,52.505,4.95972,"NL-NH"],
  "Steenwijk": [2746766,52.7875,6.12083,"NL-OV"],
  "Utrecht": [2745912,52.09083,5.12222,"NL-UT"],
  "Leek": [2751834,53.1625,6.37639,"NL-GR"],
  "Amsterdam": [2759794,52.37403,4.88969,"NL-NH"],
  "Someren": [2747021,51.385,5.71111,"NL-NB"],
  "Leiden": [2751773,52.15833,4.49306,"NL-ZH"],
  "Echt": [2756444,51.10583,5.87361,"NL-LI"],
  "Culemborg": [2757872,51.955,5.22778,"NL-GE"],
  "Alkmaar": [2759899,52.63167,4.74861,"NL-NH"],
  "Zuidwolde": [2743637,52.67167,6.42778,"NL-DR"],
  "Nieuwleusen": [2750161,52.5825,6.28194,"NL-OV"],
  "Weert": [2744911,51.25167,5.70694,"NL-LI"],
  "Emmen": [2756136,52.77917,6.90694,"NL-DR"],
  "Helmond": [2754447,51.48167,5.66111,"NL-NB"],
  "Berkel en Rodenrijs": [6929992,51.99313,4.47865,"NL-ZH"],
  "Mill": [2750802,51.68833,5.77917,"NL-NB"],
  "Aalsmeer": [2760134,52.25917,4.75972,"NL-NH"],
  "Best": [2759040,51.5075,5.39028,"NL-NB"],
  "Eindhoven": [2756253,51.44083,5.47778,"NL-NB"],
  "Naaldwijk": [2750523,51.99417,4.20972,"NL-ZH"],
  "Linne": [2751566,51.155,5.93889,"NL-LI"],
  "Nijkerk": [2750065,52.22,5.48611,"NL-GE"],
  "Ede": [2756429,52.03333,5.65833,"NL-GE"],
  "Hoorn": [2753638,52.6425,5.05972,"NL-NH"],
  "Apeldoorn": [2759706,52.21,5.96944,"NL-GE"],
  "Gouda": [2755420,52.01667,4.70833,"NL-ZH"],
  "Dordrecht": [2756669,51.81,4.67361,"NL-ZH"],
  "Bussum": [2758064,52.27333,5.16111,"NL-NH"],
  "Hilversum": [2754064,52.22333,5.17639,"NL-NH"],
  "De Westereen": [2743590,53.25731,6.0363,"NL-FR"],
  "Den Haag": [2747373,52.07667,4.29861,"NL-ZH"],
};

const IPTV = "https://iptv-org.github.io/api/channels.json";
const REG = "https://www.cvdm.nl/registers/register-publieke-media-instellingen-lokaal/";
// [scope, regionCode, city, confidence, sourceUrl, note, pin?]
// pin=true only when the city comes from an official address page.
const N = (src, note, city = null, conf = "medium") => ["national", null, city, conf, src, note];
const F = (country, src, note, conf = "high") => ["foreign", null, null, conf, src, note, false, country];
const R = (code, city, src, note) => ["regional", code, city, "high", src, note, !!city];
const L = (code, city, conf, src, note) => ["local", code, city, conf, src, note, !!city];
const LR = (code, note, src = REG, conf = "medium") => ["local", code, null, conf, src, `${note} Provincia dal registro CvdM; nessun indirizzo ufficiale estratto, nessun pin.`];
const U = (src, note) => ["unknown", null, null, "low", src, note];

const T = {
  // --- regional public broadcasters (13 + extra channels) ---
  "OmropFryslan.nl": R("NL-FR", "Leeuwarden", "https://www.omropfryslan.nl/fy/privacy-statement", "Emittente pubblica regionale della Frisia; indirizzo 8903 JP Leeuwarden."),
  "RTVNoord.nl": R("NL-GR", "Groningen", "https://www.rtvnoord.nl/over-ons/contactgegevens", "Emittente pubblica regionale di Groningen; indirizzo 9728 JT Groningen."),
  "RTVNoordExtra.nl": R("NL-GR", "Groningen", "https://www.rtvnoord.nl/over-ons/contactgegevens", "Secondo canale di RTV Noord; indirizzo 9728 JT Groningen."),
  "RTVDrenthe.nl": R("NL-DR", "Assen", "https://www.rtvdrenthe.nl/omroep/contactgegevens", "Emittente pubblica regionale del Drenthe; indirizzo 9401 PL Assen."),
  "RTVOost.nl": R("NL-OV", "Hengelo", "https://www.oost.nl/contact", "Emittente pubblica regionale dell'Overijssel; indirizzo 7556 BM Hengelo."),
  "OmroepGelderland.nl": R("NL-GE", "Arnhem", "https://www.gld.nl/contact", "Emittente pubblica regionale della Gheldria; indirizzo 6824 KV Arnhem."),
  "OmroepFlevoland.nl": R("NL-FL", "Lelystad", "https://www.omroepflevoland.nl/info/contact", "Emittente pubblica regionale del Flevoland; indirizzo 8218 NK Lelystad."),
  "RTVUtrecht.nl": R("NL-UT", "Utrecht", "https://www.rtvutrecht.nl/contact", "Emittente pubblica regionale di Utrecht; indirizzo 3572 KH Utrecht."),
  "NH.nl": R("NL-NH", null, "https://www.nhnieuws.nl/contact", "Emittente pubblica regionale del Noord-Holland; la pagina contatti riporta solo telefono, nessun pin."),
  "OmroepWest.nl": R("NL-ZH", "Den Haag", "https://www.omroepwest.nl/contact", "Emittente pubblica regionale (Zuid-Holland ovest); indirizzo 2495 AJ Den Haag."),
  "RTVRijnmond.nl": R("NL-ZH", "Rotterdam", "https://www.rijnmond.nl/contact", "Emittente pubblica regionale (Rotterdam-Rijnmond); indirizzo 3024 EA Rotterdam."),
  "RTVRijnmondExtra.nl": R("NL-ZH", "Rotterdam", "https://www.rijnmond.nl/contact", "Secondo canale di Rijnmond; indirizzo 3024 EA Rotterdam."),
  "OmroepZeeland.nl": R("NL-ZE", "Oost-Souburg", "https://www.omroepzeeland.nl/contact", "Emittente pubblica regionale della Zelanda; indirizzo 4388 BP Oost-Souburg."),
  "OmroepBrabant.nl": R("NL-NB", "Son", "https://www.omroepbrabant.nl/adresencontactgegevens", "Emittente pubblica regionale del Brabante; sede 5692 EL Son (posta 5600 AC Eindhoven)."),
  "OmroepBrabantRadio.nl": R("NL-NB", "Son", "https://www.omroepbrabant.nl/adresencontactgegevens", "Visual radio di Omroep Brabant; sede 5692 EL Son."),
  "L1TV.nl": R("NL-LI", "Maastricht", "https://www.l1.nl/contact", "Emittente pubblica regionale del Limburgo; indirizzo 6226 AW Maastricht."),

  // --- national ---
  "BVN.nl": N("https://www.bvn.tv/contact/", "Canale internazionale della NPO per olandesi e fiamminghi all'estero; sede Hilversum.", "Hilversum", "high"),
  "BNRNieuwsradio.nl": N("https://www.bnr.nl/", "Radio all-news nazionale (visual radio); sito 403 dall'Italia.", null, "medium"),
  "Qmusic.nl": N("https://qmusic.nl", "Radio nazionale DPG Media (visual radio).", null, "high"),
  "Radio10.nl": N("https://www.radio10.nl/", "Radio nazionale Talpa (visual radio).", null, "high"),
  "Radio538.nl": N("https://www.538.nl/over-538", "Radio nazionale Talpa (visual radio).", null, "high"),
  "RadioNLTV.nl": N("https://radionl.fm/radionl-tv", "Visual radio di RadioNL, diffusione nazionale.", null, "medium"),
  "SBS6Classics.nl": N("https://www.kijk.nl/programmas/sbs6-classics-247", "Canale FAST nazionale Talpa (fuori ambito sorgenti).", null, "high"),
  "History.nl": N("https://www.history.nl/nl", "Canale tematico A+E per Paesi Bassi e Fiandre.", null, "medium"),
  "TMF.nl": N(IPTV, "Canale musicale FAST nazionale (Paramount).", null, "low"),
  "TweedeKamerActualiteitenkanaal.nl": N("https://www.tweedekamer.nl/contact_en_bezoek/contact", "Parlamento nazionale; sede 2595 BD Den Haag.", "Den Haag", "high"),
  "INFAST.nl": N("https://www.insight.tv/about-us", "Canale FAST di Insight TV; sede 1076 EE Amsterdam, distribuzione internazionale.", "Amsterdam", "high"),
  "INTRAVEL.nl": N("https://www.insight.tv/about-us", "Canale FAST di Insight TV; sede Amsterdam.", "Amsterdam", "high"),
  "InTrouble.nl": N("https://www.insight.tv/about-us", "Canale FAST di Insight TV; sede Amsterdam.", "Amsterdam", "high"),
  "INWILD.nl": N("https://www.insight.tv/about-us", "Canale FAST di Insight TV; sede Amsterdam.", "Amsterdam", "high"),
  "InWonder.nl": N("https://www.insight.tv/about-us", "Canale FAST di Insight TV; sede Amsterdam.", "Amsterdam", "high"),
  "360TuneBox.nl": N("http://360tunebox.com/about-us", "Canale tematico internazionale (gruppo SPI/Filmbox); nessuna area locale.", null, "low"),
  "DocuBox.nl": N("https://docuboxlive.com/", "Canale tematico internazionale (gruppo SPI/Filmbox); nessuna area locale.", null, "low"),
  "FashionBox.nl": N(IPTV, "Canale tematico internazionale (gruppo SPI/Filmbox); sito non raggiungibile.", null, "low"),
  "FastFunBox.nl": N("https://spiintl.com/channels/fastandfunbox", "Canale tematico internazionale SPI; nessuna area locale.", null, "low"),
  "FightBox.nl": N("http://www.fightbox.com/", "Canale tematico internazionale (gruppo SPI/Filmbox); nessuna area locale.", null, "low"),
  "BTLTV.nl": N("https://btl-tv.com/about", "Web TV con distribuzione internazionale; indirizzo 8064 AJ Zwartsluis, nessuna copertura locale.", "Zwartsluis", "low"),
  "DanceTelevision.nl": N("https://www.dancetv.net/about.html", "Piattaforma web di musica dance, nazionale/internazionale.", null, "medium"),
  "DeepHouseDistrict.nl": N("https://www.dancetv.net/about.html", "Secondo canale di DanceTV, nazionale/internazionale.", null, "medium"),
  "FeelGoodTV.nl": N("https://www.feelgoodradio.nl/over-ons.php", "Web radio/visual radio senza area locale; indirizzo 2288 EX Rijswijk.", "Rijswijk", "medium"),
  "MagicPowerRadio.nl": N("https://www.magic-powerradio.nl/", "Web radio senza area locale documentata.", null, "low"),
  "RadioToppers.nl": N("https://www.radio-toppers.net/", "Web radio senza area locale documentata.", null, "low"),
  "Rararadio.nl": N("https://www.rararadio.org/", "Web radio musicale senza area locale; indirizzo 5617 AJ Eindhoven.", "Eindhoven", "low"),
  "JinTV.nl": N("https://jintv.net/en/contact/", "Web TV tematica senza area locale documentata.", null, "low"),
  // --- foreign ---
  "catalog:NL:horsecountrytv": F("GB", IPTV, "Canale FAST equestre britannico (feed australiano)."),
  "catalog:NL:kto": F("FR", IPTV, "Televisione cattolica francese KTO."),
  "catalog:NL:thechatshowchannel": F("GB", IPTV, "Canale FAST di Little Dot Studios (Regno Unito)."),
  "catalog:NL:waterbear": F("GB", IPTV, "Canale FAST di WaterBear Network (Regno Unito)."),
  "TVRain.nl": F("RU", "https://tvrain.tv/privacy-policy/", "Canale russo in esilio (Dozhd), licenza olandese e recapito 2509 AJ Den Haag; pubblico russofono, non locale."),

  // --- local: city from official address ---
  "1TwenteTV.nl": L("NL-OV", null, "medium", "https://www.1twente.nl/contact", "Streekomroep di Twente; la pagina contatti elenca studi ad Almelo, Hengelo e Oldenzaal, nessuna città unica, nessun pin."),
  "A1TV.nl": L("NL-GE", "Nijkerk", "high", "https://www.a1mediagroep.nl/contact-1", "Studio in Venestraat 42, 3861 BX Nijkerk."),
  "AltenaTV.nl": L("NL-NB", "Nieuwendijk", "high", "https://www.radioafm.nl/contact/", "Omroep del comune di Altena (radio AFM); indirizzo 4255 HZ Nieuwendijk."),
  "BEATTV.nl": L("NL-NH", "Heiloo", "medium", "https://beatfm.nl/beat/contact", "Emittente di Heiloo; indirizzo 1851 MW Heiloo."),
  "BR6TV.nl": ["local", "NL-ZH", null, "medium", "https://rtvmiddenholland.nl/br6-homepage/", "Omroep di Bodegraven-Reeuwijk (Zuid-Holland, registro CvdM); il recapito pubblicato è di RTV Midden Holland a Woerden (Utrecht), quindi città non assegnata e nessun pin."],
  "DenHaagTV.nl": L("NL-ZH", "Den Haag", "high", "https://www.denhaagfm.nl/contact", "Stadsomroep Den Haag; indirizzi 2511 BT e 2495 AJ Den Haag."),
  "DitisHelmond.nl": L("NL-NB", "Helmond", "high", "https://ditishelmond.nl/contact/", "Omroep locale di Helmond; indirizzo 5701 MZ Helmond."),
  "GigantFM.nl": L("NL-DR", "Veenoord", "medium", "https://www.gigantfm.nl/contact", "Radio/TV del sud-est del Drenthe; indirizzo 7844 NP Veenoord."),
  "Haarlem105TV.nl": L("NL-NH", "Haarlem", "high", "https://haarlem105.nl/contact/", "Omroep locale di Haarlem; indirizzo 2015 BK Haarlem."),
  "IdeaalTV.nl": L("NL-GE", "Zelhem", "high", "https://www.rtvideaal.nl/contact", "Omroep di Bronckhorst e Lochem; indirizzo 7021 CK Zelhem."),
  "KempenTV.nl": L("NL-NB", "Hapert", "high", "https://www.kempentv.nl/contact/", "Streekomroep de Kempen; indirizzo 5527 BM Hapert."),
  "LansingerlandTV.nl": L("NL-ZH", "Berkel en Rodenrijs", "high", "https://rtvlansingerland.nl/omroep/contact/", "Omroep di Lansingerland; indirizzo 2651 NZ Berkel en Rodenrijs."),
  "LINQTV.nl": L("NL-ZH", "Spijkenisse", "high", "https://www.linqmedia.nl/contact", "Omroep di Voorne aan Zee e Nissewaard; indirizzo 3208 KJ Spijkenisse."),
  "LOETV.nl": L("NL-GE", "Elburg", "high", "https://loemedia.nl/over-ons", "Omroep locale di Elburg; indirizzo 8081 XD Elburg."),
  "LokaleOmroepZeewolde.nl": L("NL-FL", "Zeewolde", "high", "https://lokaleomroepzeewolde.nl/neem-contact-op-met-loz", "Omroep locale di Zeewolde; indirizzo 3891 ZK Zeewolde."),
  "LONTV.nl": L("NL-NB", "Nuenen", "high", "https://omroepnuenen.nl/over-lon/", "Lokale Omroep Nuenen; indirizzo 5674 CC Nuenen."),
  "MerweTV.nl": L("NL-ZH", "Sliedrecht", "high", "https://merwertv.nl/over-ons/", "Omroep di Sliedrecht e Hardinxveld-Giessendam; indirizzo 3361 HJ Sliedrecht."),
  "ML5TV.nl": L("NL-LI", "Roermond", "high", "https://www.ml5.nl/contact/", "Omroep di Roermond; indirizzo 6042 GG Roermond."),
  "OmroepDommelland.nl": L("NL-NB", "Boxtel", "high", "https://www.omroepdommelland.nl/contact", "Omroep locale di Boxtel; indirizzo 5281 LB Boxtel."),
  "OmroepHoekscheWaard.nl": L("NL-ZH", "Puttershoek", "high", "https://www.omroephw.nl/over-omroep-hw/", "Omroep della Hoeksche Waard; indirizzo 3297 AT Puttershoek."),
  "OmroepLandvanCuijk.nl": L("NL-NB", "Mill", "high", "https://www.omroeplvc.nl/contact", "Streekomroep Land van Cuijk; indirizzo 5451 BM Mill."),
  "OmroepLingewaard.nl": L("NL-GE", "Bemmel", "high", "https://omroeplingewaard.nl/contact/", "Omroep di Lingewaard; indirizzo 6681 AE Bemmel."),
  "OmroepPeelrand.nl": L("NL-NB", "Beek en Donk", "high", "https://omroeppeelrand.nl/contact/", "Omroep della Peelrand; indirizzo 5741 BC Beek en Donk."),
  "OmroepTilburg.nl": L("NL-NB", "Tilburg", "high", "https://www.omroeptilburg.nl/contact/", "Omroep locale di Tilburg; indirizzo 5038 HA Tilburg."),
  "OmroepVenray.nl": L("NL-LI", "Venray", "high", "https://www.omroepvenray.nl/de-omroep/contact", "Omroep locale di Venray; indirizzo 5801 XZ Venray."),
  "OOGTV.nl": L("NL-GR", "Groningen", "high", "https://www.oogtv.nl/info/contact/", "Omroep locale di Groningen città; indirizzo 9747 AT Groningen."),
  "OPENRotterdamTV.nl": L("NL-ZH", "Rotterdam", "high", "https://openrotterdam.nl/livestream/", "Omroep locale di Rotterdam; indirizzo 3012 GH Rotterdam."),
  "ORTSTV.nl": L("NL-NB", "Oosterhout", "high", "https://orts.nl/contact/", "Omroep locale di Oosterhout; casella postale 4900 AC Oosterhout."),
  "Radio350.nl": L("NL-OV", "Rijssen", "high", "https://www.radio350.nl/contact", "Omroep di Rijssen-Holten; indirizzo 7461 BT Rijssen."),
  "RadioAalsmeerTV.nl": L("NL-NH", "Aalsmeer", "high", "https://radioaalsmeer.nl/contact/", "Omroep locale di Aalsmeer; indirizzo 1431 BD Aalsmeer."),
  "RadioJND.nl": L("NL-NB", "Best", "medium", "https://radiojnd.nl/contact", "Radio/TV con indirizzo 5683 PK Best."),
  "RPLWoerden.nl": L("NL-UT", "Woerden", "high", "https://rtvmiddenholland.nl/rpl-woerden/rpl-diversen/rpl-contact/", "Omroep locale di Woerden; indirizzo 3443 GE Woerden."),
  "RTVGO.nl": L("NL-GR", "Vlagtwedde", "low", "https://www.westerwoldeactueel.nl/over-ons/", "rtvgo.nl rimanda a Westerwolde Actueel; indirizzo 9541 AL Vlagtwedde. Identità del canale da confermare."),
  "RTVHorizon.nl": L("NL-NB", "Maarheeze", "high", "https://www.rtvhorizon.nl/colofon", "Omroep di Cranendonck, Heeze-Leende e Valkenswaard; indirizzo 6026 CL Maarheeze."),
  "RTVLOVE.nl": L("NL-NH", "Volendam", "high", "https://www.rtvlove.nl/over-love/", "Omroep di Edam-Volendam; indirizzo 1131 BK Volendam."),
  "RTVMaastricht.nl": L("NL-LI", "Maastricht", "high", "https://1zuid.nl/contact", "RTV Maastricht (1Zuid); indirizzo 6214 XN Maastricht."),
  "RTVMeppel.nl": L("NL-DR", "Meppel", "high", "https://www.rtvmeppel.nl/overons/", "Omroep locale di Meppel; indirizzo 7941 KC Meppel."),
  "RTVNOFAchtkarspelenTytsjerksteradiel.nl": L("NL-FR", "De Westereen", "medium", "https://www.rtvnof.nl/contact/", "Streekomroep Noordoost-Friesland; indirizzi 9271 CA De Westereen e 9251 MP Burgum."),
  "RTVNoordoostFriesland.nl": L("NL-FR", "De Westereen", "medium", "https://www.rtvnof.nl/contact/", "Streekomroep Noordoost-Friesland; indirizzi 9271 CA De Westereen e 9251 MP Burgum."),
  "RTVParkstad.nl": L("NL-LI", "Landgraaf", "high", "https://rtvparkstad.nl/contact/", "Omroep della Parkstad Limburg; indirizzo 6372 AP Landgraaf."),
  "RTVPurmerend.nl": L("NL-NH", "Purmerend", "high", "https://rtvpurmerend.nl/rtv-purmerend/contact", "Omroep locale di Purmerend; indirizzo 1441 EK Purmerend."),
  "RTVSLOS.nl": L("NL-OV", "Steenwijk", "high", "https://rtvslos.nl/colofon/", "Omroep di Steenwijkerland; indirizzo 8331 ED Steenwijk."),
  "RTVZulthe.nl": L("NL-GR", "Leek", "high", "https://rtvzulthe.nl/over-ons/", "Omroep di Westerkwartier e Noordenveld; indirizzo 9351 EN Leek."),
  "Salto1.nl": L("NL-NH", "Amsterdam", "high", "https://www.salto.nl/contact/", "Omroep locale di Amsterdam; indirizzo 1011 DL Amsterdam."),
  "Salto2.nl": L("NL-NH", "Amsterdam", "high", "https://www.salto.nl/contact/", "Omroep locale di Amsterdam; indirizzo 1011 DL Amsterdam."),
  "Salto4.nl": L("NL-NH", "Amsterdam", "medium", "https://www.salto.nl/contact/", "Canale Salto (stream salto-streams.nl); indirizzo Salto 1011 DL Amsterdam."),
  "SaltoADE.nl": L("NL-NH", "Amsterdam", "medium", "https://www.salto.nl/contact/", "Canale Salto (stream live.salto.nl/at5); indirizzo Salto 1011 DL Amsterdam."),
  "SaltoBrasaMusic.nl": L("NL-NH", "Amsterdam", "medium", "https://www.salto.nl/contact/", "Canale Salto; indirizzo Salto 1011 DL Amsterdam."),
  "SirisTV.nl": L("NL-NB", "Someren", "high", "https://siris.nl/meer-informatie-over-cookies", "Omroep di Someren e Asten; indirizzo 5711 GB Someren."),
  "SleutelstadTV.nl": L("NL-ZH", "Leiden", "high", "https://sleutelstad.nl/tv/", "Omroep di Leiden e dintorni; indirizzo 2312 TT Leiden."),
  "SOL2.nl": L("NL-LI", "Echt", "high", "https://sol2.nl/contact/", "Streekomroep Limburg 2 (Echt-Susteren); indirizzo 6101 JE Echt."),
  "SRCTV.nl": L("NL-GE", "Culemborg", "high", "https://www.src.fm/contact", "Omroep di Culemborg e dintorni; indirizzo 4101 NX Culemborg."),
  "StreekstadCentral.nl": L("NL-NH", "Alkmaar", "high", "https://streekstadcentraal.nl/contact", "Omroep di Alkmaar e Dijk en Waard; indirizzo 1812 PS Alkmaar."),
  "StreekTV.nl": L("NL-DR", "Zuidwolde", "medium", "https://wijzijndno.nl/over-dno/", "Il sito rimanda a DNO (De Wolden, Staphorst); indirizzo 7921 JJ Zuidwolde."),
  "TVEllef.nl": L("NL-LI", "Linne", "medium", "https://nl.tv11.nl/", "Omroep di Leudal e Maasgouw (TV11); indirizzo Markt 1, 6067 BS Linne."),
  "UStad.nl": L("NL-UT", "Utrecht", "high", "https://www.ustad.nl/contact", "Omroep locale di Utrecht città; indirizzo 3572 KH Utrecht."),
  "VechtdalTV.nl": L("NL-OV", "Nieuwleusen", "high", "https://www.rtvvechtdal.nl/vechtdalfm/contact", "Omroep di Dalfsen e Ommen; indirizzo 7711 GK Nieuwleusen."),
  "WeertFMTV.nl": L("NL-LI", "Weert", "high", "https://weertfm.nl/contact/", "Streekomroep Weert; indirizzo 6001 GV Weert."),
  "WOS.nl": L("NL-ZH", "Naaldwijk", "high", "https://wos.nl/contact", "Omroep di Westland, Maassluis e Midden-Delfland; indirizzo 2672 ZX Naaldwijk."),
  "XON.nl": L("NL-GE", "Ede", "high", "https://xon.nu/contact/", "Omroep di Ede e Veenendaal; indirizzo Molenstraat 45, 6711 AW Ede."),
  "ZO34.nl": L("NL-DR", "Emmen", "high", "https://www.zo34.nl/contact", "Omroep di Emmen e Coevorden; indirizzo 7811 EP Emmen."),
  // --- local: province from the CvdM register only ---
  "1AlmereTV.nl": LR("NL-FL", "Omroep locale di Almere (il sito si presenta come piattaforma di Almere).", "https://1almere.nl/over-1almere"),
  "LangstraatTV.nl": LR("NL-NB", "Langstraat Media (Waalwijk, Heusden, Loon op Zand, Dongen: Maasstad Omroepstichting Waalwijk)."),
  "LEOMiddelseTV.nl": LR("NL-FR", "LEO Middelsé = Omroeporganisatie Leeuwarden en Omstreken; sito leomiddelse.nl non raggiungibile."),
  "MaLive.nl": LR("NL-NH", "Web TV del Media College Amsterdam diffusa da Salto (live.salto.nl).", "https://malive.nl/"),
  "MeerTV.nl": LR("NL-LI", "Stichting Meer Vandaag (Meerssen), coerente con lo stream 'meervandaag'; sito non raggiungibile."),
  "NOOSTV.nl": LR("NL-OV", "Lokale Omroep Noord Oost Overijssel NOOS (Hardenberg); sito non raggiungibile."),
  "OmroepCentraalTV.nl": LR("NL-NB", "Omroep Centraal TV (Gemert-Bakel); sito non raggiungibile."),
  "OmroepHulst.nl": LR("NL-ZE", "Stichting Omroep Hulst; sito con certificato non valido."),
  "OmroepMeierijstad.nl": LR("NL-NB", "Stichting Omroep Meierijstad; il sito rimanda a Dtv Nieuws."),
  "OmroepOnsWestBrabant.nl": LR("NL-NB", "Streekomroep voor West Brabant (Etten-Leur, Halderberge, Moerdijk, Zundert); il sito rimanda a ZuidWest Update."),
  "OmroepSudwest.nl": LR("NL-FR", "Streekomroep Súdwest (Súdwest-Fryslân); sito non raggiungibile."),
  "OmroepVenlo.nl": LR("NL-LI", "Stichting Omroep Venlo."),
  "RegioTVDeBilt.nl": LR("NL-UT", "Lokale Omroep De Bilt; il sito rimanda a Omroep Zout, che elenca studi a Bilthoven, Zeist e Leersum."),
  "Regio90TV.nl": ["local", "NL-UT", null, "low", "https://www.omroepzout.nl/contact/", "Il sito rimanda a Omroep Zout (studi a Bilthoven, Zeist e Leersum, tutti in provincia di Utrecht); nessuna città unica, nessun pin."],
  "RN7.nl": LR("NL-GE", "Streekomroep RN7 (Nijmegen, Beuningen, Druten, Wijchen, Overbetuwe)."),
  "RTVArnhemTV.nl": LR("NL-GE", "rtvarnhem.nl rimanda a RTV Connect (Streekomroep Midden Gelderland: Arnhem, Renkum)."),
  "RTVVeluwezoomTV.nl": LR("NL-GE", "Stichting Radio & Televisie Veluwezoom (Brummen); sito non raggiungibile."),
  "RTVWesterwolde.nl": LR("NL-GR", "Lokale Omroep Westerwolde (Westerwolde, Pekela); sito non raggiungibile."),
  "SchieTV.nl": LR("NL-ZH", "Stichting SCHIE (Schiedam); sito non raggiungibile."),
  "Studio040TV.nl": LR("NL-NB", "Stichting Omroep Eindhoven en omgeving (Eindhoven, Geldrop-Mierlo, Waalre)."),
  "StudioRheden.nl": LR("NL-GE", "Stichting RTV Rheden Rozendaal."),
  "ZFMZoetermeerTV.nl": LR("NL-ZH", "Stichting Zoetermeer FM."),
  // --- unknown ---
  "HTRTV.nl": U("https://htrmedia.evtmedia.nl/index.php/tv", "HTR (Heusden) solo secondo fonti secondarie; sito non raggiungibile e Heusden è oggi nell'area di Maasstad (Waalwijk). Lasciato unknown."),
  "HypeVisualRadio.nl": U("https://www.hyperadio.nl/", "Visual radio senza sede o area documentata."),
  "RadioStaddenHaag.nl": U("https://www.radiostaddenhaag.com/", "Nessun indirizzo sul sito; l'area non si deduce dal nome."),
  "RegioTVNieuws.nl": U(IPTV, "Nessun sito ufficiale raggiungibile né area documentata."),
  "RTV1.nl": U(IPTV, "Sito rtv1.nl non raggiungibile; area non documentata."),
  "RTVRijnstreekTV.nl": U("https://rtvrijnstreek.nl/", "Il sito non riporta indirizzo né area servita."),
  "SlotstadTV.nl": U(IPTV, "Collegata a Zeist solo da directory non ufficiali; sito non raggiungibile."),

  // --- new from reports/nl-research-sources.json ---
  "AT5.nl": ["local", "NL-NH", null, "medium", "https://www.at5.nl/", "Canale cittadino di Amsterdam del gruppo NH Media; nessun indirizzo sulle pagine consultate, nessun pin."],
  "WEEFFTV.nl": L("NL-NH", "Hoorn", "high", "https://www.streekomroepwestfriesland.nl/privacy-policy/", "Streekomroep West-Friesland; indirizzo 1621 GL Hoorn."),
  "BredaNuTV.nl": LR("NL-NB", "Stichting BredaNu (Breda); l'unico recapito pubblicato è una casella postale a Oosterhout."),
  "DTVDenBosch.nl": LR("NL-NB", "Stichting DTV Den Bosch ('s-Hertogenbosch).", "https://dtvnieuws.nl/"),
  "DTVMaashorst.nl": LR("NL-NB", "Stichting Lokale Omroep Maashorst (canale Dtv).", "https://dtvnieuws.nl/"),
  "DTVOssBernheze.nl": LR("NL-NB", "Stichting Omroep Maasland (Oss, Bernheze; canale Dtv).", "https://dtvnieuws.nl/"),
  "catalog:NL:dtvringdenbosch": LR("NL-NB", "Notiziario regionale di Dtv Nieuws (area 's-Hertogenbosch).", "https://dtvnieuws.nl/kijk-en-luister/nu-live"),
  "RTVDordrecht.nl": L("NL-ZH", "Dordrecht", "high", "https://www.rtvdordrecht.nl/contact", "Omroep locale di Dordrecht; indirizzo 3313 CS Dordrecht."),
  "ZuidWestTV.nl": LR("NL-NB", "Omroepstichting ZuidWest (Bergen op Zoom, Roosendaal, Woensdrecht)."),
  "GouwestadTV.nl": L("NL-ZH", "Gouda", "high", "https://gouwestad.nl/wp/over-ons/", "Omroep di Gouda; indirizzo 2801 LT Gouda."),
  "RTVConnectTV.nl": LR("NL-GE", "Streekomroep Midden Gelderland (Arnhem, Renkum)."),
  "TweedeKamerVondelingkamer.nl": N("https://www.tweedekamer.nl/contact_en_bezoek/contact", "Parlamento nazionale; sede 2595 BD Den Haag.", "Den Haag", "high"),
  "Samen1TV.nl": L("NL-GE", "Apeldoorn", "high", "https://samen1.nl/privacyverklaring/", "Omroep di Apeldoorn; indirizzo 7311 CD Apeldoorn."),
  "catalog:NL:gooitv": L("NL-NH", "Bussum", "high", "https://www.gooitv.nl/over-ons/", "Omroep di Gooise Meren e Wijdemeren; indirizzo 1404 HN Bussum."),
  "catalog:NL:rtvfocuszwolle": LR("NL-OV", "Stichting Algemene Omroep Zwolle (RTV Focus); TV cessata nel 2023."),
};
for (const c of candidates.filter(c => c.id.startsWith("TweedeKamer") && !T[c.id]))
  T[c.id] = N("https://www.tweedekamer.nl/contact_en_bezoek/contact", "Sala della Tweede Kamer, parlamento nazionale; sede 2595 BD Den Haag.", "Den Haag", "high");

const ids = [...new Set([...candidates.map(c => c.id), ...sources.map(s => s.id)])];
const missing = ids.filter(id => !T[id]);
if (missing.length) throw new Error(`voci mancanti: ${missing.join(", ")}`);
const extra = Object.keys(T).filter(id => !ids.includes(id));
if (extra.length) throw new Error(`voci senza candidato/fonte: ${extra.join(", ")}`);

const result = {};
for (const id of ids.sort()) {
  const [scope, regionCode, city, confidence, sourceUrl, notes, pin = false, country = "NL"] = T[id];
  const place = pin && city ? G[city] : null;
  if (pin && !place) throw new Error(`${id}: città senza GeoNames ${city}`);
  if (place && place[3] !== regionCode) throw new Error(`${id}: ${city} non è in ${regionCode}`);
  if ((scope === "regional" || scope === "local") && !regionCode) throw new Error(`${id}: ${scope} senza regionCode`);
  result[id] = {
    scope, regionCode: scope === "national" || scope === "foreign" || scope === "unknown" ? null : regionCode, extraRegions: [],
    city, province: null, countryCode: scope === "foreign" ? country : "NL",
    lat: place ? place[1] : null, lon: place ? place[2] : null,
    coordinateSourceUrl: place ? `https://www.geonames.org/${place[0]}` : null,
    confidence, sourceUrl, notes: place ? `${notes} Pin: centro abitato GeoNames, non sede esatta.` : notes,
  };
}
// The simplified province map cuts some coastal places. Never move a pin: drop it, keep the city.
const dropped = [];
for (const [id, geo] of Object.entries(result)) {
  if (geo.lat === null) continue;
  const feature = map.features.find(f => f.properties.code === geo.regionCode);
  if (!feature) throw new Error(`${id}: regione ${geo.regionCode} assente dalla mappa`);
  if (!geoContains(feature, [geo.lon, geo.lat])) {
    dropped.push(`${id} (${geo.city})`);
    Object.assign(geo, { lat: null, lon: null, coordinateSourceUrl: null });
    geo.notes = geo.notes.replace(" Pin: centro abitato GeoNames, non sede esatta.", " Pin omesso: il centro GeoNames cade fuori dal poligono semplificato della provincia.");
  }
}
for (const [id, geo] of Object.entries(result)) {
  if ((geo.scope === "regional" || geo.scope === "local") && !geo.regionCode) throw new Error(`${id}: regionCode null`);
  if (geo.lat !== null && (!geo.sourceUrl || !/^https:\/\/www\.geonames\.org\/\d+$/.test(geo.coordinateSourceUrl))) throw new Error(`${id}: prova o coordinateSourceUrl non valida`);
  if (geo.coordinateSourceUrl && /search|\?q=/.test(geo.coordinateSourceUrl)) throw new Error(`${id}: URL di ricerca`);
}
await writeFile("reports/nl-research-geography.json", JSON.stringify(result, null, 2) + "\n");
const count = key => Object.values(result).reduce((acc, g) => (acc[g[key] ?? "—"] = (acc[g[key] ?? "—"] ?? 0) + 1, acc), {});
console.log(`geography: ${Object.keys(result).length} voci, ${Object.values(result).filter(g => g.lat !== null).length} pin`);
console.log(JSON.stringify(count("scope")));
if (dropped.length) console.log(`pin omessi (fuori poligono): ${dropped.join(", ")}`);
console.log(JSON.stringify(Object.fromEntries(Object.entries(count("regionCode")).sort())));
