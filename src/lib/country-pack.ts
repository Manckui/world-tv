import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CountryCode } from "@/types/tv";

export type CountryRegion = { code: string; name: string; center: [number, number] };
export type CatalogChannel = {
  id: string;
  name: string;
  website: string | null;
  categories: string[];
  streams: { url: string; format: "hls" | "dash" | "embed"; page: string; verifiedAt?: string }[];
};
type CountryPack<T> = { version: number; country: CountryCode } & T;

// Country codes come from the application allowlist, never from a filesystem path.
// A missing pack means "not researched yet"; malformed files remain visible errors.
export async function readCountryPack<T>(folder: string, country: CountryCode): Promise<CountryPack<T> | null> {
  try {
    const value = JSON.parse(await readFile(path.join(process.cwd(), "data", folder, `${country}.json`), "utf8")) as CountryPack<T>;
    if (value.version !== 1 || value.country !== country) throw new Error(`Catalogo ${country}: versione o paese non valido`);
    return value;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
