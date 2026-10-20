import { COUNTRIES } from "@/lib/countries";
import { createGeographyLookup, type GeographyFile, type RawFeed, type RawSubdivision, type RawCity } from "@/lib/geography";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { httpUrl, normalizeChannelName, parseM3u, streamFormat, streamRestriction, type PlaylistEntry } from "@/lib/catalog/m3u";
import { addTvDreamAlternatives } from "@/lib/catalog/tvdream-alternatives";
import { PLUTO_PORTAL_SOURCE, replacePlutoChannels } from "@/lib/catalog/pluto";
import { addOfficialAlternatives, type OfficialAlternative } from "@/lib/catalog/official-alternatives";
import { excludedChannelIds } from "@/lib/excluded-channels";
import { readCountryPack, type CatalogChannel, type CountryRegion } from "@/lib/country-pack";
import type { CatalogReport, CatalogSource, ChannelApiResponse, CountryCode, TvChannel } from "@/types/tv";

const API_ROOT = "https://iptv-org.github.io/api";
const IPTV_SOURCE: CatalogSource = { id: "iptv-org", name: "IPTV-org API", url: API_ROOT };
export const ITALIAN_PLAYLISTS: CatalogSource[] = [
  { id: "iptv-org-it", name: "IPTV-org · lista Italia", url: "https://iptv-org.github.io/iptv/countries/it.m3u" },
  { id: "free-tv-it", name: "Free-TV · Italia", url: "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_italy.m3u8" },
  { id: "tundrak-it", name: "IPTV-Italia · Tundrak", url: "https://raw.githubusercontent.com/Tundrak/IPTV-Italia/main/iptvitaplus.m3u" },
  { id: "tv2000-official", name: "TV2000 · player ufficiale", url: "https://www.tv2000.it/stream/?media=tv2000_live" },
  { id: "antennatre-official", name: "Antenna Tre · player ufficiale", url: "https://player.streamshow.it/hosted/antennatreveneto.php?autoplay=false&muted=true" },
  { id: "canale10-official", name: "Canale 10 · player ufficiale", url: "https://nrvideo1.newradio.it:8080/VideoPlayer/desxcerbht?autoplay=1" },
  { id: "fmtv-official", name: "FM TV Marche · sito ufficiale", url: "https://www.fmtv.live/streaming/" },
  { id: "superj-official", name: "Super J · sito ufficiale", url: "https://www.superj.it/" },
];
const OFFICIAL_PLAYERS: Record<string, { id: string; name: string }> = {
  "tv2000-official": { id: "TV2000.it", name: "TV2000" },
  "antennatre-official": { id: "AntennaTre.it", name: "Antenna Tre" },
  "canale10-official": { id: "CanaleDieci.it", name: "Canale Dieci" },
  "fmtv-official": { id: "", name: "FM TV Marche" },
  "superj-official": { id: "SuperJTVTeramo.it", name: "Super J TV Teramo" },
};

export type RawChannel = { id: string; name: string; country: string; categories: string[]; is_nsfw: boolean; closed: string | null; website: string | null };
type RawStream = { channel: string | null; feed?: string | null; title: string | null; url: string; referrer: string | null; user_agent: string | null; quality: string | null; label: string | null };

// Large catalogs exceed Next's fetch-cache limit. Cache catalog downloads in memory for one hour.
// Only fixed public catalog URLs are fetched here; stream bytes always come directly to the browser.
const downloads = new Map<string, { expires: number; pending: Promise<string> }>();
async function download(url: string): Promise<string> {
  const cached = downloads.get(url);
  if (cached && cached.expires > Date.now()) return cached.pending;
  const pending = (async () => {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  })();
  const entry = { expires: Date.now() + 3_600_000, pending };
  downloads.set(url, entry);
  try { return await pending; } catch (error) {
    if (downloads.get(url) === entry) downloads.delete(url);
    throw error;
  }
}

