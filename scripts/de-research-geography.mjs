// Build the Germany geography handoff from the candidate inventory and the
// public Impressum crawl. This is research data, not a playback validator.
import { readFile, writeFile } from "node:fs/promises";
import { geoContains } from "d3-geo";

const candidates = JSON.parse(await readFile("reports/de-candidates.json", "utf8")).channels;
const imprint = JSON.parse(await readFile("/tmp/de-impressum.json", "utf8"));
const map = JSON.parse(await readFile("public/maps/germany.json", "utf8"));
const byId = new Map(imprint.map(item => [item.id, item]));

const cities = {
  Berlin: [52.5200, 13.4050, "Berlin"], Bonn: [50.7374, 7.0982, "Nordrhein-Westfalen"],
  Bremen: [53.0793, 8.8017, "Bremen"], Dortmund: [51.5136, 7.4653, "Nordrhein-Westfalen"],
  Dresden: [51.0504, 13.7373, "Sachsen"], Dessau: [51.8330, 12.2420, "Sachsen-Anhalt"],
  "Dessau-Roßlau": [51.8330, 12.2420, "Sachsen-Anhalt"], Düsseldorf: [51.2277, 6.7735, "Nordrhein-Westfalen"],
  Erfurt: [50.9848, 11.0299, "Thüringen"], Frankfurt: [50.1109, 8.6821, "Hessen"],
  "Frankfurt am Main": [50.1109, 8.6821, "Hessen"], Göppingen: [48.7035, 9.6511, "Baden-Württemberg"],
  Halle: [51.4969, 11.9688, "Sachsen-Anhalt"], "Halle (Saale)": [51.4969, 11.9688, "Sachsen-Anhalt"],
  Halberstadt: [51.8956, 11.0562, "Sachsen-Anhalt"], Hamburg: [53.5511, 9.9937, "Hamburg"],
  Hettstedt: [51.6500, 11.5167, "Sachsen-Anhalt"], Hoyerswerda: [51.4379, 14.2350, "Sachsen"],
  Ilmenau: [50.6866, 10.9140, "Thüringen"], Ismaning: [48.2333, 11.6833, "Bayern"],
  Kaiserslautern: [49.4431, 7.7689, "Rheinland-Pfalz"], Kassel: [51.3127, 9.4797, "Hessen"],
  Kiel: [54.3233, 10.1228, "Schleswig-Holstein"], Köln: [50.9375, 6.9603, "Nordrhein-Westfalen"],
  Landshut: [48.5442, 12.1469, "Bayern"], Leipzig: [51.3397, 12.3731, "Sachsen"],
  Löhne: [52.1880, 8.6950, "Nordrhein-Westfalen"], Ludwigshafen: [49.4774, 8.4452, "Rheinland-Pfalz"],
  Magdeburg: [52.1205, 11.6276, "Sachsen-Anhalt"], Marktheidenfeld: [49.8453, 9.6039, "Bayern"],
  Merseburg: [51.3590, 11.9990, "Sachsen-Anhalt"], München: [48.1351, 11.5820, "Bayern"],
  Norderstedt: [53.6850, 9.9800, "Schleswig-Holstein"], Neustadt: [49.3500, 8.1400, "Rheinland-Pfalz"],
  Oberhaching: [48.0240, 11.5970, "Bayern"], Offenbach: [50.0956, 8.7761, "Hessen"],
  Pforzheim: [48.8922, 8.6947, "Baden-Württemberg"], Potsdam: [52.3906, 13.0645, "Brandenburg"],
  Salzwedel: [52.8544, 11.1523, "Sachsen-Anhalt"], Saarbrücken: [49.2402, 6.9969, "Saarland"],
  Sangerhausen: [51.4720, 11.2950, "Sachsen-Anhalt"], Spremberg: [51.5667, 14.3833, "Brandenburg"],
  Stuttgart: [48.7758, 9.1829, "Baden-Württemberg"], Trier: [49.7499, 6.6371, "Rheinland-Pfalz"],
  Unterschleißheim: [48.2800, 11.5667, "Bayern"], Weißenfels: [51.2015, 11.9684, "Sachsen-Anhalt"],
  Wernigerode: [51.8350, 10.7860, "Sachsen-Anhalt"], Wolfsburg: [52.4227, 10.7865, "Niedersachsen"],
  Grünwald: [48.0394, 11.5232, "Bayern"], Ismaning: [48.2333, 11.6833, "Bayern"],
};
const regions = Object.fromEntries(Object.entries(cities).map(([city, [lat, lon, state]]) => [city, { lat, lon, state }]));
const codes = { "Baden-Württemberg": "DE-BW", Bayern: "DE-BY", Berlin: "DE-BE", Brandenburg: "DE-BB", Bremen: "DE-HB", Hamburg: "DE-HH", Hessen: "DE-HE", "Mecklenburg-Vorpommern": "DE-MV", Niedersachsen: "DE-NI", "Nordrhein-Westfalen": "DE-NW", "Rheinland-Pfalz": "DE-RP", Saarland: "DE-SL", Sachsen: "DE-SN", "Sachsen-Anhalt": "DE-ST", "Schleswig-Holstein": "DE-SH", Thüringen: "DE-TH" };

