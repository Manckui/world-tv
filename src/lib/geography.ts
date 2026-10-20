import type { CountryCode, TvGeography } from "@/types/tv";

export type RawFeed = { channel: string; id: string; is_main: boolean; broadcast_area: string[] };
export type RawSubdivision = { country: string; code: string; name: string; parent: string | null };
export type RawCity = { country: string; code: string; subdivision: string | null };
export const UNKNOWN_GEOGRAPHY: TvGeography = { regions: [], scope: "unknown", basis: "unknown", sourceUrl: null };

// Researched broadcaster seats, one file per country: data/geography/<country>.json
export type ResearchedGeography = {
  scope: "national" | "regional" | "local" | "foreign" | "unknown";
  regionCode: string | null; extraRegions?: string[]; city: string | null; province: string | null;
  countryCode: string; lat: number | null; lon: number | null;
  confidence: "high" | "medium" | "low"; sourceUrl: string | null;
};
export type GeographyFile = { version: 1; country: CountryCode; channels: Record<string, ResearchedGeography> };

// Explicit reviewed associations; never derive location merely from a word in a channel name.
const REGIONAL: Record<string, { code: string; sourceUrl: string }> = {
  "AntennaSicilia.it": { code: "IT-82", sourceUrl: "https://www.siciliaweb.it/live-antenna-sicilia" },
  "catalog:IT:telecolorsicilia": { code: "IT-82", sourceUrl: "https://www.siciliaweb.it/live-telecolor" },
  "VideoRegione.it": { code: "IT-82", sourceUrl: "https://www.vrsicilia.it/privacy-policy/" },
  "catalog:IT:videoregionesicilia": { code: "IT-82", sourceUrl: "https://www.vrsicilia.it/privacy-policy/" },
  "TelesudTrapani.it": { code: "IT-82", sourceUrl: "https://www.telesudweb.it/redazione-staff" },
  "catalog:IT:telesudtrapaninot247": { code: "IT-82", sourceUrl: "https://www.telesudweb.it/redazione-staff" },
  "TelecolorLombardia.it": { code: "IT-25", sourceUrl: "https://www.telecolor.net/privacy-e-cookie/" },
  "catalog:IT:telecolorlombardianot247": { code: "IT-25", sourceUrl: "https://www.telecolor.net/privacy-e-cookie/" },
  "catalog:IT:telecoloresalerno": { code: "IT-72", sourceUrl: "https://www.telecolore.it/la-redazione-di-telecolore/" },
};
const NATIONAL: Record<string, string[]> = {
  "https://www.raiplay.it/dirette": ["Rai1.it", "Rai2.it", "Rai3.it", "Rai4.it", "Rai5.it", "RaiMovie.it", "RaiPremium.it", "RaiGulp.it", "RaiYoyo.it", "RaiNews24.it", "RaiScuola.it", "RaiSport.it", "RaiStoria.it", "RaiRadio2Visual.it"],
  "https://mediasetinfinity.mediaset.it/guidatv": ["Canale5.it", "Rete4.it", "Italia1.it", "20.it", "Iris.it", "La5.it", "MediasetExtra.it", "TopCrime.it", "Focus.it", "Cine34.it", "Boing.it", "Italia2.it", "TGCom24.it", "Twentyseven.it", "Cartoonito.it"],
  "https://www.la7.it/dirette-tv": ["LA7.it", "La7Cinema.it"],
  "https://tg24.sky.it/diretta": ["SkyTG24.it"],
  "https://nove.tv/live-streaming-nove": ["Nove.it"],
  "https://realtime.it/live-streaming-real-time": ["RealTime.it"],
  "https://www.tv2000.it/chi-siamo/": ["TV2000.it"],
};
const nationalSources = new Map(Object.entries(NATIONAL).flatMap(([url, ids]) => ids.map(id => [id, url] as const)));

