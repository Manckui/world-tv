// Real browser playback checks for the public alternatives discovered in the research report.
// Uses the normal POC player with a smaller catalog; no stream bytes or headers are altered.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { run } from "./test-streams.mjs";
import { optionsFrom } from "./stream-test-utils.mjs";

const options = optionsFrom(process.argv.slice(2));
options.output ??= "reports/tvdream-alternative-playback-IT.json";
for (const filename of ["reports/streams-IT.json", "reports/streams-IT-recheck.json"]) {
  if (path.resolve(options.output) === path.resolve(filename)) throw new Error("Usa un report diagnostico separato dai test principali.");
}
const research = JSON.parse(await readFile("reports/tvdream-uncertain-IT.json", "utf8"));
const response = await fetch(`${options.origin}/api/channels?country=IT`);
if (!response.ok) throw new Error(`Catalogo HTTP ${response.status}`);
const catalog = await response.json();
const channels = research.alternatives.filter(candidate => candidate.manifestVerified).map(candidate => {
  const channel = catalog.channels.find(c => candidate.channelIds.includes(c.id));
  if (!channel) throw new Error(`Emittente assente: ${candidate.name}`);
  const stream = channel.streams.find(s => s.url === candidate.streamUrl);
  if (!stream) throw new Error(`Alternativa non ancora nel catalogo: ${candidate.name}`);
  return { ...channel, stream, streams: [stream], alternativeStreams: 0 };
});
// Additional check explicitly requested while investigating Super J's old-URL timeout.
const superJ = catalog.channels.find(channel => channel.id === "SuperJTVTeramo.it");
if (superJ) {
  const stream = superJ.streams.find(s => s.url === "https://59d39900ebfb8.streamlock.net/SuperJtv/SuperJtv/playlist.m3u8");
  if (stream) channels.push({ ...superJ, stream, streams: [stream], alternativeStreams: 0 });
}
await run(options, { preparePage: page => page.route("**/api/channels?country=IT", route =>
  route.fulfill({ json: { ...catalog, channels, catalogTotal: channels.length, withStream: channels.length } })) });