const national = /^(3sat|ARDalpha|arte|DasErste|DW|KiKA|One|Parlamentsfernsehen|phoenix|tagesschau24|ZDF|ZDFinfo|ZDFneo|BibelTV|Dokusat|EWTN|HopeChannel|Anixe|Aristo|Autentic|Curiosity|Deluxe|DMF|Finest|Folx|Grjngo|Horse|LightChannel|LoveThePlanet|Magenta|Motorvision|Nachrichten|QVC|Rakuten|RedBull|RiC|Schlager|Sonnenklar|Sophia|TerraMater|TheGraham|Volksmusik|WELT|WeltderWunder|WorldofFree|Xite|Zee|Zwei|Adria|OneMusic|YOL|Juwelo|HSE|Handystar|KaufBei|123tv|FIFA|Strongman|ANIMAL|Adventure)/i;
const regional = /^(BRFernsehen|catalog:DE:br|hrfernsehen|catalog:DE:hr|MDRFernsehen|catalog:DE:mdr|NDRFernsehen|catalog:DE:ndr|rbbFernsehen|catalog:DE:rbb|RadioBremen|SRFernsehen|SWRFernsehen|SWR3|catalog:DE:wdr|WDR|ARDalpha|DASDING|Unserding|NDRFernsehenInternational|SaarlandFernsehen)/i;
const local = /^(AlexBerlin|Allgau|Altenburg|Augsburg|BadenTV|BLK|Cira|ErzTV|Filstalwelle|FrankenFernsehen|Hamburg1|Kanal12|KulturMD|Lausitzwelle|MDF1|MunchenTV|Niederbayern|noa4|NRWision|Oberpfalz|OFTV|OK|PUNKTum|RAN1|RBW|RegioTV|RFH|RFO|Rockland|SachsenEins|SachsenFernsehen|SalveTV|Seenluft|Telt|Tide|TVBozsike|TVIngolstadt|TVMainfranken|TVOberfranken|TV38|TVA|TVO|TV|YOL)/i;
const cityFrom = item => {
  const addresses = byId.get(item.id)?.addresses ?? [];
  for (const value of addresses) {
    const match = value.match(/\b\d{5}\s+(.+?)\s*$/);
    if (!match) continue;
    const raw = match[1].replace(/[.,]$/, "").trim();
    if (/^(?:USt|Umsatzsteuer|E-Mail|Amtsgericht|Handelsregister|Registergericht|Inhaltlich|Tel|Germany|Komplement|Kontakt)/i.test(raw)) continue;
    const city = Object.keys(regions).find(name => raw.toLowerCase().startsWith(name.toLowerCase())) ?? raw;
    return regions[city] ? city : raw;
  }
  return null;
};
const explicitCity = id => ({ AlexBerlin: "Berlin", Hamburg1: "Hamburg", OKFlensburg: "Flensburg", OKWernigerode: "Wernigerode", RadioBremenFernsehen: "Bremen", WDRFernsehen: "Köln", RadioWeserTVBremen: "Bremen", TVBozsikeHamburgHD: "Hamburg", TideTV: "Hamburg", SaarlandFernsehen1: "Saarbrücken", SaarlandFernsehen2: "Saarbrücken" }[id.replace(/\.de$/, "")]);
const stateCodeByName = name => codes[name] ?? null;
const result = {};
for (const item of candidates) {
  const id = item.id;
  const isForeign = id === "SRF.de" || id === "catalog:DE:btltvnetherlands";
  const city = cityFrom(item) ?? explicitCity(id);
  const place = city ? regions[city] : null;
  let scope = national.test(id) ? "national" : regional.test(id) ? "regional" : local.test(id) ? "local" : "national";
  if (isForeign) scope = "foreign";
  const countryCode = id === "SRF.de" ? "CH" : id === "catalog:DE:btltvnetherlands" ? "NL" : "DE";
  let regionCode = place ? stateCodeByName(place.state) : null;
  if (/MDRSachsen|mdrsachsen/.test(id)) regionCode = "DE-SN";
  if (/mdrsachsenanhalt/.test(id)) regionCode = "DE-ST";
  if (/mdrthuringen/.test(id)) regionCode = "DE-TH";
  if (/ndrhamburg/.test(id)) regionCode = "DE-HH";
  if (/ndrmecklenburg/.test(id)) regionCode = "DE-MV";
  if (/ndrniedersachsen/.test(id)) regionCode = "DE-NI";
  if (/ndrschleswig/.test(id)) regionCode = "DE-SH";
  if (/rbbberlin/.test(id)) regionCode = "DE-BE";
  if (/rbbbrandenburg/.test(id)) regionCode = "DE-BB";
  if (/brnord|brsud/.test(id)) regionCode = "DE-BY";
  if (scope === "national" || scope === "foreign") regionCode = null;
  const evidence = byId.get(item.id)?.impressum ?? item.website ?? null;
  const hasPin = place && scope !== "national" && scope !== "foreign";
  result[id] = { scope, regionCode, extraRegions: [], city: city ?? null, province: place?.state ?? null, countryCode, lat: hasPin ? place.lat : null, lon: hasPin ? place.lon : null, coordinateSourceUrl: hasPin ? `https://www.geonames.org/search.html?q=${encodeURIComponent(city)}` : null, confidence: city ? (byId.get(item.id)?.impressum ? "high" : "medium") : "low", sourceUrl: evidence, notes: city ? `Sede ricavata dall'Impressum pubblico; ambito editoriale distinto dalla sede.${scope === "national" ? " Canale nazionale secondo il criterio dell'incarico." : ""}` : "Sede non documentata con sufficiente precisione nell'HTML pubblico consultato; nessun pin assegnato." };
}

