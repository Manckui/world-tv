// Brazil research helper (variant of pt-inspect-player.mjs): open public live
// pages in Chrome and record the media requests the page makes by itself.
// No header, cookie, geography or authentication is changed. Evidence goes to
// BR_INSPECT_DIR (default /tmp). Usage: node scripts/br-research-inspect.mjs <url>...
import { chromium } from "playwright-core";
import { writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const dir = process.env.BR_INSPECT_DIR ?? "/tmp";
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
try {
  for (const url of process.argv.slice(2)) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const media = new Set();
    page.on("request", request => {
      const u = request.url();
      if (/\.m3u8|\.mpd|manifest|playlist/i.test(u) && !/\.(js|css)(\?|$)/i.test(u)) media.add(u);
    });
    let error = "";
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForTimeout(4_000);
      for (const name of [/^(Aceitar|Aceito|Concordo|Entendi|OK)/i, /^(Assistir|Play|Ao vivo|Reproduzir)/i]) {
        const button = page.getByRole("button", { name }).first();
        if (await button.isVisible().catch(() => false)) await button.click().catch(() => {});
      }
      await page.waitForTimeout(10_000);
    } catch (caught) { error = caught.message; }
    const frames = page.frames().map(frame => frame.url()).filter(u => u && u !== "about:blank");
    const videos = [];
    for (const frame of page.frames()) {
      videos.push(...await frame.locator("video").evaluateAll(list => list.map(video => ({
        src: video.currentSrc, width: video.videoWidth, height: video.videoHeight, time: video.currentTime, paused: video.paused,
      }))).catch(() => []));
    }
    const file = `${dir}/world-tv-br-player-${createHash("sha256").update(url).digest("hex").slice(0, 12)}.json`;
    await writeFile(file, JSON.stringify({ url, finalUrl: page.url(), checkedAt: new Date().toISOString(), error, frames, media: [...media], videos }, null, 2));
    console.log(JSON.stringify({ url, final: page.url(), error: error.slice(0, 120), media: [...media].slice(0, 6), frames: frames.slice(1, 6), videos }));
    await context.close();
  }
} finally { await browser.close(); }
