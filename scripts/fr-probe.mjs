// Real browser playback checks for French candidates, with the project's player (HLS/DASH).
// Reuses the shared worker without modifying it: the lab page still runs in IT mode, and its
// /api/channels response is replaced by the French candidates. Records are saved with country FR.
//
// node scripts/fr-probe.mjs --input reports/fr-candidates.json --output reports/streams-FR.json \
//   --location "ambiente locale, posizione non verificata" --base-url http://localhost:3123 --concurrency 2 --headless
//
// Resumable: completed URLs in the output are skipped. Embeds are skipped here (see fr-probe-embeds.mjs).
import { chromium } from "playwright-core";
import { readFile, writeFile, rename } from "node:fs/promises";
import { parseArgs } from "node:util";
import { randomUUID } from "node:crypto";
import { openWorker, testSource } from "./stream-test-worker.mjs";

const { values } = parseArgs({ options: {
  input: { type: "string" }, output: { type: "string" }, location: { type: "string" },
  "base-url": { type: "string", default: "http://localhost:3000" }, concurrency: { type: "string", default: "2" },
  startup: { type: "string", default: "25" }, observe: { type: "string", default: "20" },
  channel: { type: "string" }, headless: { type: "boolean", default: false },
} });
if (!values.input || !values.output || !values.location) throw new Error("--input, --output e --location richiesti.");
if (!/FR/.test(values.output)) throw new Error("Il report francese deve contenere FR nel nome.");
const options = { country: "IT", location: values.location, origin: new URL(values["base-url"]).origin,
  startup: Number(values.startup), observe: Number(values.observe), headless: values.headless };
const concurrency = Math.min(2, Math.max(1, Number(values.concurrency)));

const input = JSON.parse(await readFile(values.input, "utf8"));
const unknownGeography = { regions: [], scope: "unknown", basis: "unknown", sourceUrl: null };
const channels = input.channels.filter(channel => !values.channel || channel.id === values.channel).map(channel => {
  const streams = channel.streams.map(stream => ({ url: stream.url, title: channel.name, quality: null, label: null,
    requiresHeaders: false, sources: stream.sources ?? [{ id: "fr-official", name: `${channel.name} · sito ufficiale`, url: stream.page ?? stream.url }],
    format: stream.format, restriction: null, geography: unknownGeography }));
  // country IT only for the lab bridge; the saved records are rewritten to FR.
  return { id: channel.id, name: channel.name, country: "IT", categories: channel.categories ?? [], website: channel.website ?? null,
    stream: streams[0], streams, alternativeStreams: streams.length - 1, geography: unknownGeography };
}).filter(channel => channel.streams.length);

let report;
try { report = JSON.parse(await readFile(values.output, "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw error; }
const sourceKey = test => `${test.channelId}\n${test.streamUrl}`;
report ??= { version: 1, exportedAt: null, run: { id: randomUUID(), runnerVersion: 1, startedAt: new Date().toISOString(),
  config: { country: "FR", location: options.location, origin: options.origin, startup: options.startup, observe: options.observe,
    headless: options.headless, harness: "scripts/fr-probe.mjs (worker condiviso, catalogo intercettato)" }, sessions: [] }, tests: [] };
const queue = channels.flatMap(channel => channel.streams.map(stream => ({ channel, stream })));
report.run.queue = queue.map(item => ({ channelId: item.channel.id, channelName: item.channel.name, country: "FR", streamUrl: item.stream.url, format: item.stream.format }));
const done = new Set(report.tests.filter(test => test.automation?.complete).map(sourceKey));
const targets = queue.filter(item => item.stream.format !== "embed" && !done.has(sourceKey({ channelId: item.channel.id, streamUrl: item.stream.url })));
console.log(`${queue.length} fonti; ${targets.length} da provare; ${concurrency} worker.`);

let writing = Promise.resolve();
const save = () => (writing = writing.then(async () => {
  report.exportedAt = new Date().toISOString();
  report.run.counts = report.tests.reduce((counts, test) => ({ ...counts, [test.automation.verdict]: (counts[test.automation.verdict] ?? 0) + 1 }), {});
  await writeFile(`${values.output}.tmp`, JSON.stringify(report, null, 2));
  await rename(`${values.output}.tmp`, values.output);
}));

const catalog = { country: { code: "IT", name: "Italia", flag: "🇮🇹" }, catalogTotal: channels.length, withStream: channels.length,
  channels, fetchedAt: new Date().toISOString(), sources: [], geographyWarnings: [] };
const browser = await chromium.launch({ channel: "chrome", headless: options.headless, ignoreDefaultArgs: ["--autoplay-policy=no-user-gesture-required"] });
const session = { id: randomUUID(), startedAt: new Date().toISOString(), concurrency };
report.run.sessions.push(session);
let stopping = false;
process.on("SIGINT", () => { stopping = true; console.log("\nInterruzione: salvo…"); });
const hooks = { preparePage: page => page.route("**/api/channels?country=IT", route => route.fulfill({ json: catalog })) };
try {
  const workers = await Promise.all(Array.from({ length: Math.min(concurrency, targets.length) }, (_, i) => openWorker(browser, options, hooks, i + 1)));
  const environment = { ...options, userAgent: workers[0]?.payload.userAgent, timeZone: workers[0]?.payload.timeZone };
  let next = 0;
  const control = { isStopping: () => stopping, fail: error => { stopping = true; report.run.error = error.message; }, concurrency, sessionId: session.id };
  await Promise.all(workers.map(async worker => {
    while (!stopping && next < targets.length) {
      const item = targets[next++];
      console.log(`[W${worker.workerId} ${next}/${targets.length}] ${item.channel.name} · ${new URL(item.stream.url).hostname}`);
      const record = await testSource(worker, item, options, environment, control);
      record.country = "FR";
      report.tests = report.tests.filter(test => sourceKey(test) !== sourceKey(record) || test.automation?.complete);
      report.tests.push(record);
      await save();
      console.log(`  → ${record.automation.verdict}: ${record.automation.reason}`);
      await worker.page.evaluate(() => window.worldTvTester.discardRecords());
    }
  }));
  const completed = new Set(report.tests.filter(test => test.automation?.complete).map(sourceKey));
  report.run.pendingSources = queue.filter(item => !completed.has(sourceKey({
    channelId: item.channel.id, streamUrl: item.stream.url,
  }))).length;
  // Embeds are intentionally handled by the separate probe, but remain in the
  // inventory. Their absence must not turn a partial run into a complete one.
  report.run.status = report.run.error ? "error" : stopping ? "paused"
    : report.run.pendingSources === 0 ? "complete" : "limited";
} finally {
  session.endedAt = new Date().toISOString();
  await save();
  await browser.close().catch(() => {});
}
console.log(JSON.stringify(report.run.counts));
