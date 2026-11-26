import { readFile, writeFile } from "node:fs/promises";
import { geoContains } from "d3-geo";

const candidates = JSON.parse(await readFile("reports/pl-candidates.json", "utf8"));
const map = JSON.parse(await readFile("public/maps/poland.json", "utf8"));
const regions = new Set(JSON.parse(await readFile("data/regions/PL.json", "utf8")).regions.map(x => x.code));

const classification = {
  "CBeebies.pl": ["foreign", "GB", "https://www.bbc.com/aboutthebbc", "Operatore BBC, Regno Unito; la pagina BBC documenta il gruppo, non una sede polacca."],
  "catalog:PL:failarmypoland": ["foreign", "US", "https://www.jukinmedia.com/", "Feed polacco FAST di Jukin Media, operatore statunitense."],
  "catalog:PL:peopleareawesomepoland": ["foreign", "US", "https://www.jukinmedia.com/", "Feed polacco FAST di Jukin Media, operatore statunitense."],
  "catalog:PL:thepetcollectivepoland": ["foreign", "US", "https://www.jukinmedia.com/", "Feed polacco FAST di Jukin Media, operatore statunitense."],
  "FILMBOXPlusComedy.pl": ["national", "PL", "https://kinopolska.pl/en/about-us/", "Canale del gruppo Kino Polska TV / SPI International; operatore con sede a Varsavia."],
  "FILMBOXPlusFestival.pl": ["national", "PL", "https://kinopolska.pl/en/about-us/", "Canale del gruppo Kino Polska TV / SPI International; operatore con sede a Varsavia."],
  "FILMBOXPlusHits.pl": ["national", "PL", "https://kinopolska.pl/en/about-us/", "Canale del gruppo Kino Polska TV / SPI International; operatore con sede a Varsavia."],
  "FILMBOXPlusLoveCrime.pl": ["national", "PL", "https://kinopolska.pl/en/about-us/", "Canale del gruppo Kino Polska TV / SPI International; operatore con sede a Varsavia."],
  "FILMBOXPlusOne.pl": ["national", "PL", "https://kinopolska.pl/en/about-us/", "Canale del gruppo Kino Polska TV / SPI International; operatore con sede a Varsavia."],
  "TopMoviesPolska.pl": ["national", "PL", "https://kinopolska.pl/en/about-us/", "Canale del gruppo Kino Polska TV / SPI International; operatore con sede a Varsavia."],
  "ViasatExploreClassic.pl": ["foreign", "SE", "https://viaplaygroup.com/about-us/", "Canale Viasat del Viaplay Group, operatore con sede in Svezia."],
  "TOPBarca.pl": ["foreign", "ES", "https://www.fcbarcelona.com/en/club/identity", "Feed legato all'FC Barcelona, club con sede a Barcellona, Spagna."],
  "AmericanCrimeChannel.pl": ["unknown", null, "https://www.rakuten.tv/pl/live_channels/american-crime-channel", "La pagina ufficiale di distribuzione identifica il canale, ma non documenta operatore e sede con sufficiente precisione."],
  "Bigtime.pl": ["unknown", null, "https://www.rakuten.tv/", "Distribuzione Rakuten presente nel catalogo, ma operatore editoriale e sede non documentati nella pagina consultata."],
  "BuzzfeedUnsolved.pl": ["unknown", null, "https://www.rakuten.tv/pl/live_channels/filmrise-buzzfeed-unsolved", "La pagina identifica il feed FilmRise/Rakuten, ma non documenta in modo sufficiente operatore editoriale e sede."],
  "CarCityAdventures.pl": ["unknown", null, "https://www.rakuten.tv/", "Il catalogo identifica il feed, ma non documenta operatore editoriale e sede."],
  "CartoonClassics.pl": ["unknown", null, "https://www.rakuten.tv/pl/live_channels/cartoon-classics", "Il catalogo identifica il feed, ma non documenta operatore editoriale e sede."],
  "DrGMedicalExaminer.pl": ["unknown", null, "https://www.rakuten.tv/pl/live_channels/filmrise-dr-g-medical-examiner", "La pagina identifica il feed FilmRise/Rakuten, ma non documenta in modo sufficiente operatore editoriale e sede."],
  "catalog:PL:glorykickboxingpoland": ["unknown", null, null, "Operatore e sede del feed FAST non documentati nella pagina ufficiale consultabile."],
  "Grjngo.pl": ["unknown", null, "https://www.rakuten.tv/", "Il catalogo identifica il feed, ma non documenta operatore editoriale e sede."],
  "HardKnocksFightingChampionship.pl": ["unknown", null, null, "Operatore e sede del feed non documentati nella pagina ufficiale consultabile."],
  "catalog:PL:lonestarpoland": ["unknown", null, null, "Operatore e sede del feed FAST non documentati nella pagina ufficiale consultabile."],
  "Moconomy.pl": ["unknown", null, "https://www.rakuten.tv/", "Il catalogo identifica il feed, ma non documenta operatore editoriale e sede."],
  "catalog:PL:monsterjam": ["unknown", null, null, "Operatore e sede del feed FAST non documentati nella pagina ufficiale consultabile."],
  "catalog:PL:newsworld": ["unknown", null, null, "Operatore e sede del feed FAST non documentati nella pagina ufficiale consultabile."],
  "catalog:PL:now90s00s": ["unknown", null, null, "Operatore e sede del feed FAST non documentati nella pagina ufficiale consultabile."],
  "RACERInternational.pl": ["unknown", null, "https://www.rakuten.tv/pl/live_channels/racer-international", "La pagina identifica il feed, ma non documenta operatore editoriale e sede."],
  "catalog:PL:rakutenvikipoland": ["unknown", null, null, "Operatore e sede del feed non documentati nella pagina ufficiale consultabile."],
  "RedCarpetTVInternational.pl": ["unknown", null, null, "Operatore e sede del feed non documentati nella pagina ufficiale consultabile."],
  "Royalworld.pl": ["unknown", null, "https://www.rakuten.tv/pl/live_channels/royalworld-pl", "La pagina identifica il feed, ma non documenta operatore editoriale e sede."],
  "catalog:PL:strongmanchampionsleague": ["unknown", null, null, "Operatore e sede del feed FAST non documentati nella pagina ufficiale consultabile."],
  "TNAWrestlingChannel.pl": ["unknown", null, null, "Operatore e sede del feed non documentati nella pagina ufficiale consultabile."],
  "wedotvAuta.pl": ["unknown", null, null, "Operatore e sede del feed FAST non documentati nella pagina ufficiale consultabile."],
  "WorldBilliards.pl": ["unknown", null, null, "Operatore e sede del feed non documentati nella pagina ufficiale consultabile."],
  "catalog:PL:worldpokertourpoland": ["unknown", null, null, "Operatore e sede del feed non documentati nella pagina ufficiale consultabile."]
};
const unresolvedForeign = new Set([
  "Bigtime.pl", "BuzzfeedUnsolved.pl", "CarCityAdventures.pl", "CartoonClassics.pl", "DrGMedicalExaminer.pl",
  "catalog:PL:glorykickboxingpoland", "Grjngo.pl", "HardKnocksFightingChampionship.pl", "catalog:PL:lonestarpoland",
  "Moconomy.pl", "catalog:PL:monsterjam", "catalog:PL:newsworld", "catalog:PL:now90s00s", "RACERInternational.pl",
  "catalog:PL:rakutenvikipoland", "RedCarpetTVInternational.pl", "Royalworld.pl", "catalog:PL:strongmanchampionsleague",
  "TNAWrestlingChannel.pl", "wedotvAuta.pl", "WorldBilliards.pl", "catalog:PL:worldpokertourpoland"
]);

