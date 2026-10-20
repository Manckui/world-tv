// Build data/catalogs/FR.json, data/geography/FR.json and data/alternatives/FR.json from evidence:
// - reports/fr-candidates.json            public catalogs (IPTV-org, Free-TV), filtered by scripts/fr-build-candidates.mjs
// - reports/fr-research-sources.json      official live pages inspected by web research
// - reports/fr-research-geography.json    broadcaster seats (research)
// - reports/streams-FR*.json, reports/embeds-FR*.json   real playback tests (scripts/fr-probe*.mjs)
// Only channels with at least one source verified in Chrome enter the catalog; within a channel only
// verified URLs are kept (verifiedAt = date of the latest successful test). Failures stay in the reports.
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";

const read = async file => JSON.parse(await readFile(file, "utf8"));
const candidates = await read("reports/fr-candidates.json");
const research = await read("reports/fr-research-sources.json");
const geography = await read("reports/fr-research-geography.json");
const reportFiles = (await readdir("reports")).filter(name => /^(streams|embeds)-FR.*\.json$/.test(name));
// Embed reports count only with the strict same-video criteria (earlier two-sample reports are kept as history).
const tests = (await Promise.all(reportFiles.map(name => read(`reports/${name}`))))
  .filter(report => report.run?.config?.kind !== "embed-probe" || report.run.config.criteria === "same-video-series")
  .flatMap(report => report.tests);

// Latest verdict per channel/URL.
const latest = new Map();
for (const test of tests) {
  const key = `${test.channelId}\n${test.streamUrl}`;
  if (!latest.has(key) || Date.parse(test.startedAt) > Date.parse(latest.get(key).startedAt)) latest.set(key, test);
}

// Merge public-catalog candidates and official research by channel id.
const channels = new Map();
for (const channel of candidates.channels) channels.set(channel.id, { id: channel.id, name: channel.name, website: channel.website,
  categories: channel.categories, streams: channel.streams.map(stream => ({ url: stream.url, format: stream.format, page: stream.sources[0]?.url ?? null })) });
for (const item of research) {
  const channel = channels.get(item.id) ?? { id: item.id, name: item.name, website: null, categories: item.categories ?? [], streams: [] };
  channel.website = item.livePage ?? item.website ?? channel.website;
  for (const stream of item.streams ?? []) {
    // Twitch/Kick players are iframes the site can embed (Twitch parent= is set by the player); YouTube stays out.
    const format = stream.format === "external" && /^player\.(twitch\.tv|kick\.com)$/.test(new URL(stream.url).hostname) ? "embed" : stream.format;
    if (!["hls", "dash", "embed"].includes(format) || channel.streams.some(s => s.url === stream.url)) continue;
    // Official sources first.
    channel.streams.unshift({ url: stream.url, format, page: stream.page ?? item.livePage ?? null });
  }
  channels.set(item.id, channel);
}

// Corrections from docs/diagnostics/france-cross-review.md and the handoff review.
const EXCLUDED_STREAMS = {
  // Aniview SSAI URL with unresolved advertising macros ([ADS.GDPR_CONSENT], [ADS.IFA]…): values must not be invented.
  "FashionTVSecrets.fr": /ssai\.aniview\.com/,
};
const EXCLUDED_CHANNELS = {
  // RT France closed in 2023; RT broadcasts are subject to EU sanctions (Reg. 2022/350).
  "RTFrance.fr": "Chiusa nel 2023 e soggetta alle sanzioni UE sulle trasmissioni RT.",
};
// Plain HTTP streams are blocked as mixed content on the HTTPS site; an HTTPS equivalent is used only when tested.
const isHttp = url => url.startsWith("http:");
// Old Dailymotion embed URLs are tested in the current official player form.
const embedUrl = url => url.replace(/^https:\/\/www\.dailymotion\.com\/embed\/video\/([a-z0-9]+).*$/i, "https://geo.dailymotion.com/player.html?video=$1");
const provenance = await read("reports/fr-provenance.json").catch(() => ({ results: [] }));
const provenanceOf = new Map(provenance.results.map(item => [`${item.channelId}\n${item.url}`, item]));
const FAST_HOSTS = /(amagi\.tv|wurl\.tv|samsung|rakuten|otteravision\.com|cloudfront\.net|okast\.tv)/;
channels.get("TMA.gp")?.streams.unshift({ url: "https://hls.tmacaraibes.com/live/index.m3u8", format: "hls", page: "http://www.tmacaraibes.com/" });

