// Diagnostic playback check for official iframe embeds (Dailymotion, Twitch, JW Player, Dacast…).
// Each embed is placed in a page served from the site origin (so Twitch parent= matches) and every
// <video> inside its frames is observed: success = media time advancing during the observation window.
// Input JSON: [{ "channelId", "name", "url" }]. No headers are altered and nothing is bypassed.
// Output uses the runner report format; name it reports/retest-<label>-IT.json to show it in the list.
import { chromium } from "playwright-core";
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { randomUUID } from "node:crypto";

const { values } = parseArgs({ options: {
  input: { type: "string" }, output: { type: "string" }, location: { type: "string", default: "Italia" }, "base-url": { type: "string", default: "http://localhost:3000" },
  startup: { type: "string", default: "25" }, observe: { type: "string", default: "25" }, headless: { type: "boolean", default: false },
} });
if (!values.input || !values.output) throw new Error("--input e --output richiesti.");
const embeds = JSON.parse(await readFile(values.input, "utf8"));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const browser = await chromium.launch({ channel: "chrome", headless: values.headless, args: ["--autoplay-policy=no-user-gesture-required"] });
const results = [];
const runStartedAt = new Date().toISOString();
// Same shape as scripts/test-streams.mjs reports, so /api/test-results can merge it.
const report = tests => ({ version: 1, exportedAt: new Date().toISOString(), run: { id: randomUUID(), runnerVersion: 1, startedAt: runStartedAt,
  status: tests.length === embeds.length ? "complete" : "running", config: { country: "IT", location: values.location, kind: "embed-probe", origin: values["base-url"] },
  queue: embeds.map(embed => ({ channelId: embed.channelId, channelName: embed.name, country: "IT", streamUrl: embed.url })) }, tests });

async function mediaTimes(page) {
  const times = [];
  for (const frame of page.frames()) {
    const found = await frame.evaluate(() => [...document.querySelectorAll("video")].map(video => {
      video.muted = true;
      if (video.paused) video.play().catch(() => {});
      return { time: video.currentTime, width: video.videoWidth, paused: video.paused };
    })).catch(() => []);
    times.push(...found.map(item => ({ ...item, frame: frame.url().slice(0, 120) })));
  }
  return times;
}

for (const embed of embeds) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const startedAt = new Date().toISOString();
  let verdict = "failed", reason = "", samples = [];
  try {
    const url = new URL(embed.url);
    if (url.hostname === "player.twitch.tv") url.searchParams.set("parent", new URL(values["base-url"]).hostname);
    await page.goto(`${values["base-url"]}/api/excluded-channels`, { waitUntil: "domcontentloaded" });
    await page.evaluate(src => {
      document.body.innerHTML = "";
      const frame = document.createElement("iframe");
      frame.src = src; frame.width = "960"; frame.height = "540";
      frame.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
      document.body.append(frame);
    }, url.href);
    const deadline = Date.now() + Number(values.startup) * 1000;
    let first = [];
    while (Date.now() < deadline) {
      first = (await mediaTimes(page)).filter(item => item.time > 0);
      if (first.length) break;
      // Some players need a click on their poster/play button to start.
      await page.mouse.click(480, 270).catch(() => {});
      await sleep(2000);
    }
    if (!first.length) reason = "Nessun video avviato entro il tempo di avvio.";
    else {
      await sleep(Number(values.observe) * 1000);
      const second = await mediaTimes(page);
      const advance = Math.max(0, ...second.map(item => item.time)) - Math.max(...first.map(item => item.time));
      samples = [first, second];
      if (advance >= Number(values.observe) * 0.6) verdict = "verified";
      else { verdict = "inconclusive"; reason = `Video avviato ma avanzato solo ${advance.toFixed(1)}s.`; }
      if (verdict === "verified") reason = `Video avanzato di ${advance.toFixed(1)}s in ${values.observe}s.`;
    }
  } catch (error) { reason = error.message; }
  results.push({ id: randomUUID(), channelId: embed.channelId, channelName: embed.name, country: "IT", streamUrl: embed.url,
    streamFormat: "embed", startedAt, endedAt: new Date().toISOString(), outcome: verdict === "verified" ? "playing" : "failed",
    lastError: null, player: "official-embed", automation: { verdict, complete: true, reason, samples } });
  console.log(`${verdict.padEnd(12)} ${embed.name} · ${reason}`);
  await writeFile(values.output, JSON.stringify(report(results), null, 2));
  await context.close();
}
await browser.close();
