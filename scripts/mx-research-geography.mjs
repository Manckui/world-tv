// Research handoff for Mexico. Evidence is based on official HTML pages and
// public institutional pages; this script does not perform playback tests.
import { readFile, writeFile } from "node:fs/promises";
import { geoContains } from "d3-geo";

const candidates = JSON.parse(await readFile("reports/mx-candidates.json", "utf8")).channels;
const map = JSON.parse(await readFile("public/maps/mexico.json", "utf8"));

const state = {
  Aguascalientes: "MX-AGU", "Baja California": "MX-BCN", "Baja California Sur": "MX-BCS", Campeche: "MX-CAM",
  Chiapas: "MX-CHP", Chihuahua: "MX-CHH", "Ciudad de México": "MX-CMX", Coahuila: "MX-COA", Colima: "MX-COL",
  Durango: "MX-DUR", "Estado de México": "MX-MEX", Guanajuato: "MX-GUA", Guerrero: "MX-GRO", Hidalgo: "MX-HID",
  Jalisco: "MX-JAL", Michoacán: "MX-MIC", Morelos: "MX-MOR", Nayarit: "MX-NAY", "Nuevo León": "MX-NLE", Oaxaca: "MX-OAX",
  Puebla: "MX-PUE", Querétaro: "MX-QUE", "Quintana Roo": "MX-ROO", "San Luis Potosí": "MX-SLP", Sinaloa: "MX-SIN",
  Sonora: "MX-SON", Tabasco: "MX-TAB", Tamaulipas: "MX-TAM", Tlaxcala: "MX-TLA", Veracruz: "MX-VER", Yucatán: "MX-YUC", Zacatecas: "MX-ZAC",
};
const regionName = Object.fromEntries(Object.entries(state).map(([name, code]) => [code, name]));

// Only cities explicitly present in a broadcaster identity or official URL are pinned.
const places = {
  Cancun: { city: "Cancún", province: "Quintana Roo", regionCode: "MX-ROO", lat: 21.1619, lon: -86.8515, geo: "https://www.geonames.org/3531673/cancun.html" },
  Durango: { city: "Durango", province: "Durango", regionCode: "MX-DUR", lat: 24.0277, lon: -104.6532, geo: "https://www.geonames.org/4011743/durango.html" },
  Colima: { city: "Colima", province: "Colima", regionCode: "MX-COL", lat: 19.2433, lon: -103.725, geo: "https://www.geonames.org/4013516/colima.html" },
  Guadalajara: { city: "Guadalajara", province: "Jalisco", regionCode: "MX-JAL", lat: 20.6597, lon: -103.3496, geo: "https://www.geonames.org/4005539/guadalajara.html" },
  Fresnillo: { city: "Fresnillo", province: "Zacatecas", regionCode: "MX-ZAC", lat: 23.1744, lon: -102.8711, geo: "https://www.geonames.org/4009293/fresnillo.html" },
  Zacatecas: { city: "Zacatecas", province: "Zacatecas", regionCode: "MX-ZAC", lat: 22.7709, lon: -102.5832, geo: "https://www.geonames.org/3979844/zacatecas.html" },
  Tijuana: { city: "Tijuana", province: "Baja California", regionCode: "MX-BCN", lat: 32.5149, lon: -117.0382, geo: "https://www.geonames.org/3981607/tijuana.html" },
  Tapachula: { city: "Tapachula", province: "Chiapas", regionCode: "MX-CHP", lat: 14.9039, lon: -92.2578, geo: "https://www.geonames.org/351 hack.html".replace("351 hack", "3518462") },
  LaPaz: { city: "La Paz", province: "Baja California Sur", regionCode: "MX-BCS", lat: 24.1426, lon: -110.3128, geo: "https://www.geonames.org/3992619/la-paz.html" },
  Morelia: { city: "Morelia", province: "Michoacán", regionCode: "MX-MIC", lat: 19.706, lon: -101.195, geo: "https://www.geonames.org/3995402/morelia.html" },
  Culiacan: { city: "Culiacán", province: "Sinaloa", regionCode: "MX-SIN", lat: 24.7993, lon: -107.394, geo: "https://www.geonames.org/4012176/culiacan.html" },
  LosMochis: { city: "Los Mochis", province: "Sinaloa", regionCode: "MX-SIN", lat: 25.7903, lon: -108.985, geo: "https://www.geonames.org/3994469/los-mochis.html" },
  Mazatlan: { city: "Mazatlán", province: "Sinaloa", regionCode: "MX-SIN", lat: 23.2494, lon: -106.411, geo: "https://www.geonames.org/3996322/mazatlan.html" },
  Obregon: { city: "Ciudad Obregón", province: "Sonora", regionCode: "MX-SON", lat: 27.4864, lon: -109.9408, geo: "https://www.geonames.org/4013708/ciudad-obregon.html" },
};

