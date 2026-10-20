import type { CountryCode, TvChannel } from "@/types/tv";
import { countryName, translate, type Locale } from "@/lib/i18n";

export type MapLocation = { level: "world" | "country" | "region"; regionCode?: string; countryCode?: CountryCode };
export type CatalogTab = "regions" | "national" | "all";
export type NavigationTab = "map" | "channels" | "favorites";

export function isRegional(channel: TvChannel, regionCode: string): boolean {
  // A broadcaster's headquarters are not its broadcast area. National channels
  // stay in the country list even when their address has a region attached.
  return ["regional", "local"].includes(channel.geography.scope)
    && channel.geography.regions.some(region => region.code === regionCode);
}

export function channelLocation(channel: TvChannel, locale: Locale = "it"): string {
  const country = countryName(channel.country, locale);
  if (channel.geography.scope === "national") return `${country} · ${translate(locale, "TV nazionale")}`;
  const region = channel.geography.regions[0]?.name;
  return [channel.geography.city, region].filter(Boolean).join(" · ") || country;
}

export function matchesSearch(channel: TvChannel, query: string, locale: Locale = "it"): boolean {
  return normalize(`${channel.name} ${channelLocation(channel, locale)} ${channel.categories.join(" ")}`).includes(normalize(query));
}

export function normalize(value: string): string {
  return value.toLocaleLowerCase("it").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}
