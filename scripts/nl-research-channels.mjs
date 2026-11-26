// On a public multi-channel "Nu live" page (NLPO/Dtv-style sites), click each channel tile
// the page itself shows and record the HLS master the page requests. Passive observation:
// no header, cookie, geography or authentication changes. Usage:
// node scripts/nl-research-channels.mjs <url> "<label 1>" "<label 2>" ...
import { chromium } from "playwright-core";

const [url, ...labels] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await (await browser.newContext({ locale: "nl-NL" })).newPage();
  let seen = [];
  page.on("request", request => { if (/\.m3u8/.test(request.url()) && !/_output_|chunk|video-|audio-/.test(request.url())) seen.push(request.url()); });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(3000);
  const reject = page.getByRole("button", { name: /^Alles afwijzen$/i }).first();
  if (await reject.isVisible().catch(() => false)) await reject.click();
  await page.waitForTimeout(3000);
  console.log(JSON.stringify({ label: "(default)", hls: [...new Set(seen)] }));
  for (const label of labels) {
    seen = [];
    const tile = page.getByText(new RegExp(`^\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i")).last();
    try { await tile.click({ timeout: 5000 }); } catch (error) { console.log(JSON.stringify({ label, error: error.message.slice(0, 80) })); continue; }
    await page.waitForTimeout(6000);
    console.log(JSON.stringify({ label, hls: [...new Set(seen)] }));
  }
} finally { await browser.close(); }