// Editorial area evidence from the responsible Landesmedienanstalt or the
// broadcaster's official regional page. A licence/area source is sufficient
// for regionCode; it does not create a city or a coordinate.
const authority = {
  by: "https://www.blm.de/infothek/medienlandschaft/fernsehen.cfm",
  bw: "https://www.lfk.de/medien/fernsehen",
  bb: "https://www.mabb.de/aufsicht/private-rundfunkveranstalter",
  he: "https://www.lpr-hessen.de/medienaufsicht/fernsehen/",
  mv: "https://www.mm-v.de/",
  ni: "https://www.nlm.de/medienaufsicht/rundfunkveranstalter",
  nrw: "https://www.medienanstalt-nrw.de/",
  rp: "https://www.medienanstalt-rlp.de/",
  sl: "https://www.lmsaar.de/",
  sn: "https://www.slm-online.de/zulassung/veranstalter/",
  st: "https://medienanstalt-sachsen-anhalt.de/radio-tv/tv/kommerzielle-lokale-fernsehveranstalter/index.html",
  sh: "https://www.ma-hsh.de/themen/veranstalter",
  th: "https://www.tlm.de/rundfunk/veranstalter",
};
const areaOverrides = {
  AllgauTV: ["DE-BY", authority.by], AltenburgTV: ["DE-TH", authority.th], AugsburgTV: ["DE-BY", authority.by], BadenTV: ["DE-BW", authority.bw],
  BRFernsehen: ["DE-BY", "https://www.br.de/unternehmen/der-br/organisation/der-br-100.html"],
  ErzTVStollberg: ["DE-SN", authority.sn], FrankenFernsehen: ["DE-BY", authority.by],
  "catalog:DE:hr": ["DE-HE", "https://www.hr.de/unternehmen/standorte/index.html"], hrfernsehen: ["DE-HE", "https://www.hr.de/unternehmen/standorte/index.html"],
  KulturMD: ["DE-ST", authority.st], MDF1: ["DE-ST", authority.st],
  NiederbayernTV: ["DE-BY", authority.by], NiederbayernTVDeggendorfStraubing: ["DE-BY", authority.by], NiederbayernTVLandshut: ["DE-BY", authority.by], NiederbayernTVPassau: ["DE-BY", authority.by],
  OberpfalzTV: ["DE-BY", authority.by], OFTVOffenbach: ["DE-HE", "https://www.of-tv.de/impressum/"], OKFlensburg: ["DE-SH", "https://www.oksh.de/flensburg/"], OKStendal: ["DE-ST", authority.st], OK4: ["DE-RP", "https://www.ok4.tv/impressum/"],
  RBW: ["DE-ST", authority.st], RegioTVBodensee: ["DE-BW", authority.bw], RegioTVStuttgart: ["DE-BW", authority.bw], RFO: ["DE-BY", authority.by], RocklandTV: ["DE-RP", authority.rp],
  SachsenEins: ["DE-SN", authority.sn], SachsenFernsehenChemnitz: ["DE-SN", authority.sn], SachsenFernsehenDresden: ["DE-SN", authority.sn], SachsenFernsehenLeipzig: ["DE-SN", authority.sn], SalveTV: ["DE-TH", authority.th], Seenluft24: ["DE-BB", authority.bb],
  SWR3VisualRadio: ["DE-BW", "https://www.swr.de/impressum/index.html"], teltOwkanal: ["DE-BB", authority.bb], TVIngolstadt: ["DE-BY", authority.by], TVMainfranken: ["DE-BY", authority.by], TVOberfranken: ["DE-BY", authority.by], TV38SudostNiedersachen: ["DE-NI", authority.ni], TVA: ["DE-BY", authority.by], Unserding: ["DE-SL", "https://www.sr.de/sr/home/der_sr/so_sind_wir/unternehmen/impressum/index.html"], "catalog:DE:wdr": ["DE-NW", "https://www1.wdr.de/impressum/index.html"], WDR1Live: ["DE-NW", "https://www1.wdr.de/impressum/index.html"],
};
for (const [rawId, [regionCode, sourceUrl]] of Object.entries(areaOverrides)) {
  const id = rawId.includes(".") || rawId.includes(":") ? rawId : `${rawId}.de`;
  if (!result[id]) continue;
  result[id].regionCode = regionCode; result[id].sourceUrl = sourceUrl;
  result[id].notes = `Area editoriale documentata da licenza o pagina istituzionale del Land; sede e copertura sono distinte.${result[id].city ? " La città resta quella dell'Impressum." : " Nessun indirizzo sufficientemente documentato: nessun pin."}`;
}
// Cira TV could not be tied to a Land by an authoritative page in this pass.
result["CiraTV.de"].scope = "unknown"; result["CiraTV.de"].regionCode = null; result["CiraTV.de"].sourceUrl = "https://cira.tv/"; result["CiraTV.de"].notes = "Land non documentabile con una prova ufficiale consultabile; lasciato unknown come richiesto.";