const areas = {
  "BialogardzkaTelewizjaKablowa.pl": ["local", "PL-32", "Białogard", "Zachodniopomorskie", 54.006, 15.986, "https://btk.bsmbialogard.pl/", "https://www.geonames.org/3103476/bialogard.html"],
  "BTB.pl": ["local", "PL-24", "Bielsko-Biała", "Śląskie", 49.8224, 19.0444, "https://btb.j00r.us/", "https://www.geonames.org/3103402/bielsko-biala.html"],
  "BTB2.pl": ["local", "PL-24", "Bielsko-Biała", "Śląskie", 49.8224, 19.0444, "https://btb.j00r.us/", "https://www.geonames.org/3103402/bielsko-biala.html"],
  "BTB3.pl": ["local", "PL-24", "Bielsko-Biała", "Śląskie", 49.8224, 19.0444, "https://btb.j00r.us/", "https://www.geonames.org/3103402/bielsko-biala.html"],
  "BTBInfo.pl": ["local", "PL-24", "Bielsko-Biała", "Śląskie", 49.8224, 19.0444, "https://btb.j00r.us/", "https://www.geonames.org/3103402/bielsko-biala.html"],
  "Echo24.pl": ["regional", "PL-02", "Wrocław", "Dolnośląskie", 51.1079, 17.0385, "https://echo24.tv/", "https://www.geonames.org/3081368/wroclaw.html"],
  "RadioRAM.pl": ["regional", "PL-02", "Wrocław", "Dolnośląskie", 51.1079, 17.0385, "https://www.radioram.pl/", "https://www.geonames.org/3081368/wroclaw.html"],
  "SferaTV.pl": ["local", "PL-24", "Rybnik", "Śląskie", 50.1022, 18.5463, "https://sferatv.pl/", "https://www.geonames.org/3080407/rybnik.html"],
  "TelewizjaImperium.pl": ["local", "PL-24", "Gliwice", "Śląskie", 50.2945, 18.6714, "https://imperiummedia.pl/", "https://www.geonames.org/3096472/gliwice.html"],
  "TelewizjaJaslo.pl": ["local", "PL-18", "Jasło", "Podkarpackie", 49.7451, 21.4725, "https://tvjaslo.pl/", "https://www.geonames.org/3097257/jaslo.html"],
  "TelewizjaLuban.pl": ["local", "PL-02", "Lubań", "Dolnośląskie", 51.1201, 15.2875, "https://tvluban.pl/", "https://www.geonames.org/3092472/luban.html"],
  "TelewizjaRegionalnaZary.pl": ["local", "PL-08", "Żary", "Lubuskie", 51.642, 15.137, "https://telewizjazary.pl/", "https://www.geonames.org/3080644/zary.html"],
  "TelewizjaRelax.pl": ["local", "PL-24", "Racibórz", "Śląskie", 50.0919, 18.2193, "https://tvrelax.pl/", "https://www.geonames.org/3086477/raciborz.html"],
  "TVASTA.pl": ["regional", "PL-30", "Piła", "Wielkopolskie", 53.1515, 16.7382, "https://tvasta.pl/", "https://www.geonames.org/3088825/pila.html"],
  "TVKujawy.pl": ["local", "PL-04", "Włocławek", "Kujawsko-pomorskie", 52.6482, 19.0678, "https://tvkujawy.pl/", "https://www.geonames.org/3080985/wloclawek.html"],
  "TVKSMNT.pl": ["local", "PL-30", "Nowy Tomyśl", "Wielkopolskie", 52.3195, 16.1284, "https://tvk.smnt.pl/", "https://www.geonames.org/3090580/nowy-tomysl.html"],
  "TVT.pl": ["regional", "PL-24", "Rybnik", "Śląskie", 50.1022, 18.5463, "https://telewizjatvt.pl/", "https://www.geonames.org/3080407/rybnik.html"],
  "TVTZgorzelec.pl": ["local", "PL-02", "Zgorzelec", "Dolnośląskie", 51.1494, 15.0084, "https://telewizjatvt.pl/", "https://www.geonames.org/3080272/zgorzelec.html"],
  "TwojaTV.pl": ["local", "PL-14", "Warszawa", "Mazowieckie", 52.2297, 21.0122, "https://twoja.tv/", "https://www.geonames.org/756135/warsaw.html"]
};