const catalog = [];
const excluded = [];
for (const channel of channels.values()) {
  if (EXCLUDED_CHANNELS[channel.id]) { excluded.push({ id: channel.id, reason: EXCLUDED_CHANNELS[channel.id] }); continue; }
  const streams = channel.streams.flatMap(stream => {
    const url = stream.format === "embed" ? embedUrl(stream.url) : stream.url;
    if (isHttp(url) || EXCLUDED_STREAMS[channel.id]?.test(url)) return [];
    const test = latest.get(`${channel.id}\n${url}`);
    if (test?.automation?.verdict !== "verified") return [];
    const found = provenanceOf.get(`${channel.id}\n${url}`);
    const official = found?.status === "found-on-official-page" ? found.page
      : stream.page && !/iptv-org|free-tv|githubusercontent/i.test(stream.page) ? stream.page : null;
    return [{ url, format: stream.format, page: official ?? stream.page ?? undefined,
      provenance: official ? "official-page" : FAST_HOSTS.test(new URL(url).hostname) ? "fast-distributor" : "public-list",
      verifiedAt: test.startedAt }];
  });
  if (streams.length) catalog.push({ id: channel.id, name: channel.name, website: channel.website ?? null, categories: channel.categories ?? [], streams });
}
catalog.sort((a, b) => a.name.localeCompare(b.name, "fr"));

const geocode = (await read("reports/fr-geocode.json")).places;
const placeFor = g => Object.entries(geocode).find(([key]) => key.startsWith(`${g.city}|${g.province ?? ""}|`))?.[1];
const ASSUMED = /assum|presum|suppos|likely|probabl|inferred|guess|ipotes/i;
const GEOGRAPHY_OVERRIDES = {
  // IPTV-org lists TMA under Guadeloupe; research placed it in Martinique without an address: keep the uncertainty.
  "TMA.gp": { scope: "unknown", regionCode: null, city: null, province: null, confidence: "low",
    notes: "TMA Caraïbes, Antille francesi. Né il sito né altre fonti indicano sede o territorio servito (Guadeloupe o Martinique): area non assegnata." },
  // Only the brand name points to Monaco; no documented address, so no city and no pin.
  "MonteCarloDigitalTelevision.fr": { city: null, confidence: "low",
    notes: "Il nome richiama Monaco ma nessuna fonte documenta la sede: città e coordinate non assegnate." },
};

const inCatalog = new Set(catalog.map(channel => channel.id));
// "foreign" with country FR is a contradiction in the research: French-licensed thematic channels are national.
const scopeOf = g => g.scope === "foreign" && (g.countryCode ?? "FR") === "FR" ? "national" : g.scope;
const geo = Object.fromEntries(Object.entries(geography).filter(([id]) => inCatalog.has(id)).map(([id, raw]) => {
  const g = { ...raw, ...GEOGRAPHY_OVERRIDES[id] };
  const assumed = ASSUMED.test(g.notes ?? "");
  const city = assumed || !g.sourceUrl ? null : g.city ?? null;
  const place = city ? placeFor(g) : null;
  return [id, {
    scope: scopeOf(g), regionCode: ["regional", "local"].includes(scopeOf(g)) ? g.regionCode ?? null : null,
    extraRegions: g.extraRegions ?? [], city, province: city ? g.province ?? null : null, countryCode: g.countryCode ?? "FR",
    // Pin = OSM town centre of the documented seat city; never a regional capital by default.
    lat: place?.lat ?? null, lon: place?.lon ?? null,
    ...place?.lat != null ? { coordinatePrecision: "city-centre", coordinateSourceUrl: place.sourceUrl } : {},
    confidence: assumed ? "low" : g.confidence ?? "low", sourceUrl: g.sourceUrl ?? null,
    sourceType: /wikipedia\.org/.test(g.sourceUrl ?? "") ? "secondary" : g.sourceUrl ? "primary" : "none",
    ...g.notes ? { notes: assumed ? `${g.notes} Sede non documentata (ipotesi): nessun pin.` : g.notes } : {},
  }];
}).sort(([a], [b]) => a.localeCompare(b)));

await mkdir("data/catalogs", { recursive: true });
await mkdir("data/alternatives", { recursive: true });
await writeFile("data/catalogs/FR.json", JSON.stringify({ version: 1, country: "FR", channels: catalog }, null, 2) + "\n");
await writeFile("data/geography/FR.json", JSON.stringify({ version: 1, country: "FR", generatedAt: new Date().toISOString(),
  method: "Sede documentata (mentions légales, contatti, ARCOM, Wikipedia). Sede e copertura sono distinte; pin solo con città documentata.",
  channels: geo }, null, 2) + "\n");
// All verified official sources are already in the curated catalog: no separate alternatives needed.
await writeFile("data/alternatives/FR.json", JSON.stringify({ version: 1, country: "FR", alternatives: [] }, null, 2) + "\n");
await writeFile("reports/fr-catalog-exclusions.json", JSON.stringify({ version: 1, excluded,
  excludedStreams: Object.keys(EXCLUDED_STREAMS), httpRule: "fonti http: escluse (contenuto misto su HTTPS)" }, null, 2) + "\n");
const missingGeo = catalog.filter(channel => !geo[channel.id]).map(channel => channel.name);
console.log(`${catalog.length} canali, ${catalog.reduce((n, c) => n + c.streams.length, 0)} fonti verificate; geografia ${Object.keys(geo).length}; senza geografia: ${missingGeo.length}`);
if (missingGeo.length) console.log(missingGeo.join(", "));
