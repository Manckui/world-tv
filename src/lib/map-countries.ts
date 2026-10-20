import type { CountryOption } from "@/types/tv";
import type { CountryRegion } from "@/lib/country-pack";

export type MapCountry = CountryOption & {
  iso3: string;
  map: string;
  credits: string;
  center: [number, number];
  overviewRegionCodes?: string[];
  regions: CountryRegion[];
};