const researched = {
  "catalog:PL:tv-torun": ["local", "PL-04", "Toruń", "Kujawsko-pomorskie", 53.0138, 18.5984, "https://tvtorun.pl/", "https://www.geonames.org/3083271/torun.html", "TV Toruń documenta l'emittente e la pagina live; pin al centro di Toruń."],
  "catalog:PL:tvk-hajnowka": ["unknown", null, null, null, null, null, "https://tvkhajnowka.pl/", null, "Sito ufficiale consultato; il video in homepage è uno sfondo/promozionale e non espone una diretta HLS/DASH o embed ufficiale usabile."],
  "catalog:PL:tv-belchatow": ["unknown", null, null, null, null, null, "https://tvbelchatow.pl/", null, "Sito ufficiale consultato; nessuna diretta HLS/DASH o embed ufficiale usabile nell'HTML."],
  "catalog:PL:telewizja-olsztyn": ["unknown", null, null, null, null, null, "https://telewizjaolsztyn.pl/", null, "Sito ufficiale consultato; pagina raggiungibile ma nessuna diretta HLS/DASH o embed ufficiale usabile nell'HTML."],
  "catalog:PL:tv-sudecka": ["unknown", null, null, null, null, null, "https://telewizjasudecka.pl/", null, "Dominio consultato; non raggiungibile dall'ambiente, nessuna fonte ufficiale verificabile."],
  "catalog:PL:tv-gorzow": ["unknown", null, null, null, null, null, "https://tvgorzow.pl/", null, "Il dominio ufficiale consultato è una pagina di vendita del dominio, non una TV attiva."],
  "catalog:PL:tv-malopolska": ["unknown", null, null, null, null, null, "https://tvmalopolska.pl/", null, "Dominio consultato; HTTP 500, nessuna fonte ufficiale verificabile."],
  "catalog:PL:itv-kielce": ["unknown", null, null, null, null, null, "https://itvkielce.pl/", null, "Dominio consultato; non raggiungibile dall'ambiente, nessuna fonte ufficiale verificabile."],
  "catalog:PL:tv-sopot": ["unknown", null, null, null, null, null, "https://tvsopot.pl/", null, "Dominio consultato; non raggiungibile dall'ambiente, nessuna fonte ufficiale verificabile."],
  "catalog:PL:tv-lubelska": ["unknown", null, null, null, null, null, "https://telewizjalubelska.pl/", null, "Dominio consultato; non raggiungibile dall'ambiente, nessuna fonte ufficiale verificabile."],
  "catalog:PL:tv-opole": ["unknown", null, null, null, null, null, "https://telewizjaopole.pl/", null, "Dominio consultato; non raggiungibile dall'ambiente, nessuna fonte ufficiale verificabile."],
  "catalog:PL:tv-podkarpacka": ["unknown", null, null, null, null, null, "https://telewizjapodkarpacka.pl/", null, "Il dominio mostra una pagina anti-bot; nessuna fonte ufficiale verificabile con curl."],
  "catalog:PL:tv-swietokrzyska": ["unknown", null, null, null, null, null, "https://telewizjaswietokrzyska.pl/", null, "Dominio consultato; non raggiungibile dall'ambiente, nessuna fonte ufficiale verificabile."]
};

