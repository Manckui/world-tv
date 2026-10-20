import { parseArgs } from "node:util";

export function optionsFrom(argv) {
  const { values } = parseArgs({ args: argv, options: {
    country: { type: "string", default: "IT" }, location: { type: "string" },
    "base-url": { type: "string", default: "http://localhost:3000" },
    output: { type: "string" }, limit: { type: "string" }, channel: { type: "string" },
    startup: { type: "string", default: "20" }, observe: { type: "string", default: "20" },
    concurrency: { type: "string", default: "3" },
    recheck: { type: "string" }, "manual-results": { type: "string" },
    headless: { type: "boolean", default: false }, fresh: { type: "boolean", default: false },
    help: { type: "boolean", short: "h" },
  } });
  if (values.help) return { help: true };
  const country = values.country.toUpperCase();
  if (!["IT", "ES", "FR"].includes(country)) throw new Error("Paesi supportati: IT, ES, FR.");
  if (values.recheck !== undefined && values.recheck !== "uncertain") throw new Error("--recheck accetta solo uncertain (Da verificare).");
  if (values["manual-results"] && !values.recheck) throw new Error("--manual-results richiede --recheck uncertain.");
  if (!values.location?.trim()) throw new Error('Indica dove esegui il test: --location "Italia". Non è il Paese del canale.');
  const url = new URL(values["base-url"]);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("--base-url deve essere l'origine del sito, es. http://localhost:3000.");
  function seconds(key) {
    const number = Number(values[key]);
    if (!Number.isFinite(number) || number < 1 || number > 300) throw new Error(`--${key}: secondi compresi tra 1 e 300.`);
    return number;
  }
  const limit = values.limit === undefined ? Infinity : Number(values.limit);
  const concurrency = Number(values.concurrency);
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new Error("--concurrency deve essere un intero tra 1 e 4.");
  if (!(limit > 0) || limit !== Infinity && !Number.isSafeInteger(limit) || values.limit !== undefined && !Number.isFinite(limit)) throw new Error("--limit deve essere un intero positivo (numero di fonti, non di canali).");
  return { country, location: values.location.trim(), origin: url.origin, output: values.output,
    channel: values.channel ?? null, startup: seconds("startup"), observe: seconds("observe"),
    limit, concurrency, headless: values.headless, fresh: values.fresh,
    recheck: values.recheck ?? null, manualResults: values["manual-results"] ?? null };
}

// Manual confirmations remain authoritative; other attempts are compared per URL by date.
export function needsRecheck(channel, records) {
  const streams = channel.streams.filter(stream => !stream.restriction && stream.format !== "external");
  if (!streams.length) return false;
  const latest = new Map();
  for (const record of records) {
    if (record.country !== channel.country || record.channelId !== channel.id && !channel.previousIds?.includes(record.channelId)) continue;
    if (record.confirmedAt) return false;
    const previous = latest.get(record.streamUrl);
    if (!previous || Date.parse(record.startedAt) > Date.parse(previous.startedAt)) latest.set(record.streamUrl, record);
  }
  const tests = streams.map(stream => latest.get(stream.url));
  if (tests.some(test => test?.confirmedAt || (test?.automation ? test.automation.verdict === "verified" : test?.outcome === "playing"))) return false;
  if (tests.some(test => test?.streamFormat !== "embed" && ["loading", "ready"].includes(test?.outcome))) return false;
  if (streams.some(stream => stream.format === "embed")) return true;
  if (tests.every(test => test?.automation ? test.automation.verdict === "failed" : test?.outcome === "failed")) return false;
  if (streams.some(stream => stream.needsVerification && !latest.has(stream.url))) return true;
  return tests.every(test => test?.automation ? test.automation.complete : ["failed", "playing"].includes(test?.outcome))
    && !tests.every(test => test?.automation?.verdict === "skipped");
}

export function validateInputTests(report, country, automatic = false) {
  if (report?.version !== 1 || !Array.isArray(report.tests) || automatic && (report.run?.runnerVersion !== 1 || report.run.config?.country !== country)) throw new Error("Report di partenza non valido.");
  for (const test of report.tests) {
    if (!test || !["IT", "ES", "FR", "VN", "JP", "CL", "US", "ZA"].includes(test.country) || automatic && test.country !== country || typeof test.channelId !== "string" || typeof test.streamUrl !== "string" || typeof test.startedAt !== "string" || !Number.isFinite(Date.parse(test.startedAt))
      || !["loading", "ready", "playing", "failed", "interrupted"].includes(test.outcome)
      || automatic && (!test.automation || typeof test.automation.complete !== "boolean" || !["verified", "failed", "inconclusive", "skipped", "interrupted"].includes(test.automation.verdict))) throw new Error("Tentativo non valido nel report di partenza.");
  }
  return report.tests.filter(test => test.country === country);
}

