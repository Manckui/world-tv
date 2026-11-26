// Build the PT data pack from candidate inventory, official research and playback reports.
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
const stage = process.argv.includes("--stage");
const read = async file => JSON.parse(await readFile(file, "utf8"));
const optional = async (file, fallback) => read(file).catch(error => { if (error.code === "ENOENT") return fallback; throw error; });
const candidates = await read("reports/pt-candidates.json");
const research = await optional("reports/pt-research-sources.json", []);
const geography = await optional("reports/pt-research-geography.json", {});
const excludedByUser = new Set((await read("data/excluded-channels.json")).channels?.map(item => item.id ?? item) ?? []);
const channels = new Map(candidates.channels.map(channel => [channel.id, { id: channel.id, name: channel.name, website: channel.website?.replace(/^http:/, "https:") ?? null, categories: channel.categories ?? [], streams: channel.streams.map(stream => ({ url: stream.url, format: stream.format, page: stream.sources[0]?.url ?? null })) }]));
for (const item of research) {
  const channel = channels.get(item.id) ?? { id: item.id, name: item.name, website: null, categories: item.categories ?? [], streams: [] };
  channel.website = item.livePage ?? item.website ?? channel.website;
  for (const stream of item.streams ?? []) if (["hls", "dash", "embed"].includes(stream.format) && !channel.streams.some(s => s.url === stream.url)) channel.streams.unshift({ url: stream.url, format: stream.format, page: stream.page ?? item.livePage ?? null, official: true });
  channels.set(item.id, channel);
}
// Duplicate IPTV-org identities of the same broadcaster: keep their streams under the primary ID.
const mergeInto = { "catalog:PT:adtv": "ARTV.pt", "catalog:PT:rtp3": "RTPNoticias.pt" };
for (const [from, to] of Object.entries(mergeInto)) {
  const source = channels.get(from); const target = channels.get(to);
  if (!source || !target) continue;
  for (const stream of source.streams) if (!target.streams.some(s => s.url === stream.url)) target.streams.push(stream);
  channels.delete(from);
}
// Listed under PT by public lists but not Portuguese broadcasters (foreign FAST feeds or foreign channels).
const outOfScope = {
  "catalog:PT:fifaportuguese": "Feed FAST in lingua portoghese di FIFA+, non un'emittente portoghese",
  "catalog:PT:trailersuk": "Canale FAST britannico, non portoghese",
  "catalog:PT:kto": "KTO è un'emittente cattolica francese",
  "catalog:PT:angeltvportuguese": "Versione in portoghese di Angel TV, emittente estera senza sede in Portogallo",
};
const scopeExcluded = [];
for (const [id, reason] of Object.entries(outOfScope)) if (channels.delete(id)) scopeExcluded.push({ id, reason });
const tests = [];
if (!stage) for (const name of (await readdir("reports")).filter(name => /-PT[-.\w]*\.json$/.test(name) && !name.startsWith("pt-"))) { const report = await read(`reports/${name}`); if (Array.isArray(report.tests)) tests.push(...report.tests.filter(test => test.country === "PT" || !test.country)); }
const latest = new Map(); for (const test of tests) { const key = `${test.channelId}\n${test.streamUrl}`; if (!latest.has(key) || Date.parse(test.startedAt) > Date.parse(latest.get(key).startedAt)) latest.set(key, test); }
const catalog = []; const excluded = [...scopeExcluded];
for (const channel of channels.values()) {
  if (excludedByUser.has(channel.id)) { excluded.push({ id: channel.id, reason: "Eliminato dall'utente (data/excluded-channels.json)" }); continue; }
  const streams = channel.streams.flatMap(stream => {
    if (stream.url.startsWith("http:")) return [];
    const official = stream.official || (stream.page && !/iptv-org|free-tv|githubusercontent/i.test(stream.page));
    const base = { url: stream.url, format: stream.format, page: stream.page ?? undefined, provenance: official ? "official-page" : "public-list" };
    if (stage) return [base];
    const test = latest.get(`${channel.id}\n${stream.url}`);
    return test?.automation?.verdict === "verified" ? [{ ...base, verifiedAt: test.startedAt }] : [];
  });
  if (streams.length) catalog.push({ id: channel.id, name: channel.name, website: channel.website ?? null, categories: channel.categories, streams });
}
catalog.sort((a, b) => a.name.localeCompare(b.name, "pt"));
const unknown = { scope: "unknown", regionCode: null, extraRegions: [], city: null, province: null, countryCode: "PT", lat: null, lon: null, confidence: "low", sourceUrl: null, notes: "Sede non ancora documentata." };
const geo = Object.fromEntries(catalog.map(channel => { const g = geography[channel.id]; if (!g) return [channel.id, unknown]; const regional = ["regional", "local"].includes(g.scope); const hasPin = g.city && g.coordinateSourceUrl && Number.isFinite(g.lat) && Number.isFinite(g.lon); return [channel.id, { scope: g.scope, regionCode: regional ? g.regionCode ?? null : null, extraRegions: regional ? g.extraRegions ?? [] : [], city: g.city ?? null, province: g.province ?? null, countryCode: g.countryCode ?? "PT", lat: hasPin ? g.lat : null, lon: hasPin ? g.lon : null, ...(hasPin ? { coordinatePrecision: "city-centre", coordinateSourceUrl: g.coordinateSourceUrl } : {}), confidence: g.confidence ?? "low", sourceUrl: g.sourceUrl ?? null, ...(g.notes ? { notes: g.notes } : {}) }]; }).sort(([a], [b]) => a.localeCompare(b)));
await mkdir("data/catalogs", { recursive: true }); await mkdir("data/geography", { recursive: true }); await mkdir("data/alternatives", { recursive: true });
await writeFile("data/catalogs/PT.json", JSON.stringify({ version: 1, country: "PT", channels: catalog }, null, 2) + "\n");
await writeFile("data/geography/PT.json", JSON.stringify({ version: 1, country: "PT", generatedAt: new Date().toISOString(), method: "Sede documentata su sito ufficiale, ficha técnica, contatti o ERC; sede e copertura sono distinte; pin solo con città documentata.", channels: geo }, null, 2) + "\n");
await writeFile("data/alternatives/PT.json", JSON.stringify({ version: 1, country: "PT", alternatives: [] }, null, 2) + "\n");
await writeFile("reports/pt-catalog-exclusions.json", JSON.stringify({ version: 1, excluded, httpRule: "fonti http: escluse (contenuto misto su HTTPS)", unverifiedCandidates: candidates.channels.flatMap(channel => channel.streams.filter(stream => !catalog.find(c => c.id === channel.id)?.streams.some(s => s.url === stream.url)).map(stream => ({ channelId: channel.id, channelName: channel.name, url: stream.url, reason: stage ? "In stage; richiede test di playback" : "Nessun test verified corrispondente" }))) }, null, 2) + "\n");
console.log(`${stage ? "[stage] " : ""}${catalog.length} canali, ${catalog.reduce((n, c) => n + c.streams.length, 0)} fonti; esclusi ${excluded.length}.`);
