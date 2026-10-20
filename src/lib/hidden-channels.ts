import type { CountryCode } from "@/types/tv";

// Legacy key: deletions saved only in this browser before they were persisted on the server.
const LEGACY_STORAGE_KEY = "world-tv-lab:hidden-channels:v1";
type Snapshot = { channelIds: string[]; storageError: string };
const empty: Snapshot = { channelIds: [], storageError: "" };
let snapshot = empty;
let initialized = false;
const listeners = new Set<() => void>();

function update(next: Snapshot) {
  snapshot = next;
  listeners.forEach(listener => listener());
}

async function saveOnServer(country: CountryCode, channels: { id: string; name: string | null }[]) {
  const response = await fetch("/api/excluded-channels", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country, channels }) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

// One-time migration of old local deletions; the key is removed only after the server saved them.
function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  let saved: unknown;
  try { saved = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) ?? "null"); } catch { saved = null; }
  if (!Array.isArray(saved) || !saved.length || !saved.every(id => typeof id === "string")) return;
  const ids = [...new Set(saved as string[])];
  snapshot = { channelIds: ids, storageError: "" };
  saveOnServer("IT", ids.map(id => ({ id, name: null })))
    .then(() => { try { localStorage.removeItem(LEGACY_STORAGE_KEY); } catch {} })
    .catch(() => update({ ...snapshot, storageError: "Eliminazioni precedenti non ancora salvate sul server: verranno ritentate al prossimo caricamento." }));
}

export function subscribeHiddenChannels(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function getHiddenChannels() { initialize(); return snapshot; }
export function getServerHiddenChannels() { return empty; }

// Session-only hide (automatic duplicates). The catalog itself is unchanged.
export function hideChannel(channelId: string) {
  initialize();
  if (!snapshot.channelIds.includes(channelId)) update({ ...snapshot, channelIds: [...snapshot.channelIds, channelId] });
}

// Permanent deletion: hidden immediately, then removed from the server catalog for everyone.
export function deleteChannel(country: CountryCode, channelId: string, name: string) {
  hideChannel(channelId);
  saveOnServer(country, [{ id: channelId, name }])
    .catch(() => update({ ...snapshot, storageError: `Eliminazione di ${name} non salvata sul server: ricomparirà al ricaricamento.` }));
}
