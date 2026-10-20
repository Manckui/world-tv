import test from "node:test";
import assert from "node:assert/strict";
import { optionsFrom, sourceKey, isCompleted, assertResume, PlaybackObservation, reportCsv, needsRecheck, validateInputTests } from "./stream-test-utils.mjs";
import { testSource } from "./stream-test-worker.mjs";
const sample = (at, currentTime, frames) => ({ at, currentTime, frames, width: 160, paused: false, readyState: 4 });

test("decoded frames and advancing video are required", () => {
  const observed = new PlaybackObservation(2);
  for (let at = 0; at <= 3000; at += 500) observed.add(sample(at, at / 1000, at / 100), true);
  assert.equal(observed.verified(3000), true);
  for (const frameCount of [0, null]) {
    const frozen = new PlaybackObservation(2);
    for (let at = 0; at <= 3000; at += 500) frozen.add(sample(at, frameCount === 0 ? 0 : at / 1000, frameCount), true);
    assert.equal(frozen.verified(3000), false);
  }
});
test("seek jumps and stalled playback are not verified", () => {
  const jump = new PlaybackObservation(2);
  jump.add(sample(0, 0, 0), true); jump.add(sample(500, 100, 5), true);
  assert.equal(jump.advance, 0);
  const stalled = new PlaybackObservation(10);
  for (let at = 0; at <= 10_000; at += 500) stalled.add(sample(at, Math.min(at / 1000, 2), Math.min(at / 100, 20)), true);
  assert.equal(stalled.finished(10_000), true);
  assert.equal(stalled.verified(10_000), false);
});
test("resume requires a compatible environment and finished automatic attempts", () => {
  const config = { country: "IT", location: "Italia", observe: 20 };
  const report = { version: 1, run: { runnerVersion: 1, config }, tests: [] };
  assertResume(report, config);
  assert.throws(() => assertResume(report, { ...config, location: "Germania" }));
  assert.throws(() => assertResume({ version: 1, tests: [] }, config));
  assert.equal(isCompleted({ outcome: "playing" }), false);
  assert.equal(isCompleted({ automation: { complete: false } }), false);
  assert.equal(isCompleted({ automation: { complete: true } }), true);
  assert.notEqual(sourceKey({ country: "IT", channelId: "a", streamUrl: "https://cdn/a" }), sourceKey({ country: "IT", channelId: "a", streamUrl: "https://cdn/b" }));
});
test("CLI validates location, country, times, limits and origin", () => {
  assert.equal(optionsFrom(["--help"]).help, true);
  assert.throws(() => optionsFrom([]));
  for (const extra of [["--country", "DE"], ["--observe", "0"], ["--limit", "-1"], ["--limit", "Infinity"], ["--concurrency", "0"], ["--concurrency", "5"], ["--concurrency", "1.5"], ["--base-url", "http://user:secret@localhost:3000"]]) assert.throws(() => optionsFrom(["--location", "Italia", ...extra]));
  assert.equal(optionsFrom(["--location", "Italia", "--limit", "5"]).limit, 5);
  assert.equal(optionsFrom(["--location", "Italia"]).concurrency, 3);
  assert.equal(optionsFrom(["--location", "Italia", "--concurrency", "1"]).concurrency, 1);
});
test("CSV includes verdict and protects spreadsheet cells", () => {
  const csv = reportCsv([{ channelName: "=formula", automation: { verdict: "verified", evidence: { advancedSeconds: 20, decodedFrames: 100 } } }]);
  assert.ok(csv.includes('"verdict"') && csv.includes('"verified"') && csv.includes("'=formula"));
});

