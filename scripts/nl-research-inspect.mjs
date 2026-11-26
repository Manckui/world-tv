// Open public NL broadcaster pages in Chrome (playwright-core, channel "chrome") and record
// only what the page does on its own: media requests (m3u8/mpd/embeds), iframes, and Dutch
// postal addresses ("1234 AB Plaats") in the rendered text. No header, cookie, geography or
// authentication changes; consent banners are rejected when a visible "Weigeren"-style button exists.
// Usage: node scripts/nl-research-inspect.mjs input.json output.json
// input: [{ id, urls: [] }]
import { chromium } from "playwright-core";
import { readFile, writeFile } from "node:fs/promises";

const [input, output] = process.argv.slice(2);
if (!output) throw new Error("Usage: input.json output.json");
const items = JSON.parse(await readFile(input, "utf8"));
const addresses = body => [...new Set([...body.matchAll(/\b([1-9]\d{3})\s?([A-Z]{2})\b[ ,\n\t]+([A-Z'][A-Za-zÀ-ÿ'.\- ]{1,30})/g)]
  .filter(m => !/^(SS|SA|SD)$/.test(m[2])).map(m => `${m[1]} ${m[2]} ${m[3].split("\n")[0].trim()}`))].slice(0, 10);
const MEDIA = /\.m3u8|\.mpd|\/hls\/|\/live\/|player|embed|stream/i;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
const queue = [...items];
async function worker() {
  for (let item = queue.shift(); item; item = queue.shift()) {
    const result = { id: item.id, pages: [] };
    for (const url of item.urls) {
      const context = await browser.newContext({ locale: "nl-NL" });
      const page = await context.newPage();
      const media = new Set();
      page.on("request", request => { if (MEDIA.test(request.url()) && !/\.(js|css|png|jpg|svg|woff2?)(\?|$)/i.test(request.url())) media.add(request.url()); });
      let error = "";
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
        await page.waitForTimeout(2500);
        const reject = page.getByRole("button", { name: /^(Weigeren|Alles weigeren|Alle cookies weigeren|Reject all|Afwijzen|Niet akkoord|Alleen noodzakelijke?( cookies)?)$/i }).first();
        if (await reject.isVisible().catch(() => false)) await reject.click().catch(() => {});
        const play = page.getByRole("button", { name: /^(Play|Afspelen|Speel af|Kijk live)$/i }).first();
        if (await play.isVisible().catch(() => false)) await play.click().catch(() => {});
        await page.waitForTimeout(item.wait ?? 8000);
      } catch (caught) { error = caught.message.slice(0, 200); }
      const text = await page.locator("body").innerText().catch(() => "");
      const html = await page.content().catch(() => "");
      const htmlMedia = [...new Set([...html.matchAll(/https?:\/\/[^"'\s<>\\]+?\.(?:m3u8|mpd)[^"'\s<>\\]*/g)].map(m => m[0]))];
      const frames = page.frames().map(frame => frame.url()).filter(u => u && u !== "about:blank");
      result.pages.push({ url, finalUrl: page.url(), error, addresses: addresses(text), media: [...media].slice(0, 40), htmlMedia, frames: frames.slice(0, 15), text: item.keepText ? text.slice(0, 6000) : undefined });
      await context.close();
    }
    results.push(result);
    process.stderr.write(`${item.id}: ${result.pages.flatMap(p => p.addresses).slice(0, 3).join(" | ")} || ${result.pages.flatMap(p => [...p.media, ...p.htmlMedia]).filter(u => /m3u8|mpd/.test(u)).slice(0, 2).join(" ")}\n`);
  }
}
try { await Promise.all(Array.from({ length: 4 }, worker)); } finally { await browser.close(); }
results.sort((a, b) => a.id.localeCompare(b.id));
await writeFile(output, JSON.stringify(results, null, 2) + "\n");