Object.assign(result["NDRFernsehen.de"], { regionCode: "DE-HH", extraRegions: ["DE-NI", "DE-SH", "DE-MV"], sourceUrl: "https://www.ndr.de/fernsehen/livestream/livestream100.html", notes: "Terza rete NDR: sede ad Amburgo e copertura dei quattro Länder NDR documentata dall'area NDR." });
Object.assign(result["MDRFernsehen.de"], { regionCode: "DE-SN", extraRegions: ["DE-ST", "DE-TH"], sourceUrl: "https://www.mdr.de/tv/livestream/index.html", notes: "Terza rete MDR: sede in Sachsen e copertura Sachsen, Sachsen-Anhalt e Thüringen." });
Object.assign(result["rbbFernsehen.de"], { regionCode: "DE-BE", extraRegions: ["DE-BB"], sourceUrl: "https://www.rbb-online.de/fernsehen/livestream/", notes: "Terza rete rbb: sede a Berlino e copertura Berlin-Brandenburg." });
Object.assign(result["SWRFernsehenHD.de"], { regionCode: "DE-BW", extraRegions: ["DE-RP"], sourceUrl: "https://www.swr.de/swrfernsehen/livestream/index.html", notes: "Terza rete SWR: sede in Baden-Württemberg e copertura Baden-Württemberg/Rheinland-Pfalz." });
Object.assign(result["SWRFernsehenRheinlandPfalz.de"], { regionCode: "DE-RP", extraRegions: [], sourceUrl: "https://www.swr.de/swrfernsehen/rheinland-pfalz/index.html", notes: "Edizione regionale SWR per il solo Rheinland-Pfalz." });
result["SWRFernsehenRheinlandPfalz.de"].city = null; result["SWRFernsehenRheinlandPfalz.de"].province = null; result["SWRFernsehenRheinlandPfalz.de"].lat = null; result["SWRFernsehenRheinlandPfalz.de"].lon = null; result["SWRFernsehenRheinlandPfalz.de"].coordinateSourceUrl = null;
Object.assign(result["NDRFernsehenInternational.de"], { scope: "national", regionCode: null, extraRegions: [], notes: "Feed internazionale rivolto all'estero: trattato come nazionale/online, non come copertura regionale NDR." });
result["NDRFernsehenInternational.de"].city = null; result["NDRFernsehenInternational.de"].province = null; result["NDRFernsehenInternational.de"].lat = null; result["NDRFernsehenInternational.de"].lon = null; result["NDRFernsehenInternational.de"].coordinateSourceUrl = null;

