// Controlled browser fixtures, not evidence that real TV channels are available.
// Requires installed Google Chrome and ffmpeg to generate a small HLS video.
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { optionsFrom } from "./stream-test-utils.mjs";
import { run } from "./test-streams.mjs";

const folder = await mkdtemp(path.join(tmpdir(), "world-tv-runner-fixtures-"));
await promisify(execFile)("ffmpeg", ["-loglevel", "error", "-f", "lavfi", "-i", "testsrc=size=160x90:rate=10", "-t", "12", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-g", "20", "-hls_time", "2", "-hls_list_size", "0", "-hls_segment_filename", path.join(folder, "segment%d.ts"), path.join(folder, "live.m3u8")]);
const files = new Map(await Promise.all((await readdir(folder)).map(async name => [name, await readFile(path.join(folder, name))])));
const geography = { regions: [], scope: "unknown", basis: "unknown", sourceUrl: null };
const source = { id: "fixture", name: "Simulated fixture", url: "https://world-tv-fixtures.invalid/list" };
const stream = (name, restriction = null) => ({ url: `https://world-tv-fixtures.invalid/${name}`, title: null, quality: null, label: null, requiresHeaders: false, sources: [source], format: "hls", restriction, geography });
const channel = (id, streams) => ({ id, name: `Fixture ${id}`, country: "IT", categories: [], website: null, stream: streams[0], streams, alternativeStreams: streams.length - 1, geography });
const channels = [channel("403", [stream("403.m3u8")]), channel("404", [stream("404.m3u8")]),
  channel("manifest", [stream("invalid.m3u8")]), channel("network", [stream("network.m3u8")]),
  channel("restricted", [stream("restricted.m3u8", "Richiede simulazione di altro player")]),
  channel("alternatives", [stream("live.m3u8"), stream("403-alternative.m3u8")])];
let restrictedRequests = 0, streamRequests = 0;
const pageErrors = [];
const hooks = { preparePage: async page => {
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.route("**/api/channels?*", route => route.fulfill({ json: { country: { code: "IT", name: "Italia", flag: "🇮🇹" }, catalogTotal: channels.length, withStream: channels.length, channels, sources: [{ ...source, status: "loaded", entries: 7, error: null }], geographyWarnings: [], fetchedAt: new Date().toISOString() } }));
  await page.route("https://world-tv-fixtures.invalid/**", route => {
    streamRequests++;
    const name = new URL(route.request().url()).pathname.slice(1);
    if (name.startsWith("restricted")) { restrictedRequests++; return route.abort(); }
    if (name.startsWith("network")) return route.abort("failed");
    const status = name.startsWith("403") ? 403 : name.startsWith("404") ? 404 : 200;
    return route.fulfill({ status, headers: { "access-control-allow-origin": "*", "content-type": name.endsWith(".ts") ? "video/mp2t" : "application/vnd.apple.mpegurl" }, body: files.get(name) ?? (/^live-\d\.m3u8$/.test(name) ? files.get("live.m3u8") : Buffer.from("Invalid HLS manifest")) });
  });
} };
const options = optionsFrom(["--country", "IT", "--location", "Italia (fixture simulate)", "--startup", "4", "--observe", "3", "--concurrency", "1", "--limit", "3", "--headless", "--output", path.join(folder, "report.json")]);
const sequential = await run(options, hooks);
assert.equal(sequential.tests.length, 3);
assert.equal(sequential.run.status, "limited");
// Simulate the pre-parallel report format: no sessions or concurrency metadata.
const legacy = JSON.parse(await readFile(options.output, "utf8"));
delete legacy.run.sessions; delete legacy.run.concurrency;
for (const attempt of legacy.tests) {
  delete attempt.automation.worker; delete attempt.automation.concurrency; delete attempt.automation.sessionId;
}
await writeFile(options.output, JSON.stringify(legacy));
options.limit = Infinity; options.concurrency = 3;
const report = await run(options, hooks);
assert.deepEqual(report.tests.slice(0, 3), legacy.tests, "Legacy sequential results must be preserved unchanged when resuming in parallel");
assert.equal(report.tests.length, 7, "Each URL is tested exactly once, with no automatic fallback duplicates");
assert.equal(report.tests.find(test => test.channelId === "403").lastError.category, "access_denied");
assert.equal(report.tests.find(test => test.channelId === "404").lastError.category, "unavailable");
assert.equal(report.tests.find(test => test.channelId === "manifest").lastError.category, "manifest");
assert.equal(report.tests.find(test => test.channelId === "restricted").automation.verdict, "skipped");
assert.equal(restrictedRequests, 0);
assert.ok(report.tests.find(test => test.channelId === "network").automation.network.some(event => event.kind === "requestfailed"));
const played = report.tests.find(test => test.streamUrl.endsWith("/live.m3u8"));
assert.equal(played.automation.verdict, "verified");
assert.ok(played.automation.evidence.decodedFrames > 0);
assert.ok(played.automation.evidence.advancedSeconds >= 2);
assert.equal(played.testerLocation, options.location);
assert.deepEqual(pageErrors, []);
const count = streamRequests;
const resumed = await run(options, hooks);
assert.equal(resumed.tests.length, 7);
assert.equal(streamRequests, count, "Resume must make no new stream requests for completed attempts");
assert.ok((await readFile(path.join(folder, "report.csv"), "utf8")).includes('"verified"'));
// Targeted rechecks preserve the baseline and exclude exported manual successes/deletions.
const baselineForRecheck = JSON.parse(JSON.stringify(report));
const inconclusive = { ...played, outcome: "interrupted", automation: { ...played.automation, verdict: "inconclusive" } };
baselineForRecheck.tests = baselineForRecheck.tests.map(test => test.id === played.id ? inconclusive : test);
baselineForRecheck.tests.push({ ...inconclusive, channelId: "confirmed-fixture" }, { ...inconclusive, channelId: "hidden-fixture" });
const baselineReport = path.join(folder, "baseline-for-recheck.json");
await writeFile(baselineReport, JSON.stringify(baselineForRecheck));
const manualResults = path.join(folder, "manual-for-recheck.json");
await writeFile(manualResults, JSON.stringify({ version: 1, tests: [{ ...played, channelId: "confirmed-fixture", startedAt: new Date(Date.now() + 1000).toISOString(), automation: undefined }], excludedChannelIds: ["hidden-fixture"] }));
const recheckHooks = { baselineReport, preparePage: async page => {
  await hooks.preparePage(page);
  const recheckChannels = [channels.find(channel => channel.id === "alternatives"), channel("confirmed-fixture", [stream("live.m3u8")]), channel("hidden-fixture", [stream("live.m3u8")])];
  await page.route("**/api/channels?*", route => route.fulfill({ json: { country: { code: "IT", name: "Italia", flag: "🇮🇹" }, channels: recheckChannels, sources: [], geographyWarnings: [], fetchedAt: new Date().toISOString() } }));
} };
const recheckOptions = { ...options, recheck: "uncertain", manualResults, output: path.join(folder, "recheck.json") };
const rechecked = await run(recheckOptions, recheckHooks);
assert.equal(rechecked.tests.length, 2);
assert.ok(rechecked.tests.every(test => test.channelId === "alternatives"));
assert.equal(rechecked.tests.find(test => test.streamUrl.endsWith("live.m3u8")).automation.verdict, "verified");
assert.deepEqual(JSON.parse(await readFile(baselineReport, "utf8")), baselineForRecheck);
const requestsBeforeResume = streamRequests;
const recheckResumed = await run(recheckOptions, recheckHooks);
assert.equal(recheckResumed.tests.length, 2);
assert.equal(recheckResumed.run.queue.length, 2);
assert.equal(streamRequests, requestsBeforeResume);
const interruptionOptions = { ...options, concurrency: 1, channel: "alternatives", output: path.join(folder, "interrupted.json"), observe: 20 };
const interrupted = await run(interruptionOptions, { preparePage: async page => {
  await hooks.preparePage(page);
  let signalled = false;
  page.on("request", request => {
    if (!signalled && request.url().endsWith("/live.m3u8")) {
      signalled = true;
      setTimeout(() => process.emit("SIGINT"), 100);
    }
  });
} });
assert.equal(interrupted.run.status, "paused");
assert.equal(interrupted.tests.length, 1);
assert.equal(interrupted.tests[0].automation.verdict, "interrupted");
assert.equal(interrupted.tests[0].automation.complete, false);
assert.ok(interrupted.tests[0].endedAt);
assert.equal(JSON.parse(await readFile(interruptionOptions.output, "utf8")).tests[0].automation.complete, false);
const parallelChannels = [1, 2, 3, 4].map(id => channel(`parallel-${id}`, [stream(`live-${id}.m3u8`)]));
const parallelHooks = { preparePage: async page => {
  await hooks.preparePage(page);
  await page.route("**/api/channels?*", route => route.fulfill({ json: { country: { code: "IT", name: "Italia", flag: "🇮🇹" }, catalogTotal: 4, withStream: 4, channels: parallelChannels, sources: [{ ...source, status: "loaded", entries: 4, error: null }], geographyWarnings: [], fetchedAt: new Date().toISOString() } }));
} };
const parallelOptions = { ...options, limit: 3, output: path.join(folder, "parallel.json") };
const parallel = await run(parallelOptions, parallelHooks);
assert.equal(parallel.tests.length, 3);
assert.equal(parallel.run.status, "limited");
assert.ok(parallel.tests.every(attempt => attempt.automation.verdict === "verified" && attempt.automation.concurrency === 3));
assert.deepEqual(new Set(parallel.tests.map(attempt => attempt.automation.worker)), new Set([1, 2, 3]));
for (const attempt of parallel.tests) {
  assert.ok(attempt.automation.network.some(event => event.url === attempt.streamUrl && event.status === 200));
  assert.ok(attempt.automation.network.every(event => !/\/live-\d\.m3u8$/.test(event.url) || event.url === attempt.streamUrl), "Manifest diagnostics must stay with their own worker");
}
assert.ok(Math.max(...parallel.tests.map(attempt => Date.parse(attempt.startedAt))) < Math.min(...parallel.tests.map(attempt => Date.parse(attempt.endedAt))), "All three decoding tests must overlap");
const stoppedWorkers = new Set();
const parallelStopOptions = { ...parallelOptions, observe: 20, output: path.join(folder, "parallel-interrupted.json") };
const parallelInterrupted = await run(parallelStopOptions, { preparePage: async (page, workerId) => {
  await parallelHooks.preparePage(page);
  page.on("request", request => {
    if (/\/live-\d\.m3u8$/.test(request.url()) && !stoppedWorkers.has(workerId)) {
      stoppedWorkers.add(workerId);
      if (stoppedWorkers.size === 3) setTimeout(() => process.emit("SIGINT"), 100);
    }
  });
} });
assert.equal(parallelInterrupted.run.status, "paused");
assert.equal(parallelInterrupted.tests.length, 3);
assert.ok(parallelInterrupted.tests.every(attempt => attempt.automation.verdict === "interrupted" && !attempt.automation.complete && attempt.endedAt));
assert.deepEqual(JSON.parse(await readFile(parallelStopOptions.output, "utf8")).tests, parallelInterrupted.tests);
assert.ok(!(await readdir(folder)).some(name => name.endsWith(".lock")));
console.log(`PASS browser fixtures, three overlapping HLS decoding tests, legacy resume, isolated diagnostics, serialized JSON/CSV and Ctrl+C saving all workers. These are not real TV results. Fixtures/report: ${folder}`);
