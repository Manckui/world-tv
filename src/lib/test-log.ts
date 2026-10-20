import type { PlaybackTest, TvChannel } from "@/types/tv";

export const TEST_LOG_KEY = "world-tv-lab:tests:v1";
const RESET_ID = "fresh-diagnostic-tests-2026-09-16";
export const OUTCOME_LABELS = { loading: "In test", ready: "Pronto · premi Play", playing: "Riproduzione verificata", failed: "Fallito", interrupted: "Interrotto · non verificato" };
export const ISSUE_LABELS = { access_denied: "Accesso negato", unavailable: "URL indisponibile / possibile offline", http: "Errore HTTP", network_cors: "Rete / possibile CORS", timeout: "Timeout", manifest: "Manifest HLS", incompatible: "Incompatibilità", media: "Errore video", drm: "DRM", unknown: "Causa non determinata" };

type Snapshot = { records: PlaybackTest[]; testerLocation: string; storageError: string; preferredSources: Record<string, string> };
const empty: Snapshot = { records: [], testerLocation: "", storageError: "", preferredSources: {} };
let snapshot = empty;
let initialized = false;
const listeners = new Set<() => void>();
const discarded = new Set<string>();

function isRecord(value: unknown): value is PlaybackTest {
  if (!value || typeof value !== "object") return false;
  const r = value as PlaybackTest;
  return typeof r.id === "string" && typeof r.channelId === "string" && typeof r.channelName === "string"
    && ["IT", "ES", "FR", "VN", "JP", "CL", "US", "ZA"].includes(r.country)
    && typeof r.streamUrl === "string" && typeof r.startedAt === "string" && !Number.isNaN(Date.parse(r.startedAt))
    && (r.confirmedAt === undefined || typeof r.confirmedAt === "string" && !Number.isNaN(Date.parse(r.confirmedAt)))
    && Object.hasOwn(OUTCOME_LABELS, r.outcome) && Array.isArray(r.events)
    && r.events.every(e => e && typeof e.at === "string" && typeof e.message === "string" && (e.issue === null || isIssue(e.issue)))
    && (r.lastError === null || isIssue(r.lastError));
}

function isIssue(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const issue = value as PlaybackTest["lastError"];
  return Boolean(issue && Object.hasOwn(ISSUE_LABELS, issue.category) && typeof issue.message === "string" && typeof issue.rawMessage === "string");
}

function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    const raw = localStorage.getItem(TEST_LOG_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.version !== 1 || !Array.isArray(saved.records) || !saved.records.every(isRecord)) throw new Error("invalid log");
    const now = new Date().toISOString();
    snapshot = {
      records: saved.resetId !== RESET_ID ? [] : saved.records.map((record: PlaybackTest) => record.outcome === "loading" || record.outcome === "ready"
        ? { ...record, outcome: "interrupted", endedAt: now, events: [...record.events, { at: now, kind: "interrupted", message: "Tentativo rimasto incompleto nella sessione precedente. Nessuna riproduzione verificata.", issue: null }] }
        : record),
      testerLocation: typeof saved.testerLocation === "string" ? saved.testerLocation : "",
      storageError: "",
      preferredSources: saved.preferredSources && typeof saved.preferredSources === "object" ? Object.fromEntries(Object.entries(saved.preferredSources).filter((entry): entry is [string, string] => typeof entry[1] === "string")) : {},
    };
  } catch {
    snapshot = { ...empty, storageError: "Registro locale non leggibile o non disponibile. I nuovi test restano visibili in questa sessione; esportali prima di chiudere." };
  }
}

function persist(next: Snapshot) {
  snapshot = next;
  try {
    localStorage.setItem(TEST_LOG_KEY, JSON.stringify({ version: 1, resetId: RESET_ID, records: next.records, testerLocation: next.testerLocation, preferredSources: next.preferredSources }));
    snapshot = { ...next, storageError: "" };
  } catch {
    snapshot = { ...next, storageError: "Salvataggio locale non riuscito (spazio esaurito o storage bloccato). Esporta i risultati prima di chiudere la pagina." };
  }
  listeners.forEach(listener => listener());
}