export function geographyLabel(geography?: TvGeography): string {
  if (geography?.scope === "foreign") return `Estero${geography.countryCode ? ` (${geography.countryCode})` : ""}${geography.city ? ` · ${geography.city}` : ""}`;
  if (geography?.regions.length) {
    const city = geography.city ? ` · ${geography.city}${geography.province ? ` (${geography.province})` : ""}` : "";
    return `${geography.basis === "broadcast_area" ? "Area" : "Regione"}: ${geography.regions.map(r => r.name).join(" / ")}${city}`;
  }
  return geography?.scope === "national" ? "Nazionale" : "Regione non indicata";
}

export function createGeographyLookup(feeds: RawFeed[], subdivisions: RawSubdivision[], cities: RawCity[], researched: Record<string, ResearchedGeography> = {}) {
  const bySubdivision = new Map(subdivisions.map(s => [s.code, s]));
  const byCity = new Map(cities.map(c => [c.code, c]));
  const byChannel = new Map<string, RawFeed[]>();
  for (const feed of feeds) byChannel.set(feed.channel, [...(byChannel.get(feed.channel) ?? []), feed]);

  function region(code: string, country: CountryCode): { code: string; name: string } | null {
    let subdivision = bySubdivision.get(code);
    const visited = new Set<string>();
    while (subdivision?.parent) {
      if (visited.has(subdivision.code)) return null;
      visited.add(subdivision.code);
      const parent = bySubdivision.get(subdivision.parent);
      if (!parent || parent.country !== country) break;
      subdivision = parent;
    }
    return subdivision?.country === country ? { code: subdivision.code, name: subdivision.name } : null;
  }

  return (channelId: string, country: CountryCode, feedId?: string | null): TvGeography => {
    const override = REGIONAL[channelId];
    if (override) {
      const location = region(override.code, country);
      if (location) return { regions: [location], scope: "regional", basis: "broadcaster", sourceUrl: override.sourceUrl };
    }
    const found = researched[channelId];
    // A feed-specific lookup keeps regional editions (e.g. Rai 3 TGR) on their catalog area.
    if (found && found.scope !== "unknown" && !feedId) {
      // National/foreign broadcasters keep their HQ city for the map, not a regional label.
      const codes = found.scope === "regional" || found.scope === "local" ? [found.regionCode, ...found.extraRegions ?? []] : [];
      const regions = codes.flatMap(code => {
        const location = code ? region(code, country) : null;
        return location ? [location] : [];
      });
      return { regions, scope: found.scope, basis: "research", sourceUrl: found.sourceUrl, city: found.city, province: found.province,
        coordinates: found.lat != null && found.lon != null ? { lat: found.lat, lon: found.lon } : null,
        confidence: found.confidence, ...found.scope === "foreign" ? { countryCode: found.countryCode } : {} };
    }
    const channelFeeds = byChannel.get(channelId) ?? [];
    const selected = feedId ? channelFeeds.filter(f => f.id === feedId) : channelFeeds.filter(f => f.is_main);
    const chosen = selected.length ? selected : !feedId && channelFeeds.length === 1 ? channelFeeds : [];
    const regions = new Map<string, { code: string; name: string }>();
    for (const area of chosen.flatMap(f => f.broadcast_area)) {
      const code = area.startsWith("s/") ? area.slice(2) : area.startsWith("ct/") ? byCity.get(area.slice(3))?.subdivision : null;
      const location = code ? region(code, country) : null;
      if (location) regions.set(location.code, location);
    }
    if (regions.size) return { regions: [...regions.values()].sort((a, b) => a.name.localeCompare(b.name)), scope: "regional", basis: "broadcast_area", sourceUrl: "https://iptv-org.github.io/api/feeds.json" };
    const sourceUrl = nationalSources.get(channelId);
    return sourceUrl ? { regions: [], scope: "national", basis: "broadcaster", sourceUrl } : UNKNOWN_GEOGRAPHY;
  };
}