const byId = new Map(candidates.channels.map(x => [x.id, x]));
const geography = {};
for (const channel of candidates.channels) {
  const [scope, regionCode, city, province, lat, lon, areaSourceUrl, coordinateSourceUrl] = areas[channel.id] ??
    researched[channel.id] ?? [classification[channel.id]?.[0] ?? (unresolvedForeign.has(channel.id) ? "unknown" : "national"), null, null, null, null, null, classification[channel.id]?.[2] ?? (channel.website?.startsWith("https:") ? channel.website : null), null, null];
  const evidence = classification[channel.id];
  const researchNote = researched[channel.id]?.[8];
  const item = { scope, regionCode, extraRegions: [], city, province, countryCode: evidence ? evidence[1] : (unresolvedForeign.has(channel.id) ? null : "PL"), lat, lon,
    coordinateSourceUrl, confidence: scope === "unknown" ? "low" : "medium", sourceUrl: areaSourceUrl,
    notes: researchNote ?? evidence?.[3] ?? (scope === "foreign" ? "Operatore e sede documentati dalla fonte indicata; feed non assegnato a un voivodato." :
      scope === "national" ? "HTML ufficiale consultato; sede o feed nazionale non usato per assegnare un voivodato." :
        "Città e ambito ricavati dal sito ufficiale o dalla pagina contatti; pin approssimato al centro urbano.") };
  if (["regional", "local"].includes(scope)) {
    if (!regions.has(regionCode)) throw new Error(`${channel.id}: region code non valido`);
    const feature = map.features.find(x => x.properties.code === regionCode);
    if (!geoContains(feature, [lon, lat])) throw new Error(`${channel.id}: pin fuori da ${regionCode}`);
  }
  geography[channel.id] = item;
}

for (const [id, values] of Object.entries(researched)) {
  if (geography[id]) continue;
  const [scope, regionCode, city, province, lat, lon, sourceUrl, coordinateSourceUrl, notes] = values;
  geography[id] = { scope, regionCode, extraRegions: [], city, province, countryCode: null, lat, lon, coordinateSourceUrl, confidence: "low", sourceUrl, notes };
}

await writeFile("reports/pl-research-geography.json", JSON.stringify(geography, null, 2) + "\n");
console.log(`geography: ${Object.keys(geography).length} entries, ${Object.values(geography).filter(x => x.lat !== null).length} pins`);
console.log(Object.values(geography).reduce((a, x) => (a[x.scope] = (a[x.scope] ?? 0) + 1, a), {}));