const ALIASES: Record<string, string> = {
  "raiitalia": "RaiItalia.it", "raiitaliaasiaeaustralia": "RaiItalia.it",
  "raiitaliaeuropaeafrica": "RaiItalia.it", "raiitalianordamerica": "RaiItalia.it",
  "raiitaliasudamerica": "RaiItalia.it",
  "20mediaset": "20.it", "20": "20.it", "27twentyseven": "Twentyseven.it", "twentyseven": "Twentyseven.it",
  "27": "Twentyseven.it", "raisporthd": "RaiSport.it", "raisport": "RaiSport.it",
  "rairadio2": "RaiRadio2Visual.it", "rairadio2visual": "RaiRadio2Visual.it",
  "antennatreveneto": "AntennaTre.it", "antennatrevenetogeoblocked": "AntennaTre.it",
  "canale10": "CanaleDieci.it", "canale10not247": "CanaleDieci.it", "canaledieci": "CanaleDieci.it",
  "superjtv": "SuperJTVTeramo.it", "superjtvteramo": "SuperJTVTeramo.it", "superj": "SuperJTVTeramo.it",
};

// Explicit catalog exclusions requested during the Italy review.
const EXCLUDED_ITALIAN_NAMES = new Set(["16annieincinta", "adnkronos", "radiocapitaltv", "stiletv"]);
const EXCLUDED_ITALIAN_STREAMS = new Set([
  "https://amg16146-wbdi-amg16146c8-samsung-it-1841.playouts.now.amagi.tv/playlist/amg16146-warnerbrosdiscoveryitalia-dmax-samsungit/playlist.m3u8",
]);