export const sourceKey = (test) => JSON.stringify([test.country, test.channelId, test.streamUrl]);
export const isCompleted = (test) => test.automation?.complete === true;

export function assertResume(report, config) {
  if (report.version !== 1 || report.run?.runnerVersion !== 1 || !Array.isArray(report.tests)) throw new Error("Il file non è un report automatico compatibile. Usa --output con un altro nome; il JSON manuale non viene sovrascritto.");
  if (JSON.stringify(report.run.config) !== JSON.stringify(config)) throw new Error("Il report usa luogo/browser/origine/tempi o filtro diversi. Usa --output con un altro nome oppure --fresh.");
}

export class PlaybackObservation {
  constructor(seconds) {
    this.duration = seconds * 1000;
    this.startedAt = null;
    this.previous = null;
    this.lastProgressAt = null;
    this.advance = 0;
    this.frames = 0;
    this.samples = 0;
    this.maxGapMs = 0;
  }
  add(sample, playing) {
    if (!sample) return;
    this.samples++;
    const previous = this.previous;
    this.previous = sample;
    if (!playing || !previous || sample.paused || sample.width <= 0 || sample.readyState < 2) return;
    const elapsed = sample.at - previous.at;
    const delta = sample.currentTime - previous.currentTime;
    const frames = sample.frames !== null && previous.frames !== null ? sample.frames - previous.frames : 0;
    // A seek or jump to the live edge is not evidence of decoded playback.
    if (elapsed <= 0 || delta <= 0.01 || delta > elapsed / 1000 * 3 + 1 || frames <= 0) return;
    if (this.startedAt === null) this.startedAt = previous.at;
    const gap = this.lastProgressAt === null ? elapsed : sample.at - this.lastProgressAt;
    this.maxGapMs = Math.max(this.maxGapMs, gap);
    this.lastProgressAt = sample.at;
    this.advance += delta;
    this.frames += frames;
  }
  finished(at) { return this.startedAt !== null && at - this.startedAt >= this.duration; }
  verified(at) {
    return this.finished(at) && this.advance >= this.duration / 1000 * 0.65 && this.frames > 0 &&
      at - this.lastProgressAt <= Math.min(5000, this.duration / 2) && this.maxGapMs <= 5000;
  }
  evidence(at) {
    return { observationSeconds: this.startedAt === null ? 0 : (at - this.startedAt) / 1000,
      advancedSeconds: this.advance, decodedFrames: this.frames, samples: this.samples,
      maxGapSeconds: this.maxGapMs / 1000,
      secondsSinceProgress: this.lastProgressAt === null ? null : (at - this.lastProgressAt) / 1000 };
  }
}

function cell(value) {
  let text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function reportCsv(tests) {
  const columns = ["channelName", "channelId", "country", "streamUrl", "sources", "startedAt", "endedAt", "testerLocation", "player", "outcome", "verdict", "reason", "startupSeconds", "observationSeconds", "advancedSeconds", "decodedFrames", "category", "httpStatus", "errorDetails", "errorMessage", "network", "browserConsole", "concurrency", "worker", "sessionId"];
  return "\uFEFF" + [columns, ...tests.map(test => [test.channelName, test.channelId, test.country, test.streamUrl, test.sources,
    test.startedAt, test.endedAt, test.testerLocation, test.player, test.outcome, test.automation?.verdict,
    test.automation?.reason, test.automation?.startupSeconds, test.automation?.evidence?.observationSeconds,
    test.automation?.evidence?.advancedSeconds, test.automation?.evidence?.decodedFrames,
    test.lastError?.category, test.lastError?.httpStatus, test.lastError?.details, test.lastError?.rawMessage,
    test.automation?.network, test.automation?.browserConsole, test.automation?.concurrency, test.automation?.worker, test.automation?.sessionId])].map(row => row.map(cell).join(",")).join("\r\n");
}
