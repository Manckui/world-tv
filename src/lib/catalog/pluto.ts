import { normalizeChannelName } from "@/lib/catalog/m3u";
import type { CatalogSource, TvChannel, TvStream } from "@/types/tv";

export const PLUTO_PORTAL_SOURCE: CatalogSource = {
  id: "pluto-official-it", name: "Pluto TV · portale ufficiale", url: "https://pluto.tv/it/watch/live-tv/",
};

function isPlutoStream(stream: TvStream): boolean {
  const url = new URL(stream.url);
  return url.hostname === "pluto.tv" || url.hostname.endsWith(".pluto.tv") ||
    url.hostname === "jmp2.uk" && url.pathname.startsWith("/plu-");
}

// A portal is a manual review, not a successful test of its individual feeds.
// Keep independent broadcasters when they have sources outside Pluto.
export function replacePlutoChannels(channels: TvChannel[]): number {
  let removed = 0;
  const kept: TvChannel[] = [];
  for (const channel of channels) {
    if (channel.country !== "IT") { kept.push(channel); continue; }
    if (normalizeChannelName(channel.name).startsWith("plutotv") || channel.id === "PlutoTV.it") {
      removed++;
      continue;
    }
    const streams = channel.streams.filter(stream => !isPlutoStream(stream));
    if (!streams.some(stream => !stream.restriction)) { removed++; continue; }
    kept.push({ ...channel, streams, stream: streams[0], alternativeStreams: streams.length - 1 });
  }
  const geography: TvChannel["geography"] = { regions: [], scope: "unknown", basis: "unknown", sourceUrl: null };
  const stream: TvStream = {
    url: PLUTO_PORTAL_SOURCE.url, title: "Pluto TV · scegli una diretta", quality: null, label: null,
    requiresHeaders: false, needsVerification: true, sources: [PLUTO_PORTAL_SOURCE],
    format: "embed", restriction: null, geography,
  };
  kept.push({ id: "PlutoTV.it", name: "Pluto TV", country: "IT", categories: [],
    website: PLUTO_PORTAL_SOURCE.url, stream, streams: [stream], alternativeStreams: 0, geography });
  // No previousIds: failures or successes of genre feeds do not verify this portal.
  channels.splice(0, channels.length, ...kept.sort((a, b) => a.name.localeCompare(b.name, "it")));
  return removed;
}
