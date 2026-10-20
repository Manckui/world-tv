// Real browser playback checks for a selected set of channels and/or candidate sources.
// Input JSON: { "channels": ["Rai4.it", ...], "candidates": [{ "channelId", "url", "format", "page" }] }
// - channels: retest every current source of these catalog channels
// - candidates: test only these new URLs, attached to the existing channel (not yet in the catalog)
// Uses the normal POC player with a reduced catalog; no stream bytes or headers are altered.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { run } from "./test-streams.mjs";
import { optionsFrom } from "./stream-test-utils.mjs";

const { values, positionals } = parseArgs({ args: process.argv.slice(2), strict: false, options: { input: { type: "string" } } });
if (!values.input) throw new Error("--input file.json richiesto.");
const options = optionsFrom(process.argv.slice(2).filter((arg, i, all) => arg !== "--input" && all[i - 1] !== "--input"));
void positionals;
if (!options.output) throw new Error("--output richiesto: usa un report diagnostico separato.");
for (const filename of [`reports/streams-${options.country}.json`, `reports/streams-${options.country}-recheck.json`]) {
  if (path.resolve(options.output) === path.resolve(filename)) throw new Error("Usa un report diagnostico separato dai test principali.");
}
const input = JSON.parse(await readFile(values.input, "utf8"));
const response = await fetch(`${options.origin}/api/channels?country=${options.country}`);
if (!response.ok) throw new Error(`Catalogo HTTP ${response.status}`);
const catalog = await response.json();
const byId = new Map(catalog.channels.map(channel => [channel.id, channel]));
const selected = new Map();
for (const id of input.channels ?? []) {
  const channel = byId.get(id);
  if (!channel) { console.warn(`Emittente assente dal catalogo: ${id}`); continue; }
  selected.set(id, { ...channel });
}
const candidateChannels = new Map();
for (const candidate of input.candidates ?? []) {
  const base = byId.get(candidate.channelId);
  if (!base) { console.warn(`Emittente assente dal catalogo: ${candidate.channelId}`); continue; }
  const channel = candidateChannels.get(base.id) ?? { ...base, streams: [] };
  if (channel.streams.some(s => s.url === candidate.url)) continue;
  channel.streams.push({ url: candidate.url, title: base.name, quality: null, label: null, needsVerification: true,
    requiresHeaders: false, format: candidate.format ?? "hls", restriction: null, geography: base.geography,
    sources: [{ id: `candidate:${base.id}`, name: `${base.name} · candidato`, url: candidate.page ?? candidate.url }] });
  candidateChannels.set(base.id, channel);
}
// Use separate --output files for retests and candidates: a channel in both lists would be merged.
for (const [id, channel] of candidateChannels) {
  if (!selected.has(id)) continue;
  channel.streams.unshift(...selected.get(id).streams);
  selected.delete(id);
}
const channels = [...selected.values(), ...[...candidateChannels.values()].map(channel => ({ ...channel,
  stream: channel.streams[0], alternativeStreams: channel.streams.length - 1 }))];
if (!channels.length) throw new Error("Nessun canale o candidato da provare.");
console.log(`${selected.size} emittenti da ritestare, ${candidateChannels.size} con candidati.`);
await run(options, { preparePage: page => page.route(`**/api/channels?country=${options.country}`, route =>
  route.fulfill({ json: { ...catalog, channels, catalogTotal: channels.length, withStream: channels.length } })) });
