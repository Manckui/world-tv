// Build the France candidate inventory from public catalogs (IPTV-org API, IPTV-org FR list, Free-TV France).
// Output: reports/fr-candidates.json — candidates only; nothing here is declared working.
// Overseas regions are listed in IPTV-org under their own country codes (GP, MQ, GF, RE, YT…): they are France.
import { writeFile } from "node:fs/promises";

const API = "https://iptv-org.github.io/api";
const PLAYLISTS = [
  { id: "iptv-org-fr", name: "IPTV-org · lista Francia", url: "https://iptv-org.github.io/iptv/countries/fr.m3u" },
  { id: "free-tv-fr", name: "Free-TV · France", url: "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_france.m3u8" },
];
const FRENCH_COUNTRIES = new Set(["FR", "GP", "MQ", "GF", "RE", "YT", "PM", "BL", "MF", "NC", "PF", "WF"]);
// Commercial/public groups that do not publish free unauthenticated web streams: copies of their
// channels on bare IPs or third-party hosts are unofficial restreams and are never tested.
const PROTECTED_NAMES = /^(tf1|tmc|tfx|lci|tf1 series films|m6|w9|6ter|gulli|paris premiere|france ?[2345]|france 3 |canal\+|c8|cstar|cnews|bfm ?tv|rmc (story|decouverte)|cherie 25|nrj 12|teva)/i;
const IP_HOST = /^\d{1,3}(\.\d{1,3}){3}$/;
// Third-party restream/scraper hosts seen in public lists: not published by the broadcasters.
const RESTREAM_HOSTS = /(^|\.)(raw\.githubusercontent\.com|mcquack\.net|mangeinde4\.lat|freem3u\.xyz|tangotv\.in|ottrast\.com|jmp2\.uk|pluto\.tv|6cloud\.fr)$/;
// Out of scope for a map of French TV: other-language diaspora/foreign feeds, Pluto TV (removed in Italy at the user's request).
const OUT_OF_SCOPE = /^(persiana|4 ?afghanistan|4kurd|iran nama|euronews (?!french)|tv5 ?monde (asia|africa|latin|pacific)|trace (africa|afrikora|ayiti|brazuca|ivoire|jama|kitoko|latina|mboa|muzika|mziki|naija|ngoma|toca|sport)|.*pluto tv|.*by pluto tv|africa ?24 english|africanews english|zee one)/i;

const download = async url => {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
};
const normalize = name => name.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/\s*\((?:\d+p|.*?not 24\/7|geo[^)]*)\)\s*/gi, " ")
  .replace(/[ⒼⓈⓎⒹ]/g, "").replace(/\s+(HD|SD|FHD)$/i, "").toLowerCase().replace(/[^a-z0-9]/g, "");

function format(url) {
  const parsed = new URL(url);
  if (/(^|\.)dailymotion\.com$/.test(parsed.hostname)) {
    const video = parsed.pathname.match(/\/video\/([a-z0-9]+)/i)?.[1];
    return video ? { format: "embed", url: `https://geo.dailymotion.com/player.html?video=${video}` } : null;
  }
  if (/(^|\.)(youtube\.com|youtu\.be)$/.test(parsed.hostname)) return null;
  if (/\.mpd$/i.test(parsed.pathname)) return { format: "dash", url };
  if (/\.m3u8?$/i.test(parsed.pathname)) return { format: "hls", url };
  return { format: "page", url };
}

function parseM3u(text, source) {
  const entries = [];
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("#EXTINF:")) {
      const attrs = Object.fromEntries([...line.matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
      const name = line.slice(line.lastIndexOf(",") + 1).trim();
      current = { id: attrs["tvg-id"] ?? "", name: attrs["tvg-name"] || name, headers: false };
    } else if (/^#(EXTVLCOPT|KODIPROP|EXTHTTP):/i.test(line)) {
      if (current && /user.agent|referr?er|headers|license/i.test(line)) current.headers = true;
    } else if (line && !line.startsWith("#") && current) {
      const [url, options] = line.split("|", 2);
      entries.push({ ...current, url, headers: current.headers || Boolean(options), source });
      current = null;
    }
  }
  return entries;
}

