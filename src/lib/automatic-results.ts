import type { CountryCode, PlaybackIssue, PlaybackTest, TvChannel } from "@/types/tv";

export type AutomaticVerdict = "verified" | "failed" | "inconclusive" | "skipped" | "interrupted";
export type SourceAttempt = Pick<PlaybackTest, "id" | "channelId" | "country" | "streamUrl" | "streamFormat" | "startedAt" | "endedAt" | "outcome" | "lastError" | "confirmedAt"> & {
  automation?: { verdict: AutomaticVerdict; complete: boolean; reason: string };
};
export type AutomaticReport = {
  country: CountryCode;
  status: "missing" | "running" | "paused" | "complete" | "limited" | "error";
  exportedAt: string | null;
  testerLocation: string;
  total: number;
  completed: number;
  results: SourceAttempt[];
  recheck?: { status: AutomaticReport["status"]; exportedAt: string | null; total: number; completed: number; testerLocation: string };
  warnings?: string[];
};
export type ChannelTestStatus = "playing" | "failed" | "loading" | "idle" | "partial" | "uncertain" | "blocked";
export const CHANNEL_TEST_LABELS: Record<ChannelTestStatus, string> = {
  playing: "SUCCESSO", failed: "ERRORE", loading: "TEST…", idle: "DA TESTARE",
  partial: "TEST PARZIALE", uncertain: "DA VERIFICARE", blocked: "NON TESTABILE",
};

export function mergeSourceAttempts(manual: SourceAttempt[], automatic: SourceAttempt[]): SourceAttempt[] {
  return [...manual, ...automatic].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
}

export function latestChannelAttempts(channel: TvChannel, records: SourceAttempt[]): Map<string, SourceAttempt> {
  const latest = new Map<string, SourceAttempt>();
  for (const record of records) {
    if (record.country !== channel.country || record.channelId !== channel.id && !channel.previousIds?.includes(record.channelId)) continue;
    const previous = latest.get(record.streamUrl);
    if (!previous || (record.confirmedAt && !previous.confirmedAt) ||
      Boolean(record.confirmedAt) === Boolean(previous.confirmedAt) && Date.parse(record.startedAt) > Date.parse(previous.startedAt)) latest.set(record.streamUrl, record);
  }
  return latest;
}

export function sourceAttemptLabel(test: SourceAttempt | undefined): string {
  if (!test) return "Da testare";
  if (test.confirmedAt) return "Successo confermato manualmente";
  if (test.streamFormat === "embed") return "Player ufficiale · conferma manuale richiesta";
  if (test.automation) return {
    verified: "Successo · video verificato", failed: "Errore", inconclusive: "Da verificare",
    skipped: "Non testabile", interrupted: "Interrotto · da riprovare",
  }[test.automation.verdict];
  return { playing: "Avvio verificato manualmente", failed: "Errore", loading: "In caricamento", ready: "Manifest pronto · video da verificare", interrupted: "Interrotto · da riprovare" }[test.outcome];
}

export function channelTestStatus(channel: TvChannel, latest: Map<string, SourceAttempt>): ChannelTestStatus {
  // A completed manual review remains authoritative even after another test or catalog update.
  if ([...latest.values()].some(test => test.confirmedAt)) return "playing";
  const streams = channel.streams.filter(stream => !stream.restriction && stream.format !== "external");
  if (!streams.length) return "blocked";
  const tests = streams.map(stream => latest.get(stream.url));
  if (tests.some(test => test?.confirmedAt || (test?.automation ? test.automation.verdict === "verified" : test?.outcome === "playing"))) return "playing";
  if (tests.some(test => test?.streamFormat !== "embed" && (test?.outcome === "loading" || test?.outcome === "ready"))) return "loading";
  if (streams.some(stream => stream.format === "embed")) return "uncertain";
  if (tests.every(test => test?.automation ? test.automation.verdict === "failed" : test?.outcome === "failed")) return "failed";
  if (streams.some(stream => stream.needsVerification && !latest.has(stream.url))) return "uncertain";
  const finished = tests.map(test => test?.automation ? test.automation.complete : test?.outcome === "failed" || test?.outcome === "playing");
  if (finished.every(Boolean)) return tests.every(test => test?.automation?.verdict === "skipped") ? "blocked" : "uncertain";
  return finished.some(Boolean) ? "partial" : "idle";
}

const reportStatuses = ["running", "paused", "complete", "limited", "error"];
const verdicts = ["verified", "failed", "inconclusive", "skipped", "interrupted"];
const outcomes = ["loading", "ready", "playing", "failed", "interrupted"];
const issueCategories = ["access_denied", "unavailable", "http", "network_cors", "timeout", "manifest", "incompatible", "media", "drm", "unknown"];

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function validDate(value: unknown): value is string { return typeof value === "string" && Number.isFinite(Date.parse(value)); }
function resultKey(test: { channelId: string; country: string; streamUrl: string }) { return JSON.stringify([test.country, test.channelId, test.streamUrl]); }

// Project only the fields needed by the UI; event logs stay in the original JSON.
export function summarizeAutomaticReport(value: unknown, country: CountryCode): AutomaticReport {
  const report = object(value), run = object(report.run), config = object(run.config);
  if (report.version !== 1 || run.runnerVersion !== 1 || config.country !== country || !Array.isArray(report.tests) || !Array.isArray(run.queue) || !reportStatuses.includes(String(run.status)) || !validDate(report.exportedAt)) throw new Error("Report automatico non valido o di un altro Paese");
  const results: SourceAttempt[] = report.tests.map(raw => {
    const test = object(raw), automation = object(test.automation), error = object(test.lastError);
    if (typeof test.id !== "string" || typeof test.channelId !== "string" || test.country !== country || typeof test.streamUrl !== "string" || !validDate(test.startedAt) || !outcomes.includes(String(test.outcome)) || !verdicts.includes(String(automation.verdict)) || typeof automation.complete !== "boolean") throw new Error("Tentativo automatico non valido");
    return {
      id: test.id, channelId: test.channelId, country, streamUrl: test.streamUrl, startedAt: test.startedAt,
      endedAt: validDate(test.endedAt) ? test.endedAt : null, outcome: test.outcome as SourceAttempt["outcome"],
      streamFormat: ["hls", "dash", "embed", "external", "unknown"].includes(String(test.streamFormat)) ? test.streamFormat as PlaybackTest["streamFormat"] : undefined,
      lastError: issueCategories.includes(String(error.category)) && typeof error.message === "string" ? error as PlaybackIssue : null,
      automation: { verdict: automation.verdict as AutomaticVerdict, complete: automation.complete,
        reason: typeof automation.reason === "string" ? automation.reason : "" },
    };
  });
  const done = new Set(results.filter(test => test.automation?.complete).map(resultKey));
  const queued = new Set(run.queue.map(raw => {
    const item = object(raw);
    if (item.country !== country || typeof item.channelId !== "string" || typeof item.streamUrl !== "string") throw new Error("Coda del report non valida");
    return resultKey(item as { channelId: string; country: string; streamUrl: string });
  }));
  return { country, status: run.status as AutomaticReport["status"], exportedAt: report.exportedAt,
    testerLocation: typeof config.location === "string" ? config.location : "", total: queued.size,
    completed: [...queued].filter(key => done.has(key)).length, results };
}