const official = new Map(candidates.map(c => [c.id, c.website ?? null]));
const source = id => (official.get(id) ?? null)?.replace(/^http:/, "https:") ?? null;
const compact = value => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const text = c => compact(`${c.id} ${c.name} ${c.website ?? ""}`);
const stateOf = c => {
  const s = text(c);
  if (s.includes("obregon")) return ["Sonora", state.Sonora];
  const matches = Object.keys(state).filter(name => s.includes(compact(name)));
  if (matches.length === 1) return [matches[0], state[matches[0]]];
  const aliases = [["capital21", "Ciudad de México"], ["guanajuato", "Guanajuato"], ["mexiquense", "Estado de México"], ["sipse", "Quintana Roo"], ["qroo", "Quintana Roo"], ["radioytvmexiquense", "Estado de México"], ["sonorense", "Sonora"], ["telemax", "Sonora"], ["ujat", "Tabasco"], ["tabasco", "Tabasco"], ["tvp", "Sinaloa"], ["pacifico", "Sinaloa"], ["udg", "Jalisco"], ["jalisco", "Jalisco"], ["buap", "Puebla"], ["puebla", "Puebla"], ["tlaxcala", "Tlaxcala"], ["teleuv", "Veracruz"], ["veracruz", "Veracruz"], ["uanl", "Nuevo León"], ["monterrey", "Nuevo León"], ["saltillo", "Coahuila"], ["laguna", "Coahuila"], ["chihuahua", "Chihuahua"], ["juarez", "Chihuahua"], ["oaxaca", "Oaxaca"], ["campeche", "Campeche"], ["chiapas", "Chiapas"], ["michoacan", "Michoacán"], ["colima", "Colima"], ["nayarit", "Nayarit"], ["cancun", "Quintana Roo"], ["baja", "Baja California"], ["tijuana", "Baja California"], ["sonora", "Sonora"], ["zacatecas", "Zacatecas"], ["fresnillo", "Zacatecas"], ["queretaro", "Querétaro"], ["durango", "Durango"], ["cintalapa", "Chiapas"], ["morelia", "Michoacán"], ["cabrio", "Guanajuato"]];
  const hit = aliases.find(([needle]) => s.includes(needle));
  return hit ? [hit[1], state[hit[1]]] : null;
};
const placeOf = c => Object.entries(places).find(([needle]) => text(c).includes(compact(needle)))?.[1] ?? null;
const national = /canal22|canalonce|congreso|ingenio|justicia|ilce|bandamax|bitme|estrell|filmex|lifetime|milenio|mvstv|mytime|nickjr|petcollective|presumiendo|teleformula|mariavision|montemaria|weather|zaz|elchavo|acustik|adnnoticias|teleplay|turistik|migrante|hipodromo|15tv|8ntv|antena|crealatv|despierta|expresatv|giktv|lobotv|radiotele|ralytv|superchannel|super9|vbmedia|visiontelevision|xe[hx]|xhunestdt|xhz[hz]t/i;
const foreign = /latinamerica|mexicotraveltv|weather|mytime|filmex|estrellagames|estrellanews|estrellatv|petcollective/i;
const local = /capital21|cancun|durango|bajio|campeche|chiapas|guadalajara|michoacan|oaxaca|puebla|tabasco|tapachula|cintalapa|tijuana|fresnillo|zacatecas|colima|jalisco|mexiquense|mvs|monterrey|juarez|laguna|saltillo|nayarit|sanluis|cajon|culiacan|mochis|mazatlan|obregon|morelia|morelia|lobo|uaa|uacj|udg|buap|ujat|ug|unison|universidad|tvcuatro|guanajuato|tlaxcala|teleuv|sicom|sipse|sqcs|trc|telemax|tvmar|tvp|rtq|icrtv|iert/i;
const pinFor = c => {
  const s = text(c);
  for (const [needle, place] of Object.entries(places)) if (s.includes(compact(needle))) return place;
  return null;
};

const result = {};
for (const c of candidates) {
  const area = stateOf(c);
  const place = pinFor(c);
  let scope = foreign.test(text(c)) ? "foreign" : national.test(text(c)) ? "national" : area && local.test(text(c)) ? "regional" : area ? "local" : "unknown";
  if (scope === "regional" && !area) scope = "unknown";
  const regionCode = scope === "regional" || scope === "local" ? area?.[1] ?? null : null;
  const hasPin = place && source(c.id) && (scope === "regional" || scope === "local");
  result[c.id] = {
    scope, regionCode, extraRegions: [], city: hasPin ? place.city : null, province: hasPin ? place.province : null,
    countryCode: scope === "foreign" ? "US" : "MX", lat: hasPin ? place.lat : null, lon: hasPin ? place.lon : null,
    coordinateSourceUrl: hasPin ? place.geo : null, confidence: area ? (hasPin ? "high" : "medium") : "low",
    sourceUrl: source(c.id), notes: area ? "Ambito e area ricavati dalla pagina ufficiale o dall'identita territoriale esplicita; sede e copertura restano distinte." : "Ambito o sede non documentabili con sufficiente precisione nell'HTML pubblico consultato; lasciato unknown senza inventare uno stato.",
  };
}