export function subscribeTestLog(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getTestLog() { initialize(); return snapshot; }
export function getServerTestLog() { return empty; }

export function saveTest(record: PlaybackTest) {
  initialize();
  if (discarded.has(record.id)) return;
  const previous = snapshot.records.find(r => r.id === record.id);
  // Player cleanup saves its own snapshot; retain the user's confirmation.
  if (previous?.confirmedAt) record = { ...record, confirmedAt: previous.confirmedAt };
  const exists = Boolean(previous);
  persist({ ...snapshot, records: exists ? snapshot.records.map(r => r.id === record.id ? record : r) : [record, ...snapshot.records] });
}

export function confirmSuccess(channel: TvChannel): boolean {
  initialize();
  const record = snapshot.records.find(r => r.channelId === channel.id && r.country === channel.country && r.streamUrl === channel.stream.url);
  if (!record) return false;
  saveTest({ ...record, confirmedAt: new Date().toISOString() });
  return true;
}

export function setTesterLocation(testerLocation: string) {
  initialize();
  persist({ ...snapshot, testerLocation });
}

export function clearTests() {
  initialize();
  snapshot.records.forEach(record => discarded.add(record.id));
  persist({ ...snapshot, records: [] });
}

export function preferSource(channelId: string, url: string) {
  initialize();
  if (!snapshot.records.some(r => r.channelId === channelId && r.streamUrl === url && (r.confirmedAt || r.outcome === "playing"))) return;
  persist({ ...snapshot, preferredSources: { ...snapshot.preferredSources, [channelId]: url } });
}

export function restoreSource(channelId: string) {
  initialize();
  const preferredSources = { ...snapshot.preferredSources };
  delete preferredSources[channelId];
  persist({ ...snapshot, preferredSources });
}

export function createTest(channel: TvChannel, player: PlaybackTest["player"]): PlaybackTest {
  initialize();
  const startedAt = new Date().toISOString();
  return {
    id: crypto.randomUUID(), channelId: channel.id, channelName: channel.name, country: channel.country,
    streamUrl: channel.stream.url, streamLabel: channel.stream.label, requiresHeaders: channel.stream.requiresHeaders,
    sources: channel.stream.sources, streamFormat: channel.stream.format, sourceHost: new URL(channel.stream.url).hostname,
    geography: channel.stream.geography ?? channel.geography, feedId: channel.stream.feedId ?? null,
    startedAt, endedAt: null, outcome: "loading", lastError: null, testerLocation: snapshot.testerLocation.trim(),
    userAgent: navigator.userAgent, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, player,
    events: [{ at: startedAt, kind: "started", message: "Test della fonte avviato nel browser. La riproduzione deve ancora essere verificata.", issue: null }], omittedEvents: 0,
  };
}

const CSV_COLUMNS = ["id", "channelId", "channelName", "country", "regions", "regionCodes", "geographicScope", "regionBasis", "regionSourceUrl", "feedId", "streamUrl", "sources", "sourceHost", "streamFormat", "startedAt", "endedAt", "outcome", "confirmedAt", "testerLocation", "player", "category", "stage", "httpStatus", "errorType", "errorDetails", "errorMessage", "resourceUrl", "userAgent", "timeZone", "events", "omittedEvents"];

function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  // Prevent spreadsheet formulas when opening broadcaster-provided names or URLs.
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function exportTests(records: PlaybackTest[], format: "json" | "csv", excludedChannelIds: string[] = []) {
  if (format === "json") return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), tests: records, excludedChannelIds }, null, 2);
  return "\uFEFF" + [CSV_COLUMNS.map(csvCell).join(","), ...records.map(r => [
    r.id, r.channelId, r.channelName, r.country, r.geography?.regions.map(region => region.name).join(" / "), r.geography?.regions.map(region => region.code).join(" / "), r.geography?.scope, r.geography?.basis, r.geography?.sourceUrl, r.feedId,
    r.streamUrl, JSON.stringify(r.sources ?? []), r.sourceHost, r.streamFormat, r.startedAt, r.endedAt, r.outcome, r.confirmedAt, r.testerLocation, r.player,
    r.lastError?.category, r.lastError?.stage, r.lastError?.httpStatus, r.lastError?.type, r.lastError?.details,
    r.lastError?.rawMessage, r.lastError?.resourceUrl, r.userAgent, r.timeZone, JSON.stringify(r.events), r.omittedEvents,
  ].map(csvCell).join(","))].join("\r\n");
}