export function mergeCatalog(countryCode: CountryCode, metadata: RawChannel[], entries: PlaylistEntry[], geographyFor = createGeographyLookup([], [], [])): TvChannel[] {
  const eligible = metadata.filter(c => !c.is_nsfw && (countryCode === "IT" || !c.closed));
  const byId = new Map(eligible.map(c => [c.id, c]));
  const byName = new Map<string, RawChannel[]>();
  const forbiddenIds = new Set(metadata.filter(c => c.is_nsfw || countryCode !== "IT" && c.closed).map(c => c.id));
  for (const c of eligible.filter(c => c.country === countryCode)) {
    const key = normalizeChannelName(c.name);
    byName.set(key, [...(byName.get(key) ?? []), c]);
  }
  const channels = new Map<string, TvChannel>();
  for (const entry of entries) {
    if (entry.stream.format === "external") continue;
    if (countryCode === "IT" && EXCLUDED_ITALIAN_STREAMS.has(entry.stream.url)) continue;
    const normalized = normalizeChannelName(entry.name);
    if (countryCode === "IT" && EXCLUDED_ITALIAN_NAMES.has(normalized)) continue;
    if (forbiddenIds.has(entry.id)) continue;
    const names = byName.get(normalized) ?? [];
    const raiItalia = countryCode === "IT" && ALIASES[normalized] === "RaiItalia.it";
    const canaleDieci = countryCode === "IT" && (entry.id === "CanaleDieci.it" || ALIASES[normalized] === "CanaleDieci.it");
    const superJ = countryCode === "IT" && (entry.id === "SuperJTVTeramo.it" || ALIASES[normalized] === "SuperJTVTeramo.it");
    const meta = (raiItalia ? byId.get("RaiItalia.it") : undefined) ?? (canaleDieci ? byId.get("CanaleDieci.it") : undefined) ?? (superJ ? byId.get("SuperJTVTeramo.it") : undefined) ?? byId.get(entry.id) ?? byId.get(ALIASES[normalized]) ?? (names.length === 1 ? names[0] : undefined);
    if (countryCode === "IT" && meta && EXCLUDED_ITALIAN_NAMES.has(normalizeChannelName(meta.name))) continue;
    const id = raiItalia ? "RaiItalia.it" : canaleDieci ? "CanaleDieci.it" : superJ ? "SuperJTVTeramo.it" : meta?.id ?? (countryCode === "IT" && ALIASES[normalized] === "AntennaTre.it" ? "AntennaTre.it" : `catalog:${countryCode}:${normalized}`);
    const geography = geographyFor(id, countryCode);
    const streamGeography = geographyFor(id, countryCode, entry.stream.feedId);
    let channel = channels.get(id);
    if (!channel) {
      channel = { id, name: raiItalia ? "Rai Italia" : meta?.name ?? entry.name, country: countryCode, categories: meta?.categories ?? [],
        website: httpUrl(meta?.website), stream: entry.stream, streams: [], alternativeStreams: 0, geography };
      channels.set(id, channel);
    }
    const duplicate = channel.streams.find(s => s.url === entry.stream.url);
    if (duplicate) {
      for (const source of entry.stream.sources) if (!duplicate.sources.some(s => s.id === source.id)) duplicate.sources.push(source);
      if (entry.stream.needsVerification) duplicate.needsVerification = true;
      if (!entry.stream.restriction) { duplicate.restriction = null; duplicate.requiresHeaders = false; }
    } else channel.streams.push({ ...entry.stream, sources: [...entry.stream.sources], geography: streamGeography });
  }
  for (const channel of channels.values()) {
    channel.streams.sort((a, b) => Number(Boolean(a.restriction)) - Number(Boolean(b.restriction)));
    if (channel.id === "AntennaTre.it") channel.streams.sort((a, b) => Number(b.sources.some(s => s.id === "antennatre-official")) - Number(a.sources.some(s => s.id === "antennatre-official")));
    if (channel.id === "CanaleDieci.it") channel.streams.sort((a, b) => Number(b.sources.some(s => s.id === "canale10-official")) - Number(a.sources.some(s => s.id === "canale10-official")));
    if (channel.id === "catalog:IT:fmtvmarche") channel.streams.sort((a, b) => Number(b.sources.some(s => s.id === "fmtv-official")) - Number(a.sources.some(s => s.id === "fmtv-official")));
    if (channel.id === "SuperJTVTeramo.it") channel.streams.sort((a, b) => Number(b.sources.some(s => s.id === "superj-official")) - Number(a.sources.some(s => s.id === "superj-official")));
    channel.stream = channel.streams[0];
    channel.alternativeStreams = channel.streams.length - 1;
    if (/^Rai[123]\.it$/.test(channel.id)) channel.website = `https://www.raiplay.it/dirette/${channel.id.split(".")[0].toLowerCase()}`;
    if (channel.id === "AntennaTre.it") { channel.name = "Antenna Tre"; channel.website = "https://antennatre.medianordest.it/live/"; }
    if (channel.id === "DMAX.it") channel.website = "https://dmax.it/live-streaming-dmax";
    if (channel.id === "CanaleDieci.it") {
      channel.name = "Canale Dieci";
      channel.website = "https://canaledieci.it/diretta/";
      channel.previousIds = ["catalog:IT:canale10", "catalog:IT:canale10not247"];
    }
    if (channel.id === "catalog:IT:fmtvmarche") channel.website = "https://www.fmtv.live/streaming/";
    if (channel.id === "SuperJTVTeramo.it") {
      channel.name = "Super J TV Teramo";
      channel.website = "https://www.superj.it/";
      channel.previousIds = ["catalog:IT:superjtv", "catalog:IT:superj"];
    }
  }
  return [...channels.values()].filter(c => c.streams.some(s => !s.restriction)).sort((a, b) => a.name.localeCompare(b.name, "it"));
}

