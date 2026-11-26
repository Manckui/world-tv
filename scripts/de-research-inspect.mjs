// Open public broadcaster pages in headless Chrome and record what the page itself loads:
// HLS/DASH requests, player iframes, live/Impressum links and German postal-address hints.
// No header changes, no cookies injected, no login, no geolocation or anti-bot workarounds.
// Usage: node scripts/de-research-inspect.mjs input.json output.json [concurrency]
// input: [{ id, name, page, impressum? }]
import { chromium } from "playwright-core";
import { readFile, writeFile } from "node:fs/promises";

const [input, output, concurrencyArg] = process.argv.slice(2);
if (!output) throw new Error("Usage: input.json output.json [concurrency]");
const items = JSON.parse(await readFile(input, "utf8"));
const addresses = body => [...new Set([...body.matchAll(/\b(\d{5})\s+([A-ZÄÖÜ][A-Za-zÄÖÜäöüß.\-/()]+(?: [A-ZÄÖÜa-z(][A-Za-zÄÖÜäöüß.\-/()]+){0,3})/g)]
  .map(match => `${match[1]} ${match[2].trim()}`))].slice(0, 8);

const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
async function visit(context, url, wait) {
  const page = await context.newPage();
  const media = new Set();
  page.on("request", request => { if (/\.m3u8|\.mpd|manifest|playlist\.json|\/embed\/|player/i.test(request.url())) media.add(request.url()); });
  let error = null;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(2500);
    for (const frame of page.frames()) {
      const consent = frame.getByRole("button", { name: /^(alle ablehnen|ablehnen|nur (technisch )?notwendige|nur essenzielle|reject all|alle akzeptieren|akzeptieren|zustimmen|einverstanden|accept all)/i }).first();
      if (await consent.isVisible().catch(() => false)) await consent.click({ timeout: 1500 }).catch(() => {});
    }
    for (const frame of page.frames()) {
      const play = frame.getByRole("button", { name: /^(play|abspielen|wiedergabe|video abspielen|livestream starten|start)/i }).first();
      if (await play.isVisible().catch(() => false)) await play.click({ timeout: 1500 }).catch(() => {});
    }
    await page.waitForTimeout(wait);
  } catch (caught) { error = caught.message.split("\n")[0]; }
  const html = await page.content().catch(() => "");
  const text = await page.locator("body").innerText().catch(() => "");
  const links = await page.locator("a[href]").evaluateAll(nodes => nodes.map(node => ({ text: (node.textContent || "").trim().slice(0, 60), url: node.href })))
    .catch(() => []);
  const inlineMedia = [...new Set([...html.matchAll(/https?:\\?\/\\?\/[^"'\s<>]+?\.(?:m3u8|mpd)[^"'\s<>]*/g)].map(match => match[0].replaceAll("\\/", "/")))];
  const frames = page.frames().map(frame => frame.url()).filter(frameUrl => frameUrl && frameUrl !== "about:blank");
  const videos = await page.locator("video").evaluateAll(nodes => nodes.map(video => ({ src: video.currentSrc, width: video.videoWidth, time: video.currentTime })))
    .catch(() => []);
  const finalUrl = page.url();
  await page.close();
  return { finalUrl, error, media: [...media], inlineMedia, frames, links, text, videos };
}
const queue = [...items];
async function worker() {
  for (let item = queue.shift(); item; item = queue.shift()) {
    const context = await browser.newContext({ locale: "de-DE" });
    const result = { ...item, checkedAt: new Date().toISOString() };
    try {
      const main = await visit(context, item.page, item.wait ?? 9000);
      Object.assign(result, { finalUrl: main.finalUrl, error: main.error, media: main.media, inlineMedia: main.inlineMedia, frames: main.frames, videos: main.videos,
        liveLinks: main.links.filter(link => /live|stream|direkt|tv-programm|mediathek|fernsehen/i.test(link.text + " " + link.url)).slice(0, 25) });
      const hasMedia = [...main.media, ...main.inlineMedia].some(url => /\.m3u8|\.mpd/.test(url));
      const follow = !hasMedia && !item.noFollow && main.links.find(link => /live|stream/i.test(link.text + " " + link.url)
        && !/youtube|facebook|instagram|twitter|radio|podcast|\.mp3|livestreamfails/i.test(link.url) && new URL(link.url).hostname.endsWith(new URL(main.finalUrl).hostname.replace(/^www\./, "")));
      if (follow) {
        const live = await visit(context, follow.url, item.wait ?? 9000);
        Object.assign(result, { followed: follow.url, followedError: live.error, media: [...main.media, ...live.media], inlineMedia: [...main.inlineMedia, ...live.inlineMedia],
          frames: [...main.frames, ...live.frames], videos: [...main.videos, ...live.videos] });
      }
      const impressum = item.impressum ?? main.links.find(link => /impressum|imprint/i.test(link.text + link.url))?.url;
      if (impressum && !item.skipImpressum) {
        const page = impressum === main.finalUrl ? main : await visit(context, impressum, 1500);
        const at = Math.max(0, page.text.search(/impressum|anbieter|herausgeber|angaben gem/i));
        Object.assign(result, { impressum, addresses: addresses(page.text), excerpt: page.text.slice(at, at + 900) });
      }
    } catch (caught) { result.error = String(caught.message).split("\n")[0]; }
    results.push(result);
    await writeFile(output, JSON.stringify(results, null, 2));
    console.log(JSON.stringify({ id: item.id, media: [...new Set([...(result.media ?? []), ...(result.inlineMedia ?? [])])].filter(url => /m3u8|mpd/.test(url)).map(url => url.slice(0, 160)).slice(0, 6),
      followed: result.followed, frames: (result.frames ?? []).filter(url => !/doubleclick|googletag|cookie|consent|usercentrics|recaptcha|facebook|matomo|criteo|demdex|optimizely/i.test(url)).slice(1, 5).map(url => url.slice(0, 120)), addresses: result.addresses, error: result.error }));
    await context.close();
  }
}
try { await Promise.all(Array.from({ length: Number(concurrencyArg ?? 3) }, worker)); } finally { await browser.close(); }
