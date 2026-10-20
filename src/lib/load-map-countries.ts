import { access } from "node:fs/promises";
import path from "node:path";
import { COUNTRIES } from "@/lib/countries";
import { REGIONS } from "@/lib/orbita-regions";
import { readCountryPack, type CountryRegion, type CatalogChannel } from "@/lib/country-pack";
import type { MapCountry } from "@/lib/map-countries";
import type { CountryCode } from "@/types/tv";

const maps: Partial<Record<CountryCode, Omit<MapCountry, "code" | "name" | "flag" | "regions">>> = {
  IT: { iso3: "ITA", map: "italy", credits: "credits", center: [12.5, 42] },
  ES: { iso3: "ESP", map: "spain", credits: "spain-credits", center: [-3.7, 40] },
  FR: { iso3: "FRA", map: "france", credits: "france-credits", center: [2.2, 46.6],
    overviewRegionCodes: ["FR-ARA", "FR-BFC", "FR-BRE", "FR-CVL", "FR-20R", "FR-GES", "FR-HDF",
      "FR-IDF", "FR-NOR", "FR-NAQ", "FR-OCC", "FR-PDL", "FR-PAC"] },
};

export async function loadMapCountries(): Promise<MapCountry[]> {
  const countries = await Promise.all(COUNTRIES.map(async country => {
    const map = maps[country.code];
    if (!map) return null;
    if (country.code === "IT") return { ...country, ...map, regions: REGIONS.map(region => ({
      ...region, center: [...region.center] as [number, number],
    })) };
    const [regions, catalog] = await Promise.all([
      readCountryPack<{ regions: CountryRegion[] }>("regions", country.code),
      readCountryPack<{ channels: CatalogChannel[] }>("catalogs", country.code),
    ]);
    // New countries can be researched independently. Publish their map entry
    // only once both the catalog and its regional geometry are present.
    if (!regions?.regions.length || !catalog?.channels.some(channel => channel.streams.length)) return null;
    try { await access(path.join(process.cwd(), "public", "maps", `${map.map}.json`)); }
    catch { return null; }
    return { ...country, ...map, regions: regions.regions };
  }));
  return countries.filter((country): country is MapCountry => country !== null);
}