async function readResearchedGeography(countryCode: CountryCode): Promise<GeographyFile["channels"]> {
  try {
    const file = JSON.parse(await readFile(path.join(process.cwd(), "data", "geography", `${countryCode}.json`), "utf8")) as GeographyFile;
    return file.version === 1 && file.country === countryCode ? file.channels : {};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

// Sources found by web research and verified in Chrome (scripts/probe-channels.mjs).
async function readResearchedAlternatives(countryCode: CountryCode): Promise<OfficialAlternative[]> {
  try {
    const file = JSON.parse(await readFile(path.join(process.cwd(), "data", "alternatives", `${countryCode}.json`), "utf8")) as { version: number; alternatives: OfficialAlternative[] };
    return file.version === 1 ? file.alternatives : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function getChannelsByCountry(countryCode: CountryCode): Promise<ChannelApiResponse> {
  const country = COUNTRIES.find(c => c.code === countryCode);
  if (!country) throw new Error("Paese non supportato dal POC");
  const playlists = countryCode === "IT" ? ITALIAN_PLAYLISTS : [];
  const [pack, regionPack] = await Promise.all([
    readCountryPack<{ channels: CatalogChannel[] }>("catalogs", countryCode),
    readCountryPack<{ regions: CountryRegion[] }>("regions", countryCode),
  ]);
  const results = await Promise.allSettled([
    pack ? Promise.resolve([]) : download(`${API_ROOT}/channels.json`).then(text => JSON.parse(text) as RawChannel[]),
    pack ? Promise.resolve([]) : download(`${API_ROOT}/streams.json`).then(text => JSON.parse(text) as RawStream[]),
    ...playlists.map(source => download(source.url).then(text => {
      const official = OFFICIAL_PLAYERS[source.id];
      if (!official) return parseM3u(text, source);
      const urls = [...new Set(text.match(/https?:[^"'<>\s]+\.m3u8[^"'<>\s]*/g) ?? [])];
      if (!urls.length) throw new Error("Il player ufficiale non pubblica un URL HLS leggibile");
      return urls.flatMap(raw => {
        const url = httpUrl(raw);
        return url ? [{ ...official, stream: { url, title: null, quality: null, label: null,
          needsVerification: source.id !== "tv2000-official",
          requiresHeaders: false, sources: [source], format: streamFormat(url), restriction: null } }] : [];
      });
    })),
    ...["feeds", "subdivisions", "cities"].map(file => pack ? Promise.resolve([])
      : download(`${API_ROOT}/${file}.json`).then(text => JSON.parse(text))),
  ]);
  let metadata = results[0].status === "fulfilled" ? results[0].value as RawChannel[] : [];
  if (pack) {
    const curatedIds = new Set(pack.channels.map(channel => channel.id));
    metadata = [...metadata.filter(channel => !curatedIds.has(channel.id)), ...pack.channels.map(channel => ({
      ...channel, country: countryCode, is_nsfw: false, closed: null,
    }))];
  }
  const rawStreams = results[1].status === "fulfilled" ? results[1].value as RawStream[] : [];
  const geographyOffset = playlists.length + 2;
  const valueAt = <T,>(index: number): T[] => results[index].status === "fulfilled" ? results[index].value as T[] : [];
  const subdivisions = [...valueAt<RawSubdivision>(geographyOffset + 1),
    ...(regionPack?.regions ?? []).map(region => ({ ...region, country: countryCode, parent: null }))];
  const geographyFor = createGeographyLookup(valueAt<RawFeed>(geographyOffset), subdivisions, valueAt<RawCity>(geographyOffset + 2),
    await readResearchedGeography(countryCode));
  const geographyWarnings = ["feed", "regioni", "città"].flatMap((name, i) => results[geographyOffset + i].status === "rejected" ? [`Metadati ${name} non scaricabili: alcune regioni potrebbero non essere indicate.`] : []);
  if (!pack && countryCode !== "IT" && (results[0].status === "rejected" || results[1].status === "rejected")) throw new Error("Download IPTV-org non riuscito");
  const byId = new Map(metadata.map(c => [c.id, c]));
  const ids = new Set(metadata.filter(c => c.country === countryCode && !c.is_nsfw && (countryCode === "IT" || !c.closed)).map(c => c.id));
  const entries: PlaylistEntry[] = (pack ? [] : rawStreams).flatMap(raw => {
    const url = httpUrl(raw.url);
    if (!raw.channel || !ids.has(raw.channel) || !url) return [];
    const requiresHeaders = Boolean(raw.referrer || raw.user_agent);
    return [{ id: raw.channel, name: byId.get(raw.channel)!.name, stream: {
      url, title: raw.title ?? null, quality: raw.quality ?? null, label: raw.label ?? null,
      requiresHeaders, sources: [IPTV_SOURCE], format: streamFormat(url), restriction: streamRestriction(url),
      feedId: raw.feed ?? null,
    } }];
  }).sort((a, b) => Number(Boolean(a.stream.label)) - Number(Boolean(b.stream.label)));
  const errorText = (result: PromiseSettledResult<unknown>) => result.status === "rejected" ? String(result.reason instanceof Error ? result.reason.message : result.reason) : null;
  const apiError = errorText(results[0]) ?? errorText(results[1]);
  const sources: CatalogReport[] = pack ? [] : [{ ...IPTV_SOURCE, status: apiError ? "failed" : "loaded", entries: entries.length, error: apiError }];
  if (pack) {
    // The researched pack fixes the test queue. New upstream URLs cannot silently
    // appear as tested channels, and official sources keep their provenance.
    for (const channel of pack.channels) {
      for (const stream of channel.streams) {
        const url = httpUrl(stream.url);
        if (!url || !httpUrl(stream.page)) throw new Error(`Fonte non valida: ${channel.id}`);
        entries.push({ id: channel.id, name: channel.name, stream: {
          url, format: stream.format, title: null, quality: null, label: null,
          needsVerification: !stream.verifiedAt, requiresHeaders: false, restriction: streamRestriction(url),
          sources: [{ id: `research:${countryCode}:${channel.id}`, name: `${channel.name} · fonte documentata`, url: stream.page }],
        } });
      }
    }
    sources.push({ id: `research:${countryCode}`, name: `Catalogo locale · ${country.name}`,
      url: `/api/channels?country=${countryCode}`, status: "loaded", entries: entries.length, error: null });
  }
  playlists.forEach((source, i) => {
    const result = results[i + 2];
    const added = result.status === "fulfilled" ? result.value as PlaylistEntry[] : [];
    entries.push(...added);
    sources.push({ ...source, status: result.status === "fulfilled" ? "loaded" : "failed", entries: added.length, error: errorText(result) });
  });
  if (!sources.some(s => s.status === "loaded")) throw new Error("Nessun catalogo scaricabile. Riprova più tardi.");
  const channels = mergeCatalog(countryCode, metadata, entries, geographyFor);
  if (countryCode === "IT") {
    const added = addTvDreamAlternatives(channels);
    sources.push({ id: "tvdream-uncertain-it", name: "TVdream · alternative del 17/09/2026", url: "https://www.tvdream.net/web-tv/paesi/italia/",
      status: "loaded", entries: added, error: null });
    replacePlutoChannels(channels);
    sources.push({ ...PLUTO_PORTAL_SOURCE, status: "loaded", entries: 1, error: null });
  }
  addOfficialAlternatives(channels, await readResearchedAlternatives(countryCode));
  // Channels deleted with the "Elimina" button are gone for every client and test run.
  const excluded = await excludedChannelIds(countryCode);
  if (excluded.size) channels.splice(0, channels.length, ...channels.filter(channel => !excluded.has(channel.id)));
  return { country, catalogTotal: pack?.channels.length ?? (countryCode === "IT" ? channels.length : ids.size), withStream: channels.length, channels, sources, geographyWarnings, fetchedAt: new Date().toISOString() };
}