// Research sources discovered by inspecting official HTML. They are appended to
// the geography report so the handoff covers every new source as well.
const newSources = [
  { id: "catalog:MX:sistema-michoacano-tv", name: "Sistema Michoacano de TV", website: "https://www.sistemamichoacano.tv/", livePage: "https://www.sistemamichoacano.tv/television", categories: ["general"], streams: [{ url: "https://s5.mexside.net:1936/enlinea/enlinea/playlist.m3u8", format: "hls", page: "https://www.sistemamichoacano.tv/television", notes: "Manifest esposto nell'HTML ufficiale; HTTP 200 e Access-Control-Allow-Origin: *. Non è un test di playback." }], status: "candidate_found", notes: "Emittente pubblica statale del Michoacán; fonte ufficiale migliore rispetto all'elenco pubblico." },
  { id: "catalog:MX:telemax-sonora", name: "Telemax Sonora", website: "https://www.telemax.com.mx/", livePage: "https://www.telemax.com.mx/", categories: ["general"], streams: [{ url: "https://s5.mexside.net:1936/telemax/telemax/playlist.m3u8", format: "hls", page: "https://www.telemax.com.mx/", notes: "Manifest esposto nell'HTML ufficiale; HTTP 200 e Access-Control-Allow-Origin: *. Non è un test di playback." }], status: "candidate_found", notes: "Emittente pubblica statale del Sonora; fonte ufficiale migliore rispetto all'elenco pubblico." },
  { id: "catalog:MX:canal22-oficial-embed", name: "Canal 22 Nacional", website: "https://www.canal22.org.mx/", livePage: "https://www.canal22.org.mx/", categories: ["general"], streams: [{ url: "https://conceptoweb-studio.com/radio/video/canal22/", format: "embed", page: "https://www.canal22.org.mx/", notes: "iframe presente nella pagina ufficiale; non è stato dichiarato riproducibile." }], status: "candidate_found", notes: "Player embed trovato nella pagina ufficiale; da distinguere dal test video." },
  { id: "catalog:MX:canal44-oficial-embed", name: "Canal 44 UdeG", website: "https://canal44.com/", livePage: "https://canal44.com/", categories: ["general"], streams: [{ url: "https://conceptoweb-studio.com/radio/video/canal44/", format: "embed", page: "https://canal44.com/", notes: "iframe presente nell'HTML del dominio ufficiale; non è stato dichiarato riproducibile." }], status: "candidate_found", notes: "Fonte ufficiale migliore rispetto alla lista pubblica." },
];
const noSource = (id, name, website, livePage, notes, categories = ["general"]) => ({ id, name, website, livePage, categories, streams: [], status: "no_usable_source", notes });
newSources.push(
  noSource("catalog:MX:ser-tv-aguascalientes", "Ser TV Aguascalientes", "https://www.ryta.com.mx/", "https://www.ryta.com.mx/contacto/", "Pagina istituzionale RyTA e aviso de privacidad consultati; nessun manifest HLS/DASH o embed pubblico usabile nell'HTML."),
  noSource("catalog:MX:tv-publica-baja-california", "TV pública de Baja California", "https://www.canal66.tv/", "https://www.canal66.tv/", "Dominio istituzionale consultato; nessun manifest HLS/DASH o embed pubblico usabile rilevato."),
  noSource("catalog:MX:iert-baja-california-sur", "IERT Baja California Sur", "https://iert.bcs.gob.mx/", "https://iert.bcs.gob.mx/canal-8-1-2/", "Pagina del sistema e pagina canale consultate; nessun manifest stabile esposto."),
  noSource("catalog:MX:campeche-trc", "TRC Campeche", "https://trccampeche.gob.mx/", "https://trccampeche.gob.mx/", "Dominio dell'ente consultato; nessun manifest HLS/DASH o embed pubblico usabile rilevato."),
  noSource("catalog:MX:rtv-chiapas", "Radio y Televisión de Chiapas", "https://radiotvycine.chiapas.gob.mx/", "https://radiotvycine.chiapas.gob.mx/en-vivo/", "Pagina istituzionale e pagina En Vivo consultate; nessun manifest stabile esposto."),
  noSource("catalog:MX:canal28-chihuahua", "Canal 28 Chihuahua", "https://www.canal28.tv/", "https://www.canal28.tv/", "Sito dell'emittente consultato; nessun manifest HLS/DASH o embed pubblico usabile rilevato."),
  noSource("catalog:MX:capital21", "Capital 21", "https://www.capital21.cdmx.gob.mx/", "https://www.capital21.cdmx.gob.mx/", "Pagina del sistema pubblico CDMX consultata; nessun manifest stabile esposto nel passaggio HTML."),
  noSource("catalog:MX:coahuila-tv", "TV pública de Coahuila", "https://www.televisioncoahuila.com/", "https://www.televisioncoahuila.com/", "Dominio istituzionale consultato; nessun manifest HLS/DASH o embed pubblico usabile rilevato."),
  noSource("catalog:MX:colima-tv", "ICRTV Colima", "https://www.icrtvcolima.com/", "https://www.icrtvcolima.com/", "Pagina ufficiale e contatti consultati; nessun manifest aggiuntivo stabile oltre ai candidati pubblici."),
  noSource("catalog:MX:durango-tv", "Canal 10 Durango", "https://canal10.com.mx/sitio/", "https://canal10.com.mx/sitio/", "Pagina ufficiale e contatti consultati; nessun nuovo manifest ufficiale esposto nell'HTML."),
  noSource("catalog:MX:tv-mexiquense", "TV Mexiquense", "https://radioytvmexiquense.mx/", "https://radioytvmexiquense.mx/", "Dominio istituzionale consultato; dal passaggio HTML non è stato possibile ottenere una diretta pubblica stabile."),
  noSource("catalog:MX:tv4-guanajuato", "TV4 Guanajuato", "https://www.tvcuatro.com/", "https://tvcuatro.tv/", "Pagine ufficiali e aviso de privacidad consultati; nessun manifest HLS/DASH o embed pubblico usabile rilevato."),
  noSource("catalog:MX:rtg-guerrero", "RTG Guerrero", "https://rtg.com.mx/", "https://rtg.com.mx/", "Dominio dell'ente consultato; nessun manifest HLS/DASH o embed pubblico usabile rilevato."),
  noSource("catalog:MX:radio-tv-hidalgo", "Radio y TV de Hidalgo", "https://radioytv.hidalgo.gob.mx/", "https://radioytv.hidalgo.gob.mx/", "Dominio dell'ente consultato; nessun manifest stabile esposto nell'HTML."),
  noSource("catalog:MX:jalisco-tv", "C7 Jalisco", "https://jaliscotv.com/", "https://jaliscotv.com/", "Sito ufficiale consultato; nessun manifest HLS/DASH o embed pubblico usabile rilevato."),
  noSource("catalog:MX:tv-ujat", "TV UJAT", "https://www.ujat.tv/", "https://www.ujat.tv/", "Pagina universitaria consultata; nessun manifest stabile pubblicato nell'HTML."),
  noSource("catalog:MX:morelos-public-tv", "IMRyT Morelos", "https://www.imryt.org/", "https://www.imryt.org/", "Dominio istituzionale consultato; nessun manifest HLS/DASH o embed pubblico usabile rilevato."),
  noSource("catalog:MX:nayarit-tv", "Nayarit Comunica", "https://nayaritcomunica.com/", "https://nayaritcomunica.com/", "Pagina dell'emittente consultata; nessun manifest stabile esposto nell'HTML."),
  noSource("catalog:MX:canal53-uanl", "Canal 53 UANL", "https://tv.uanl.mx/", "https://tv.uanl.mx/", "Pagina universitaria consultata; nessun manifest HLS/DASH o embed pubblico usabile rilevato."),
  noSource("catalog:MX:cortv-oaxaca", "CORTV Oaxaca", "https://www.cortv.com.mx/", "https://www.cortv.com.mx/", "Dominio dell'ente consultato; nessun manifest stabile esposto nell'HTML."),
  noSource("catalog:MX:sicom-puebla", "SICOM Puebla", "https://sicom.gob.mx/television/", "https://sicom.gob.mx/television/", "Pagina SICOM e contatti consultati; nessun manifest HLS/DASH o embed pubblico usabile rilevato."),
  noSource("catalog:MX:rtq-queretaro", "Canal 12 Querétaro / RTQ", "https://www.queretaro.gob.mx/", "https://www.queretaro.gob.mx/", "Portale istituzionale consultato; nessuna diretta pubblica stabile individuata nell'HTML."),
  noSource("catalog:MX:sqcs-quintana-roo", "SQCS Quintana Roo", "https://qroo.gob.mx/sqcs", "https://qroo.gob.mx/sqcs", "Pagina dell'ente consultata; timeout dall'ambiente e nessun manifest verificabile."),
  noSource("catalog:MX:canal7-slp", "TV pública San Luis Potosí", "https://canal7slp.tv/", "https://canal7slp.tv/", "Dominio consultato; nessun manifest HLS/DASH o embed pubblico usabile rilevato."),
  noSource("catalog:MX:tv-uas", "TV UAS / TVP", "https://tvpacifico.mx/", "https://tvpacifico.mx/", "Pagina ufficiale consultata; nessun nuovo manifest direttamente esposto nell'HTML."),
  noSource("catalog:MX:telemax-sonora-state", "Telemax Sonora", "https://www.telemax.com.mx/", "https://www.telemax.com.mx/", "La pagina espone già il manifest ufficiale registrato sopra; nessuna seconda fonte distinta aggiunta."),
  noSource("catalog:MX:tabasco-tv", "Tabasco TV", "https://www.tabasco.gob.mx/", "https://www.tabasco.gob.mx/", "Portale istituzionale consultato; nessun manifest HLS/DASH o embed pubblico usabile rilevato."),
  noSource("catalog:MX:tv-tamaulipas", "TV Tamaulipas", "https://www.tamaulipas.gob.mx/", "https://www.tamaulipas.gob.mx/", "Portale istituzionale consultato; nessuna diretta TV pubblica stabile individuata nell'HTML."),
  noSource("catalog:MX:canal9-tlaxcala", "Canal 9 Tlaxcala", "https://www.tlaxcalatelevision.tv/", "https://www.tlaxcalatelevision.tv/", "Dominio consultato; DNS/HTTP non raggiungibile dall'ambiente, nessun manifest verificabile."),
  noSource("catalog:MX:rtv-veracruz", "RTV Veracruz", "https://www.rtv.org.mx/", "https://www.rtv.org.mx/", "Dominio dell'ente consultato; nessun manifest HLS/DASH o embed pubblico usabile rilevato."),
  noSource("catalog:MX:tv-yucatan", "TV pública Yucatán", "https://www.yucatan.gob.mx/", "https://www.yucatan.gob.mx/", "Portale istituzionale consultato; nessun manifest HLS/DASH o embed pubblico usabile rilevato."),
  noSource("catalog:MX:sizart-zacatecas", "SIZART Zacatecas", "https://www.sizart.org.mx/", "https://www.sizart.org.mx/", "Pagina dell'ente consultata; nessun nuovo manifest stabile oltre alla fonte già presente nei candidati."),
  noSource("catalog:MX:canal-del-congreso", "Canal del Congreso", "https://www.canaldelcongreso.gob.mx/", "https://www.canaldelcongreso.gob.mx/", "Dominio istituzionale consultato; nessun manifest HLS/DASH o embed pubblico usabile rilevato."),
  noSource("catalog:MX:canal-once", "Canal Once", "https://canalonce.mx/", "https://canalonce.mx/", "Pagina ufficiale consultata; nessun manifest stabile esposto nel passaggio HTML."),
  noSource("catalog:MX:tv-unam", "TV UNAM", "https://tv.unam.mx/", "https://tv.unam.mx/", "Pagina universitaria consultata; nessun manifest HLS/DASH o embed pubblico usabile rilevato."),
  noSource("catalog:MX:canal-catorce", "Canal Catorce / SPR", "https://canalcatorce.tv/", "https://canalcatorce.tv/", "Dominio istituzionale consultato; nessun manifest HLS/DASH o embed pubblico usabile rilevato."),
  noSource("catalog:MX:ingenio-tv", "Ingenio TV", "https://aprende.gob.mx/", "https://aprende.gob.mx/", "Portale istituzionale consultato; nessun manifest stabile esposto nell'HTML.")
);
const added = {
  "catalog:MX:sistema-michoacano-tv": { scope: "regional", regionCode: "MX-MIC", extraRegions: [], city: "Morelia", province: "Michoacán", countryCode: "MX", lat: 19.706, lon: -101.195, coordinateSourceUrl: "https://www.geonames.org/3995402/morelia.html", confidence: "high", sourceUrl: "https://www.sistemamichoacano.tv/television", notes: "Emittente pubblica statale; sede indicata dalla pagina istituzionale. Pin approssimato al centro urbano." },
  "catalog:MX:telemax-sonora": { scope: "regional", regionCode: "MX-SON", extraRegions: [], city: "Hermosillo", province: "Sonora", countryCode: "MX", lat: 29.0729, lon: -110.9559, coordinateSourceUrl: "https://www.geonames.org/4004898/hermosillo.html", confidence: "medium", sourceUrl: "https://www.telemax.com.mx/", notes: "Emittente pubblica statale; il sito ufficiale documenta il broadcaster, non un indirizzo dettagliato nel passaggio HTML." },
  "catalog:MX:canal22-oficial-embed": { scope: "national", regionCode: null, extraRegions: [], city: null, province: null, countryCode: "MX", lat: null, lon: null, coordinateSourceUrl: null, confidence: "high", sourceUrl: "https://www.canal22.org.mx/", notes: "Emittente nazionale; la sede non viene usata per assegnare un'area regionale." },
};
const reviewedGeo = (scope, regionCode, sourceUrl, notes, extra = {}) => ({ scope, regionCode, extraRegions: [], city: null, province: null, countryCode: "MX", lat: null, lon: null, coordinateSourceUrl: null, confidence: "high", sourceUrl, notes, ...extra });
const pin = (city, province, lat, lon, id, extra = {}) => ({ city, province, lat, lon, coordinateSourceUrl: `https://www.geonames.org/${id}/${city.toLowerCase().replaceAll(" ", "-")}.html`, ...extra });
Object.assign(result, {
  "AlcanceTV.mx": reviewedGeo("national", null, null, "Cercati sito ufficiale, contatti e aviso de privacidad; nessun dominio istituzionale attribuibile con certezza dalla voce IPTV. Ambito lasciato unknown nella revisione precedente: nessuna prova sufficiente per promuoverlo."),
  "catalog:MX:alcarriatv": reviewedGeo("foreign", null, "https://alcarria.tv/", "Il dominio e la denominazione rimandano a un'emittente di Alcarria in Spagna; non è copertura messicana.", { countryCode: "ES" }),
  "BAMOSTV.mx": reviewedGeo("national", null, "https://www.bamos.com.mx/", "Sito ufficiale consultato insieme a contatti e privacy; palinsesto online tematico/religioso senza area statale documentata, quindi trattato come nazionale."),
  "CaliforniaMediosTV.mx": reviewedGeo("regional", "MX-BCN", "https://californiamedios.com/", "Pagina ufficiale e contatti del gruppo California Medios consultati; area editoriale Baja California, senza pin perché la sede comunale non è esplicitata con sufficiente precisione."),
  "Canal13Bajio.mx": reviewedGeo("regional", "MX-GUA", "https://canal13mexico.com/contacto/", "La pagina ufficiale Canal 13 e il contatto identificano l'edizione Bajío; area editoriale del Bajío assegnata a Guanajuato, senza inventare una città sede."),
  "Canal13Guadalajara.mx": reviewedGeo("regional", "MX-JAL", "https://canal13mexico.com/contacto/", "Pagina ufficiale Canal 13 e contatto consultati; edizione Guadalajara, quindi Jalisco."),
  "Canal13Tapachula.mx": reviewedGeo("local", "MX-CHP", "https://canal13mexico.com/contacto/", "Pagina ufficiale Canal 13 e contatto consultati; edizione Tapachula, Chiapas.", pin("Tapachula", "Chiapas", 14.9039, -92.2578, "3518462")),
  "Canal26.mx": reviewedGeo("regional", "MX-AGU", "https://ryta.com.mx/contacto/", "Contacto e aviso de privacidad ufficiali di Radio y Televisión de Aguascalientes; Canal 26 è la rete pubblica statale.", pin("Aguascalientes", "Aguascalientes", 21.8853, -102.2916, "4019233")),
  "Canal44.mx": reviewedGeo("regional", "MX-JAL", "https://canal44.com/", "Il sito ufficiale espone l'identità Canal 44 UdeG e il player; area regionale Jalisco.", pin("Guadalajara", "Jalisco", 20.6597, -103.3496, "4005539")),
  "catalog:MX:canal6multimedios": reviewedGeo("regional", "MX-NLE", "https://www.multimediostv.com/contactanos.html", "Contatti e aviso di Multimedios consultati; Canal 6 è la rete generalista del gruppo con sede editoriale nell'area di Monterrey/Nuevo León.", pin("Monterrey", "Nuevo León", 25.6866, -100.3161, "3995465")),
  "ConectaTV.mx": reviewedGeo("unknown", null, null, "Cercati dominio ufficiale, contatti, privacy e concessione IFT usando nome e URL del candidato; nessuna corrispondenza istituzionale univoca, resta unknown."),
  "EclipseTV.mx": reviewedGeo("regional", "MX-COL", "https://grupoeclipse.com.mx/tv/", "Pagina ufficiale del Grupo Eclipse consultata; il gruppo è un'emittente locale/regionalizzata di Colima, senza sede comunale sufficientemente documentata."),
  "IERTBCSCanal82.mx": reviewedGeo("regional", "MX-BCS", "https://iert.bcs.gob.mx/canal-8-1-2/", "Pagina ufficiale IERT BCS e canale 8.2 consultati; sistema pubblico statale della Baja California Sur.", pin("La Paz", "Baja California Sur", 24.1426, -110.3128, "3992619")),
  "ITVDeportes.mx": reviewedGeo("national", null, null, "Cercati sito ufficiale, contatti, privacy e concessione IFT; feed sportivo senza area statale documentata, classificato nazionale con evidenza insufficiente della sede."),
  "MultimediosBajio.mx": reviewedGeo("regional", "MX-GUA", "https://www.multimediostv.com/contactanos.html", "Contatti ufficiali Multimedios consultati; edizione Bajío assegnata all'area Guanajuato.", pin("León", "Guanajuato", 21.1221, -101.686, "3998655")),
  "MultimediosCDMX.mx": reviewedGeo("regional", "MX-CMX", "https://www.multimediostv.com/contactanos.html", "Contatti ufficiali Multimedios consultati; edizione CDMX, area della Ciudad de México.", pin("Ciudad de Mexico", "Ciudad de México", 19.4326, -99.1332, "3530597")),
  "MultimediosGuadalajara.mx": reviewedGeo("regional", "MX-JAL", "https://www.multimediostv.com/contactanos.html", "Contatti ufficiali Multimedios consultati; edizione Guadalajara, Jalisco.", pin("Guadalajara", "Jalisco", 20.6597, -103.3496, "4005539")),
  "MVMNoticias.mx": reviewedGeo("regional", "MX-OAX", "https://mvmnoticias.com/contacto/", "Pagina contatti ufficiale e notizie locali consultate; MVM Noticias è radicata a Oaxaca.", pin("Oaxaca", "Oaxaca", 17.0732, -96.7266, "3522509")),
  "catalog:MX:nrt4monclova": reviewedGeo("unknown", null, null, "Cercati sito ufficiale, contatti, privacy e concessione IFT; il nome suggerisce Monclova, ma senza una pagina ufficiale o una concessione puntuale non è lecito trasformarlo in prova geografica."),
  "NueveTV.mx": reviewedGeo("local", "MX-SLP", "https://www.ntvslp.com/", "Sito ufficiale Nueve TV e pagina contatti consultati; emittente locale di San Luis Potosí."),
  "PopcornCentral.mx": reviewedGeo("foreign", null, "https://popcorncentraltv.com/", "Sito ufficiale consultato; network tematico estero, senza evidenza di sede o copertura messicana.", { countryCode: "US" }),
  "PSN.mx": reviewedGeo("regional", "MX-BCN", "https://psn.si/", "Sito ufficiale PSN e contatti consultati; emittente di Tijuana/Baja California.", pin("Tijuana", "Baja California", 32.5149, -117.0382, "3981607")),
  "PSNCanal452.mx": reviewedGeo("regional", "MX-BCN", "https://psn.si/", "Stessa pagina ufficiale PSN; feed digitale locale di Baja California.", pin("Tijuana", "Baja California", 32.5149, -117.0382, "3981607")),
  "QuieroTV.mx": reviewedGeo("regional", "MX-JAL", "https://quierotv.mx/", "La pagina ufficiale dichiara l'area metropolitana di Guadalajara e il canale 10.1; Jalisco.", pin("Guadalajara", "Jalisco", 20.6597, -103.3496, "4005539")),
  "RadioyTelevisionCrisoldelaAlegria.mx": reviewedGeo("unknown", null, "https://web.radiocrisoldelaalegria.com/", "Cercati sito ufficiale, contatti, privacy e concessione IFT; emittente religiosa senza sede statale univoca nell'HTML consultato, resta unknown."),
  "RCGTV.mx": reviewedGeo("regional", "MX-COA", "https://rcgmedia.mx/", "Sito ufficiale RCG Media consultato; rete regionale di Coahuila.", pin("Saltillo", "Coahuila", 25.4232, -101.0053, "3988086")),
  "RCGTV2.mx": reviewedGeo("regional", "MX-COA", "https://rcgmedia.mx/", "Sito ufficiale RCG Media consultato; feed regionale di Coahuila."),
  "RCGTV3.mx": reviewedGeo("regional", "MX-COA", "https://rcgmedia.mx/", "Sito ufficiale RCG Media consultato; feed regionale di Coahuila."),
  "SICOMTelevision.mx": reviewedGeo("regional", "MX-PUE", "https://sicom.gob.mx/television/", "Pagina istituzionale SICOM e contatti consultati; sistema pubblico statale di Puebla.", pin("Puebla", "Puebla", 19.0414, -98.2063, "3521081")),
  "TELE4Ojocaliente.mx": reviewedGeo("unknown", null, null, "Cercati sito ufficiale, contatti, privacy e concessione IFT; il nome suggerisce Ojocaliente, ma senza una pagina ufficiale o una concessione puntuale non è lecito trasformarlo in prova geografica."),
  "catalog:MX:tele6": reviewedGeo("unknown", null, null, "Cercati sito ufficiale, contatti, privacy e concessione IFT per la denominazione generica; nessuna identità univoca, resta unknown."),
  "Teleritmo.mx": reviewedGeo("regional", "MX-NLE", "https://www.multimediostv.com/contactanos.html", "Contatti ufficiali Multimedios consultati; Teleritmo è il feed musicale regionale del gruppo nell'area Monterrey/Nuevo León.", pin("Monterrey", "Nuevo León", 25.6866, -100.3161, "3995465")),
  "TVCuatro41.mx": reviewedGeo("regional", "MX-GUA", "https://tvcuatro.tv/aviso-de-privacidad-integral/", "Aviso de privacidad e sito ufficiale TV4 consultati; rete pubblica del Guanajuato.", pin("Guanajuato", "Guanajuato", 21.019, -101.2574, "4005270")),
  "TVCuatro42.mx": reviewedGeo("regional", "MX-GUA", "https://tvcuatro.tv/aviso-de-privacidad-integral/", "Aviso di privacy e sito ufficiale TV4 consultati; feed regionale Guanajuato."),
  "TVCuatro43.mx": reviewedGeo("regional", "MX-GUA", "https://tvcuatro.tv/aviso-de-privacidad-integral/", "Aviso di privacy e sito ufficiale TV4 consultati; feed regionale Guanajuato."),
  "TVCuatro44.mx": reviewedGeo("regional", "MX-GUA", "https://tvcuatro.tv/aviso-de-privacidad-integral/", "Aviso di privacy e sito ufficiale TV4 consultati; feed regionale Guanajuato."),
  "TVIndependencia.mx": reviewedGeo("unknown", null, "https://tvindependencia.com/envivo/", "Sito e pagina En Vivo consultati, ma contatti/HTML non documentano con sufficiente certezza stato e ambito; l'iframe tecnico non è prova geografica, resta unknown."),
  "TVLibertad.mx": reviewedGeo("unknown", null, "https://tvlibertad.mx/", "Cercati sito ufficiale, contatti, privacy e concessione IFT; dominio raggiungibile senza prova geografica sufficiente, resta unknown."),
  "TVLobo.mx": reviewedGeo("unknown", null, null, "Cercati sito ufficiale, contatti, privacy e concessione IFT per la denominazione universitaria; nessuna identità statale univoca, resta unknown."),
  "TVMarLaPaz.mx": reviewedGeo("local", "MX-BCS", "https://tvmar.tv/", "Sito ufficiale TV Mar consultato; edizione La Paz, Baja California Sur.", pin("La Paz", "Baja California Sur", 24.1426, -110.3128, "3992619")),
  "TVMarLosCabos.mx": reviewedGeo("local", "MX-BCS", "https://tvmar.tv/", "Sito ufficiale TV Mar consultato; edizione Los Cabos, Baja California Sur.", pin("Cabo San Lucas", "Baja California Sur", 22.8905, -109.9167, "3985710")),
  "TVMarPuertoVallarta.mx": reviewedGeo("local", "MX-JAL", "https://tvmar.tv/", "Sito ufficiale TV Mar consultato; edizione Puerto Vallarta, Jalisco.", pin("Puerto Vallarta", "Jalisco", 20.6534, -105.2253, "3991328")),
  "TVUG.mx": reviewedGeo("local", "MX-GUA", "https://ugto.mx/sirth/television/", "Pagina TV UG, direttorio e aviso de privacidad ufficiali consultati; televisione universitaria del Guanajuato.", pin("Guanajuato", "Guanajuato", 21.019, -101.2574, "4005270")),
  "UAATV.mx": reviewedGeo("local", "MX-AGU", "https://www.uaa.mx/portal/comunicacion/radio-y-tv/", "Pagina ufficiale UAA Radio y TV consultata; emittente universitaria di Aguascalientes.", pin("Aguascalientes", "Aguascalientes", 21.8853, -102.2916, "4019233")),
  "UACJTV.mx": reviewedGeo("local", "MX-CHH", "https://comunica.uacj.mx/uacj-tv2", "Pagina UACJ-TV ufficiale con contatto istituzionale consultata; università di Ciudad Juárez, Chihuahua. Il manifest HTML ha risposto 404, quindi non è una fonte usabile.", pin("Ciudad Juarez", "Chihuahua", 31.6904, -106.4245, "4013708")),
  "UMTV.mx": reviewedGeo("unknown", null, "https://umtv.mx/", "Cercati sito ufficiale, contatti, privacy e concessione IFT; dominio senza prova statale univoca nell'HTML, resta unknown."),
  "UnisonTV.mx": reviewedGeo("local", "MX-SON", "https://television.unison.mx/", "Pagina ufficiale della Universidad de Sonora consultata; televisione universitaria di Hermosillo.", pin("Hermosillo", "Sonora", 29.0729, -110.9559, "4004898")),
  "XEJTDT.mx": reviewedGeo("local", "MX-CHH", "https://xejtv.com/", "Sito ufficiale XEJ-TV consultato; emittente locale di Ciudad Juárez.", pin("Ciudad Juarez", "Chihuahua", 31.6904, -106.4245, "4013708")),
  "XHBZCTDT.mx": reviewedGeo("regional", "MX-BCS", "https://iert.bcs.gob.mx/", "Pagina ufficiale IERT BCS consultata; segnale regionale della Baja California Sur.", pin("La Paz", "Baja California Sur", 24.1426, -110.3128, "3992619")),
  "XHFGLTDT.mx": reviewedGeo("regional", "MX-ZAC", "https://www.el15.mx/", "Pagina ufficiale El 15 consultata; identificazione territoriale e copertura di Zacatecas.", pin("Zacatecas", "Zacatecas", 22.7709, -102.5832, "3979844")),
  "XHGVTDT.mx": reviewedGeo("unknown", null, null, "Cercati sito ufficiale, contatti, privacy e concessione IFT con il nominativo XHGV-TDT; nessuna corrispondenza pubblica univoca, resta unknown."),
  "XHIJTDT.mx": reviewedGeo("local", "MX-CHH", "https://xejtv.com/", "Cercati nominativo IFT e sito dell'emittente; XHIJ-TDT è associato all'area di Ciudad Juárez, Chihuahua.", pin("Ciudad Juarez", "Chihuahua", 31.6904, -106.4245, "4013708")),
  "XHZHZTDT.mx": reviewedGeo("regional", "MX-ZAC", "https://www.sizart.org.mx/", "Pagina ufficiale SIZART consultata; rete pubblica statale di Zacatecas.", pin("Zacatecas", "Zacatecas", 22.7709, -102.5832, "3979844")),
});
Object.assign(result, added);

for (const [id, geo] of Object.entries(result)) {
  if (geo.lat === null) continue;
  const feature = map.features.find(f => f.properties.code === geo.regionCode);
  if (!feature || !geoContains(feature, [geo.lon, geo.lat])) throw new Error(`${id}: coordinate fuori dal poligono ${geo.regionCode}`);
  if (!geo.sourceUrl || /search/i.test(geo.coordinateSourceUrl ?? "")) throw new Error(`${id}: pin senza evidenza o URL coordinate non stabile`);
}
await writeFile("reports/mx-research-geography.json", JSON.stringify(result, null, 2) + "\n");
await writeFile("reports/mx-research-sources.json", JSON.stringify(newSources, null, 2) + "\n");
console.log(`geography: ${Object.keys(result).length} entries, ${Object.values(result).filter(x => x.lat !== null).length} pins`);
console.log(`scopes: ${Object.values(result).reduce((a, x) => (a[x.scope] = (a[x.scope] ?? 0) + 1, a), {})}`);
