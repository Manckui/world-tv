// Build data/catalogs/NL.json, data/geography/NL.json and data/alternatives/NL.json from evidence:
// - reports/nl-candidates.json         public catalogs, filtered by scripts/de-build-candidates.mjs
// - reports/nl-research-sources.json   official live pages found by web research (optional)
// - reports/nl-research-geography.json broadcaster seats (optional; channels without it stay "unknown")
// - reports/*-NL*.json                 real playback tests from `npm run test:streams -- --country NL`
//
// `--stage` writes every candidate source (no verifiedAt) so the runner can test them.
// Without it, only channels with at least one source verified in Chrome enter the catalog.
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";

const stage = process.argv.includes("--stage");
const read = async file => JSON.parse(await readFile(file, "utf8"));
const optional = async (file, fallback) => read(file).catch(error => { if (error.code === "ENOENT") return fallback; throw error; });

const candidates = await read("reports/nl-candidates.json");
const research = await optional("reports/nl-research-sources.json", []);
const geography = await optional("reports/nl-research-geography.json", {});
const excludedByUser = new Set((await read("data/excluded-channels.json")).channels?.map(item => item.id ?? item) ?? []);

// RT broadcasts are subject to EU sanctions (Reg. 2022/350); foreign feeds belong to their own country.
const EXCLUDED_CHANNELS = {
  // docs/diagnostics/netherlands-research-coverage.md: stream path "rtvfavoriet" not confirmed as CONNECT TV.
  "RTVConnectTV.nl": "Identità dello stream (nlpo/rtvfavoriet) non confermata come CONNECT TV.",
};
const isExcludedName = name => /^rt de$/i.test(name);

const channels = new Map();
for (const channel of candidates.channels) channels.set(channel.id, { id: channel.id, name: channel.name, website: channel.website,
  categories: channel.categories ?? [], streams: channel.streams.map(stream => ({ url: stream.url, format: stream.format, page: stream.sources[0]?.url ?? null })) });
for (const item of research) {
  const channel = channels.get(item.id) ?? { id: item.id, name: item.name, website: null, categories: item.categories ?? [], streams: [] };
  channel.website = item.livePage ?? item.website ?? channel.website;
  for (const stream of item.streams ?? []) {
    if (!["hls", "dash", "embed"].includes(stream.format) || channel.streams.some(s => s.url === stream.url)) continue;
    channel.streams.unshift({ url: stream.url, format: stream.format, page: stream.page ?? item.livePage ?? null, official: true });
  }
  channels.set(item.id, channel);
}

const tests = [];
if (!stage) {
  for (const name of (await readdir("reports")).filter(name => /-NL[-.\w]*\.json$/.test(name) && !name.startsWith("nl-"))) {
    const report = await read(`reports/${name}`);
    if (Array.isArray(report.tests)) tests.push(...report.tests.filter(test => test.country === "NL" || !test.country));
  }
}
const latest = new Map();
for (const test of tests) {
  const key = `${test.channelId}\n${test.streamUrl}`;
  if (!latest.has(key) || Date.parse(test.startedAt) > Date.parse(latest.get(key).startedAt)) latest.set(key, test);
}

const catalog = [];
const excluded = [];
for (const channel of channels.values()) {
  if (EXCLUDED_CHANNELS[channel.id] || isExcludedName(channel.name)) { excluded.push({ id: channel.id, reason: EXCLUDED_CHANNELS[channel.id] ?? "RT: sanzioni UE" }); continue; }
  if (excludedByUser.has(channel.id)) { excluded.push({ id: channel.id, reason: "Eliminato dall'utente (data/excluded-channels.json)" }); continue; }
  const streams = channel.streams.flatMap(stream => {
    // Plain HTTP is blocked as mixed content on the HTTPS site.
    if (stream.url.startsWith("http:")) return [];
    const official = stream.official || (stream.page && !/iptv-org|free-tv|githubusercontent/i.test(stream.page));
    const base = { url: stream.url, format: stream.format, page: stream.page ?? undefined, provenance: official ? "official-page" : "public-list" };
    if (stage) return [base];
    const test = latest.get(`${channel.id}\n${stream.url}`);
    return test?.automation?.verdict === "verified" ? [{ ...base, verifiedAt: test.startedAt }] : [];
  });
  if (streams.length) catalog.push({ id: channel.id, name: channel.name, website: channel.website ?? null, categories: channel.categories, streams });
}
catalog.sort((a, b) => a.name.localeCompare(b.name, "nl"));

const unknown = { scope: "unknown", regionCode: null, extraRegions: [], city: null, province: null, countryCode: "NL",
  lat: null, lon: null, confidence: "low", sourceUrl: null, notes: "Sede non ancora ricercata." };
const geo = Object.fromEntries(catalog.map(channel => {
  const g = geography[channel.id];
  if (!g) return [channel.id, unknown];
  const regional = ["regional", "local"].includes(g.scope);
  const hasPin = g.city && g.sourceUrl && Number.isFinite(g.lat) && Number.isFinite(g.lon);
  return [channel.id, {
    scope: g.scope, regionCode: regional ? g.regionCode ?? null : null, extraRegions: regional ? g.extraRegions ?? [] : [],
    city: g.city ?? null, province: g.province ?? null, countryCode: g.countryCode ?? "NL",
    lat: hasPin ? g.lat : null, lon: hasPin ? g.lon : null,
    ...hasPin ? { coordinatePrecision: "city-centre", coordinateSourceUrl: g.coordinateSourceUrl ?? null } : {},
    confidence: g.confidence ?? "low", sourceUrl: g.sourceUrl ?? null,
    ...g.notes ? { notes: g.notes } : {},
  }];
}).sort(([a], [b]) => a.localeCompare(b)));

await mkdir("data/catalogs", { recursive: true });
await mkdir("data/geography", { recursive: true });
await mkdir("data/alternatives", { recursive: true });
await writeFile("data/catalogs/NL.json", JSON.stringify({ version: 1, country: "NL", channels: catalog }, null, 2) + "\n");
await writeFile("data/geography/NL.json", JSON.stringify({ version: 1, country: "NL", generatedAt: new Date().toISOString(),
  method: "Sede documentata (pagina contatti, regolatore, registri ufficiali). Sede e copertura sono distinte; pin solo con città documentata.",
  channels: geo }, null, 2) + "\n");
await writeFile("data/alternatives/NL.json", JSON.stringify({ version: 1, country: "NL", alternatives: [] }, null, 2) + "\n");
await writeFile("reports/nl-catalog-exclusions.json", JSON.stringify({ version: 1, excluded,
  httpRule: "fonti http: escluse (contenuto misto su HTTPS)" }, null, 2) + "\n");
console.log(`${stage ? "[stage] " : ""}${catalog.length} canali, ${catalog.reduce((n, c) => n + c.streams.length, 0)} fonti; esclusi ${excluded.length}.`);
