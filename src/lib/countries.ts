import type { CountryCode, CountryOption } from "@/types/tv";

export const COUNTRIES: CountryOption[] = [
  { code: "IT", name: "Italia", flag: "🇮🇹" },
  { code: "ES", name: "Spagna", flag: "🇪🇸" },
  { code: "FR", name: "Francia", flag: "🇫🇷" },
];

// Reference clocks, not inferred broadcaster locations. Intl applies the zone's DST rules.
export const COUNTRY_CLOCKS: Record<CountryCode, { timeZone: string; referenceCity: string; multipleZones: boolean }> = {
  IT: { timeZone: "Europe/Rome", referenceCity: "Roma", multipleZones: false },
  ES: { timeZone: "Europe/Madrid", referenceCity: "Madrid", multipleZones: true },
  FR: { timeZone: "Europe/Paris", referenceCity: "Parigi", multipleZones: true },
  VN: { timeZone: "Asia/Ho_Chi_Minh", referenceCity: "Ho Chi Minh", multipleZones: false },
  JP: { timeZone: "Asia/Tokyo", referenceCity: "Tokyo", multipleZones: false },
  CL: { timeZone: "America/Santiago", referenceCity: "Santiago", multipleZones: true },
  US: { timeZone: "America/New_York", referenceCity: "New York", multipleZones: true },
  ZA: { timeZone: "Africa/Johannesburg", referenceCity: "Johannesburg", multipleZones: false },
};