const [channels, streams, feeds] = await Promise.all(["channels", "streams", "feeds"].map(async file => JSON.parse(await download(`${API}/${file}.json`))));
const meta = new Map(channels.map(channel => [channel.id, channel]));
const french = channels.filter(channel => FRENCH_COUNTRIES.has(channel.country) && !channel.is_nsfw);
const frenchIds = new Set(french.map(channel => channel.id));
const byName = new Map();
for (const channel of french) byName.set(normalize(channel.name), [...byName.get(normalize(channel.name)) ?? [], channel]);

const raw = streams.filter(stream => frenchIds.has(stream.channel)).map(stream => ({ id: stream.channel, name: meta.get(stream.channel).name,
  url: stream.url, headers: Boolean(stream.referrer || stream.user_agent), feed: stream.feed ?? null, source: { id: "iptv-org", name: "IPTV-org API", url: API } }));
for (const playlist of PLAYLISTS) raw.push(...parseM3u(await download(playlist.url), { id: playlist.id, name: playlist.name, url: playlist.url }));

const result = new Map();
const rejected = [];
for (const entry of raw) {
  let parsed;
  try { parsed = format(entry.url); } catch { rejected.push({ ...entry, reason: "URL non valido" }); continue; }
  if (!parsed) { rejected.push({ ...entry, reason: "YouTube: non incorporabile con il player del progetto" }); continue; }
  const channelId = frenchIds.has(entry.id.split("@")[0]) ? entry.id.split("@")[0] : byName.get(normalize(entry.name))?.length === 1 ? byName.get(normalize(entry.name))[0].id : null;
  const channel = channelId ? meta.get(channelId) : null;
  if (!channel && entry.source.id === "iptv-org-fr" && !entry.id) { /* unidentified entries of the FR list are still candidates */ }
  const name = channel?.name ?? entry.name.replace(/\s*\((?:\d+p|.*?not 24\/7|geo[^)]*)\)|\s*\[.*?\]|[ⒼⓈⓎⒹ]/gi, "").trim();
  const host = new URL(parsed.url).hostname;
  if (PROTECTED_NAMES.test(name) && (IP_HOST.test(host) || !/(tf1|m6|francetv|ftven|canal|bfm|rmc|nrj|arte)/i.test(host))) {
    rejected.push({ ...entry, reason: "Restream non ufficiale di un canale di un grande gruppo (nessuna diretta libera pubblicata dall'emittente)" }); continue;
  }
  if (OUT_OF_SCOPE.test(name)) { rejected.push({ ...entry, reason: "Fuori ambito: canale estero/diaspora o Pluto TV" }); continue; }
  if (RESTREAM_HOSTS.test(host)) { rejected.push({ ...entry, reason: "Host di restream/scraping non pubblicato dall'emittente" }); continue; }
  // Bare IPs in public lists are mostly restreams; official sources are added after checking the broadcaster's page.
  if (IP_HOST.test(host)) { rejected.push({ ...entry, reason: "Server su IP senza dominio: provenienza non verificabile" }); continue; }
  if (entry.headers) { rejected.push({ ...entry, reason: "Richiede header simulati (User-Agent/Referer)" }); continue; }
  if (parsed.format === "page") { rejected.push({ ...entry, reason: "Pagina web, non flusso: da ispezionare" }); continue; }
  const id = channelId ?? `catalog:FR:${normalize(name)}`;
  const item = result.get(id) ?? { id, name, country: channel?.country ?? "FR", website: channel?.website ?? null,
    categories: channel?.categories ?? [], closed: channel?.closed ?? null, streams: [] };
  const existing = item.streams.find(stream => stream.url === parsed.url);
  if (existing) { if (!existing.sources.some(s => s.id === entry.source.id)) existing.sources.push(entry.source); }
  else item.streams.push({ url: parsed.url, format: parsed.format, feed: entry.feed ?? null, sources: [entry.source] });
  result.set(id, item);
}
const items = [...result.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
const feedAreas = Object.fromEntries(feeds.filter(feed => result.has(feed.channel)).map(feed => [`${feed.channel}@${feed.id}`, feed.broadcast_area]));
await writeFile("reports/fr-candidates.json", JSON.stringify({ version: 1, country: "FR", generatedAt: new Date().toISOString(),
  sources: [{ id: "iptv-org", url: API }, ...PLAYLISTS], channels: items, feedAreas, rejected }, null, 2) + "\n");
console.log(`${items.length} emittenti candidate, ${items.reduce((n, c) => n + c.streams.length, 0)} fonti; ${rejected.length} voci scartate.`);
