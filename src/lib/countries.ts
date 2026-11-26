import type { CountryCode, CountryOption } from "@/types/tv";

export const COUNTRIES: CountryOption[] = [
  { code: "IT", name: "Italia", flag: "🇮🇹" },
  { code: "ES", name: "Spagna", flag: "🇪🇸" },
  { code: "FR", name: "Francia", flag: "🇫🇷" },
  { code: "DE", name: "Germania", flag: "🇩🇪" },
  { code: "PT", name: "Portogallo", flag: "🇵🇹" },
  { code: "BR", name: "Brasile", flag: "🇧🇷" },
  { code: "MX", name: "Messico", flag: "🇲🇽" },
  { code: "NL", name: "Paesi Bassi", flag: "🇳🇱" },
  { code: "PL", name: "Polonia", flag: "🇵🇱" },
];

// Reference clocks, not inferred broadcaster locations. Intl applies the zone's DST rules.
export const COUNTRY_CLOCKS: Record<CountryCode, { timeZone: string; referenceCity: string; multipleZones: boolean }> = {
  IT: { timeZone: "Europe/Rome", referenceCity: "Roma", multipleZones: false },
  ES: { timeZone: "Europe/Madrid", referenceCity: "Madrid", multipleZones: true },
  FR: { timeZone: "Europe/Paris", referenceCity: "Parigi", multipleZones: true },
  DE: { timeZone: "Europe/Berlin", referenceCity: "Berlino", multipleZones: false },
  PT: { timeZone: "Europe/Lisbon", referenceCity: "Lisbona", multipleZones: true },
  BR: { timeZone: "America/Sao_Paulo", referenceCity: "Brasília", multipleZones: true },
  MX: { timeZone: "America/Mexico_City", referenceCity: "Città del Messico", multipleZones: true },
  NL: { timeZone: "Europe/Amsterdam", referenceCity: "Amsterdam", multipleZones: false },
  PL: { timeZone: "Europe/Warsaw", referenceCity: "Varsavia", multipleZones: false },
  VN: { timeZone: "Asia/Ho_Chi_Minh", referenceCity: "Ho Chi Minh", multipleZones: false },
  JP: { timeZone: "Asia/Tokyo", referenceCity: "Tokyo", multipleZones: false },
  CL: { timeZone: "America/Santiago", referenceCity: "Santiago", multipleZones: true },
  US: { timeZone: "America/New_York", referenceCity: "New York", multipleZones: true },
  ZA: { timeZone: "Africa/Johannesburg", referenceCity: "Johannesburg", multipleZones: false },
};