test("recheck selects uncertain channels while honoring the latest manual result", () => {
  const channel = { id: "Example.it", country: "IT", streams: [{ url: "https://example.com/a.m3u8", format: "hls", restriction: null }] };
  const record = { channelId: channel.id, country: "IT", streamUrl: channel.streams[0].url, startedAt: "2026-09-16T12:00:00Z", outcome: "interrupted", automation: { complete: true, verdict: "inconclusive" } };
  assert.equal(needsRecheck(channel, [record]), true);
  for (const verdict of ["verified", "failed", "skipped"]) assert.equal(needsRecheck(channel, [{ ...record, automation: { complete: true, verdict } }]), false);
  assert.equal(needsRecheck(channel, []), false);
  assert.equal(needsRecheck({ ...channel, streams: [{ ...channel.streams[0], needsVerification: true }] }, []), true);
  const manual = { ...record, automation: undefined, startedAt: "2026-09-17T12:00:00Z", outcome: "playing", confirmedAt: "2026-09-17T12:01:00Z" };
  assert.equal(needsRecheck(channel, [record, manual]), false);
  assert.equal(needsRecheck(channel, [record, { ...manual, outcome: "failed" }]), false);
  assert.equal(needsRecheck(channel, [manual, { ...record, startedAt: "2026-09-17T13:00:00Z" }]), false);
  assert.equal(needsRecheck({ ...channel, previousIds: ["old-id"] }, [{ ...manual, channelId: "old-id" }]), false);
  assert.equal(needsRecheck({ ...channel, streams: [{ url: "https://example.com/new", format: "hls" }] }, [manual]), false);
  assert.equal(needsRecheck(channel, [{ ...record, outcome: "loading", automation: undefined }]), false);
  assert.equal(optionsFrom(["--location", "Italia", "--recheck", "uncertain"]).recheck, "uncertain");
  assert.throws(() => optionsFrom(["--location", "Italia", "--recheck", "all"]));
  assert.throws(() => optionsFrom(["--location", "Italia", "--manual-results", "file.json"]));
  assert.equal(validateInputTests({ version: 1, tests: [manual, { ...manual, country: "VN" }] }, "IT").length, 1);
  assert.throws(() => validateInputTests({ version: 1, tests: [{ ...manual, startedAt: "bad date" }] }, "IT"));
});

test("slow browser setup receives a full observation window after decoded progress", async () => {
  let wallTime = 0, videoAt = 0, calls = 0;
  const record = { id: "fixture", channelId: "fixture", country: "IT", outcome: "playing", events: [], omittedEvents: 0, endedAt: null };
  const bridge = {
    select: () => {},
    stop: () => { record.endedAt = new Date().toISOString(); },
    sample: () => {
      calls++;
      if (calls === 2) wallTime += 40_000;
      videoAt += 500;
      return { record, video: sample(videoAt, videoAt / 1000, videoAt / 100) };
    },
  };
  const page = {
    evaluate: async (callback, arg) => {
      const previousWindow = globalThis.window;
      globalThis.window = { worldTvTester: bridge };
      try { return callback(arg); }
      finally {
        if (previousWindow === undefined) delete globalThis.window;
        else globalThis.window = previousWindow;
      }
    },
    waitForFunction: async () => {},
  };
  const result = await testSource({ page, workerId: 1, setActive: () => {} }, { channel: { id: "fixture" }, stream: { format: "hls", restriction: null } }, { startup: 20, observe: 10 }, {}, {
    now: () => wallTime, sleep: async ms => { wallTime += ms; }, isStopping: () => false, fail: error => { throw error; },
  });
  assert.equal(result.automation.verdict, "verified");
  assert.ok(result.automation.evidence.observationSeconds >= 10);
  assert.ok(result.automation.startupSeconds > 20);
});

test("official embeds require manual review and make no automatic stream requests", async () => {
  const channel = { id: "Videolina.it", country: "IT", streams: [{ url: "https://geo.dailymotion.com/player/example.html", format: "embed" }] };
  const skipped = { channelId: channel.id, country: "IT", streamUrl: channel.streams[0].url, streamFormat: "embed", startedAt: "2026-09-17T12:00:00Z", outcome: "interrupted", automation: { complete: true, verdict: "skipped" } };
  assert.equal(needsRecheck(channel, [skipped]), true);
  assert.equal(needsRecheck(channel, [{ ...skipped, automation: undefined, outcome: "ready" }]), true);
  assert.equal(needsRecheck(channel, [{ ...skipped, confirmedAt: "2026-09-17T12:01:00Z" }]), false);
  const result = await testSource({ setActive: () => {}, page: { evaluate: () => { throw new Error("Embed must not be requested by the automatic runner"); } } }, { channel, stream: channel.streams[0] }, { observe: 20, startup: 20 }, { location: "Italia", userAgent: "fixture", timeZone: "Europe/Rome" }, { concurrency: 1 });
  assert.equal(result.automation.verdict, "skipped");
  assert.equal(result.streamFormat, "embed");
  assert.equal(result.automation.evidence.decodedFrames, 0);
});
