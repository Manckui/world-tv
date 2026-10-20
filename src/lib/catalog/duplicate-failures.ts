import { normalizeChannelName } from "@/lib/catalog/m3u";
import type { ChannelTestStatus } from "@/lib/automatic-results";
import type { TvChannel } from "@/types/tv";

function broadcasterKey(channel: TvChannel): string {
  // Ignore catalog annotations, not words identifying another broadcaster or region.
  const name = channel.name.replace(/\s*\[geo[\s-]*blocked\]\s*/gi, " ")
    .replace(/\s+geo[\s-]*blocked\s*$/i, "");
  return `${channel.country}:${normalizeChannelName(name)}`;
}

export function duplicateFailureIds(channels: TvChannel[], results: Record<string, ChannelTestStatus>): string[] {
  const successful = new Set(channels.filter(channel => results[channel.id] === "playing").map(broadcasterKey));
  return channels.filter(channel => results[channel.id] === "failed" && successful.has(broadcasterKey(channel)))
    .map(channel => channel.id);
}
