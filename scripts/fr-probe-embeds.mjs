// French embed check (adapted from scripts/probe-embeds.mjs, which stays untouched).
// Each official iframe (Dailymotion, JW Player, Vimeo…) is placed in a page served from the site origin and
// every <video> inside its frames is observed. "verified" requires, on the same video: valid dimensions,
// decoded frames increasing, and media time advancing by ≥ 60% of the observation window (default 20 s).
// Input JSON: [{ "channelId", "name", "url" }]. No headers are altered and nothing is bypassed.
import { chromium } from "playwright-core";
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { randomUUID } from "node:crypto";

const { values } = parseArgs({ options: {
  input: { type: "string" }, output: { type: "string" }, location: { type: "string" },
  "base-url": { type: "string", default: "http://localhost:3000" },
  startup: { type: "string", default: "25" }, observe: { type: "string", default: "20" }, headless: { type: "boolean", default: false },
} });
if (!values.input || !values.output || !values.location) throw new Error("--input, --output e --location richiesti.");
if (!/FR/.test(values.output)) throw new Error("Il report francese deve contenere FR nel nome.");
const embeds = JSON.parse(await readFile(values.input, "utf8"));
const observe = Number(values.observe);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const browser = await chromium.launch({ channel: "chrome", headless: values.headless, args: ["--autoplay-policy=no-user-gesture-required"] });
const results = [];
const runStartedAt = new Date().toISOString();
const report = tests => ({ version: 1, exportedAt: new Date().toISOString(), run: { id: randomUUID(), runnerVersion: 1, startedAt: runStartedAt,
  status: tests.length === embeds.length ? "complete" : "running",
  config: { country: "FR", location: values.location, kind: "embed-probe", criteria: "same-video-series", origin: values["base-url"], observe, harness: "scripts/fr-probe-embeds.mjs" },
  queue: embeds.map(embed => ({ channelId: embed.channelId, channelName: embed.name, country: "FR", streamUrl: embed.url })) }, tests });

async function videos(page) {
  const found = [];
  for (const [index, frame] of page.frames().entries()) {
    const items = await frame.evaluate(() => [...document.querySelectorAll("video")].map((video, i) => {
      video.muted = true;
      if (video.paused) video.play().catch(() => {});
      return { i, time: video.currentTime, width: video.videoWidth, height: video.videoHeight,
        frames: video.getVideoPlaybackQuality?.().totalVideoFrames ?? null, paused: video.paused };
    })).catch(() => []);
    found.push(...items.map(item => ({ ...item, key: `${index}:${item.i}`, frame: frame.url().slice(0, 120) })));
  }
  return found;
}

for (const embed of embeds) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const startedAt = new Date().toISOString();
  let verdict = "failed", reason = "", samples = [];
  try {
    await page.goto(`${values["base-url"]}/api/excluded-channels`, { waitUntil: "domcontentloaded" });
    await page.evaluate(src => {
      document.body.innerHTML = "";
      const frame = document.createElement("iframe");
      frame.src = src; frame.width = "960"; frame.height = "540";
      frame.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
      document.body.append(frame);
    }, (() => {
      // Twitch embeds only play when parent= matches the embedding host (the player does the same).
      const url = new URL(embed.url);
      if (url.hostname === "player.twitch.tv") url.searchParams.set("parent", new URL(values["base-url"]).hostname);
      return url.href;
    })());
    const deadline = Date.now() + Number(values.startup) * 1000;
    let first = [];
    while (Date.now() < deadline) {
      first = (await videos(page)).filter(item => item.time > 0 && item.width > 0);
      if (first.length) break;
      await page.mouse.click(480, 270).catch(() => {}); // some players start only after a click on the poster
      await sleep(2000);
    }
    if (!first.length) { verdict = "inconclusive"; reason = "Nessun video con dimensioni valide avviato entro il tempo di avvio."; }
    else {
      // Follow the same <video> (same frame URL and index) every 2 s for the whole window.
      // verified = decoded frames measured and increasing, valid size at every sample, media time
      // advancing ≥ 60% of the window and never stalled for more than 5 s. Ads or navigation that
      // replace the element break the series and give "inconclusive".
      const key = first.sort((a, b) => b.time - a.time)[0].key;
      const series = [first.find(item => item.key === key)];
      const end = Date.now() + observe * 1000;
      while (Date.now() < end) {
        await sleep(2000);
        series.push((await videos(page)).find(item => item.key === key) ?? null);
      }
      samples = series;
      const a = series[0], b = series.at(-1);
      let stall = 0, longestStall = 0;
      for (let i = 1; i < series.length; i++) {
        stall = series[i] && series[i - 1] && series[i].time > series[i - 1].time ? 0 : stall + 2;
        longestStall = Math.max(longestStall, stall);
      }
      const complete = series.every(item => item && item.width > 0);
      const frames = complete && a.frames != null && b.frames != null ? b.frames - a.frames : null;
      const advance = complete ? b.time - a.time : 0;
      if (complete && frames !== null && frames > 0 && advance >= observe * .6 && longestStall <= 5) {
        verdict = "verified";
        reason = `Stesso video ${b.width}×${b.height} seguito per ${observe} s: avanzato di ${advance.toFixed(1)} s, fotogrammi decodificati +${frames}, pausa massima ${longestStall} s.`;
      } else {
        verdict = "inconclusive";
        reason = !complete ? "Il video osservato è scomparso o ha perso le dimensioni durante la finestra (pubblicità o navigazione)."
          : frames === null ? "Fotogrammi decodificati non misurabili: risultato non accettato come verificato."
          : `Avanzamento insufficiente (${advance.toFixed(1)} s, fotogrammi +${frames}, pausa massima ${longestStall} s).`;
      }
    }
  } catch (error) { reason = error.message; }
  results.push({ id: randomUUID(), channelId: embed.channelId, channelName: embed.name, country: "FR", streamUrl: embed.url,
    streamFormat: "embed", startedAt, endedAt: new Date().toISOString(), outcome: verdict === "verified" ? "playing" : "failed",
    lastError: null, player: "official-embed", testerLocation: values.location, automation: { verdict, complete: true, reason, samples } });
  console.log(`${verdict.padEnd(12)} ${embed.name} · ${reason}`);
  await writeFile(values.output, JSON.stringify(report(results), null, 2));
  await context.close();
}
await browser.close();