// These five records had a city/pin inferred from a name or an address without
// retaining the address URL. Remove the pin rather than leave unverifiable evidence.
for (const id of ["AlexBerlin.de", "Hamburg1.de", "SaarlandFernsehen1.de", "SaarlandFernsehen2.de", "TideTV.de"]) {
  result[id].city = null; result[id].province = null; result[id].lat = null; result[id].lon = null; result[id].coordinateSourceUrl = null;
}
const geonames = {
  Berlin: "2950159/berlin.html", Weißenfels: "2811899/weissenfels.html", Stuttgart: "2825297/stuttgart.html", Göppingen: "2919054/goeppingen.html", Hamburg: "2911298/hamburg.html", Spremberg: "2830085/spremberg.html", Hoyerswerda: "2898304/hoyerswerda.html", Leipzig: "2879139/leipzig.html", München: "2867714/munich.html", Norderstedt: "2862026/norderstedt.html", Dortmund: "2935517/dortmund.html", Dessau: "2937959/dessau.html", Kaiserslautern: "2894003/kaiserslautern.html", Kassel: "2892518/kassel.html", Kiel: "2891122/kiel.html", Magdeburg: "2874545/magdeburg.html", Merseburg: "2871736/merseburg.html", Salzwedel: "2842112/hansestadt-salzwedel.html", Trier: "2821164/trier.html", Neustadt: "2864054/neustadt-an-der-weinstrasse.html", Ludwigshafen: "2875376/ludwigshafen-am-rhein.html", Hettstedt: "2905206/hettstedt.html", Bremen: "2944388/bremen.html", Halberstadt: "2911665/halberstadt.html", Saarbrücken: "2842647/saarbruecken.html", Köln: "2886242/koeln.html", Wernigerode: "2810808/wernigerode.html" };
for (const geo of Object.values(result)) if (geo.lat !== null && geonames[geo.city]) geo.coordinateSourceUrl = `https://www.geonames.org/${geonames[geo.city]}`;
Object.assign(result, {
  "catalog:DE:hdl-tv": { scope: "local", regionCode: "DE-ST", extraRegions: [], city: null, province: null, countryCode: "DE", lat: null, lon: null, coordinateSourceUrl: null, confidence: "medium", sourceUrl: "https://medienanstalt-sachsen-anhalt.de/radio-tv/tv/kommerzielle-lokale-fernsehveranstalter/hdl-tv.html", notes: "Locale autorizzata dalla MSA; la pagina ufficiale non documenta un indirizzo comunale né una sorgente live usabile." },
  "catalog:DE:tvhalle": { scope: "local", regionCode: "DE-ST", extraRegions: [], city: null, province: null, countryCode: "DE", lat: null, lon: null, coordinateSourceUrl: null, confidence: "medium", sourceUrl: "https://www.msa-online.de/radio-tv/tv/kommerzielle-lokale-fernsehveranstalter/index.html", notes: "TV locale citata nell'elenco ufficiale MSA; sede e diretta pubblica non sufficientemente documentate nell'HTML consultato." },
  "catalog:DE:tvditfurt": { scope: "local", regionCode: "DE-ST", extraRegions: [], city: "Ditfurt", province: null, countryCode: "DE", lat: null, lon: null, coordinateSourceUrl: null, confidence: "high", sourceUrl: "https://medienanstalt-sachsen-anhalt.de/radio-tv/tv/kommerzielle-lokale-fernsehveranstalter/tv-d-fernsehen-ditfurt.html", notes: "Sede Ditfurt documentata dalla pagina MSA; nessun pin senza una coordinata comunale da fonte GeoNames/Wikidata." }
});
for (const [id, geo] of Object.entries(result)) {
  if (!geo.lat || !geo.lon) continue;
  const feature = map.features.find(f => f.properties.code === geo.regionCode);
  if (!feature || !geoContains(feature, [geo.lon, geo.lat])) throw new Error(`${id}: coordinate fuori dal poligono ${geo.regionCode}`);
}
await writeFile("reports/de-research-geography.json", JSON.stringify(result, null, 2) + "\n");
console.log(`geography: ${Object.keys(result).length} entries, ${Object.values(result).filter(x => x.lat !== null).length} pins`);
