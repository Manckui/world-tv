// Observe only the public page's normal requests, without changing headers,
// certificates, cookies, geography or authentication. Raw evidence stays in /tmp.
import { chromium } from "playwright-core";
import { writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const url of process.argv.slice(2)) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const requests = [];
    const responses = [];
    const tasks = [];
    page.on("request", request => {
      if (/m3u8|\.mpd|media\.jsp|mediastream|mdstrm|\/player\/|\/config/i.test(request.url())) requests.push(request.url());
    });
    page.on("response", response => {
      if (/m3u8|\.mpd|media\.jsp|mdstrm.*(?:live-stream|config)/i.test(response.url())) {
        tasks.push((async () => {
          let body = "";
          try { body = (await response.text()).slice(0, 100_000); } catch { /* Redirects and aborted media have no body. */ }
          responses.push({ url: response.url(), status: response.status(), body });
        })());
      }
    });
    let error = "";
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25_000 });
      const reject = page.getByRole("button", { name: /^(Rebutja|Rechazar|Reject all)/i }).first();
      if (await reject.isVisible()) await reject.click();
      const play = page.getByRole("button", { name: /^(Reprodueix|Reproducir|Reproduir|Play)( el v[ií]deo)?$/i }).first();
      if (await play.isVisible()) await play.click();
      await page.waitForTimeout(12_000);
    } catch (caught) { error = caught.message; }
    const text = await page.locator("body").innerText().catch(() => "");
    const frames = page.frames().map(frame => frame.url());
    const videos = await page.locator("video").evaluateAll(videos => videos.map(video => ({
      src: video.currentSrc, width: video.videoWidth, height: video.videoHeight, time: video.currentTime, paused: video.paused,
    })));
    await Promise.allSettled(tasks);
    const file = `/tmp/world-tv-es-player-${createHash("sha256").update(url).digest("hex").slice(0, 12)}.json`;
    await writeFile(file, JSON.stringify({ url, finalUrl: page.url(), checkedAt: new Date().toISOString(), error,
      frames, requests: [...new Set(requests)], responses, videos, text: text.slice(0, 20_000) }, null, 2));
    console.log(JSON.stringify({ url, file, error: error.slice(0, 200), mediaResponses: responses.length, videos }));
    await context.close();
  }
} finally { await browser.close(); }
