import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CountryCode } from "@/types/tv";

// Channels deleted with the "Elimina" button. Permanent: removed from the catalog for every client and the runner.
export type ExcludedChannel = { id: string; country: CountryCode; name: string | null; removedAt: string };
type ExcludedFile = { version: 1; channels: ExcludedChannel[] };

const FILENAME = path.join(process.cwd(), "data", "excluded-channels.json");
let writeChain: Promise<unknown> = Promise.resolve();

export async function readExcludedChannels(): Promise<ExcludedChannel[]> {
  try {
    const file = JSON.parse(await readFile(FILENAME, "utf8")) as ExcludedFile;
    if (file.version !== 1 || !Array.isArray(file.channels)) throw new Error("data/excluded-channels.json non valido");
    return file.channels;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function excludedChannelIds(country: CountryCode): Promise<Set<string>> {
  return new Set((await readExcludedChannels()).filter(channel => channel.country === country).map(channel => channel.id));
}

// Serialized atomic writes: concurrent deletions must not overwrite each other.
export function addExcludedChannels(country: CountryCode, channels: { id: string; name: string | null }[]): Promise<ExcludedChannel[]> {
  const pending = writeChain.then(async () => {
    const current = await readExcludedChannels();
    const known = new Set(current.filter(channel => channel.country === country).map(channel => channel.id));
    const removedAt = new Date().toISOString();
    const added = channels.filter(channel => !known.has(channel.id) && known.add(channel.id))
      .map(channel => ({ id: channel.id, country, name: channel.name, removedAt }));
    if (!added.length) return current;
    const next: ExcludedFile = { version: 1, channels: [...current, ...added] };
    await mkdir(path.dirname(FILENAME), { recursive: true });
    const temporary = `${FILENAME}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(next, null, 2) + "\n");
    await rename(temporary, FILENAME);
    return next.channels;
  });
  writeChain = pending.catch(() => {});
  return pending;
}
