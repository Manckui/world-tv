// For catalog sources discovered in public lists (IPTV-org, Free-TV), look for the same stream on the
// broadcaster's own pages: the live page / website from the research and IPTV-org metadata, plus one level
// of iframes. A match by exact URL, or by stream host + path stem, sets the official page as provenance.
// Output: reports/fr-provenance.json. Nothing is executed in a browser; plain GET with a normal User-Agent.
import { readFile, writeFile } from "node:fs/promises";

const catalog = JSON.parse(await readFile("data/catalogs/FR.json", "utf8"));
const research = JSON.parse(await readFile("reports/fr-research-sources.json", "utf8"));
const candidates = JSON.parse(await readFile("reports/fr-candidates.json", "utf8"));
const pagesFor = id => [...new Set([
  ...research.filter(item => item.id === id).flatMap(item => [item.livePage, item.website]),
  candidates.channels.find(channel => channel.id === id)?.website,
  catalog.channels.find(channel => channel.id === id)?.website,
].filter(Boolean))];

const get = async url => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000), redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156 Safari/537.36" } });
    return response.ok ? { url: response.url, text: await response.text() } : null;
  } catch { return null; }
};
const iframes = (html, base) => [...html.matchAll(/<iframe[^>]+src=["']([^"']+)["']/gi)].flatMap(m => {
  try { return [new URL(m[1].replaceAll("&amp;", "&"), base).href]; } catch { return []; }
}).slice(0, 6);
// Stem = host + first two path segments, e.g. "tv7.live-kd.com/live/tv7"; stable across renditions.
const stem = url => { const u = new URL(url); return `${u.hostname}${u.pathname.split("/").slice(0, 3).join("/")}`; };

const results = [];
for (const channel of catalog.channels) {
  for (const stream of channel.streams) {
    if (stream.page && !/iptv-org|free-tv|raw\.githubusercontent/i.test(stream.page)) { results.push({ channelId: channel.id, url: stream.url, status: "official-already", page: stream.page }); continue; }
    let found = null;
    const visited = new Set();
    for (const page of pagesFor(channel.id)) {
      const queue = [page];
      while (queue.length && !found) {
        const target = queue.shift();
        if (visited.has(target) || visited.size > 12) continue;
        visited.add(target);
        const response = await get(target);
        if (!response) continue;
        const text = response.text.replaceAll("\\/", "/");
        if (text.includes(stream.url)) found = { page: target, match: "exact-url" };
        else if (text.includes(stem(stream.url))) found = { page: target, match: "host-path" };
        else if (target === page) queue.push(...iframes(response.text, response.url));
      }
      if (found) break;
    }
    results.push({ channelId: channel.id, name: channel.name, url: stream.url, status: found ? "found-on-official-page" : "not-found", ...found ?? {},
      checkedPages: [...visited] });
    console.log(`${found ? "✓" : "·"} ${channel.name} ${found ? `${found.match} ${found.page}` : ""}`);
  }
}
// Second pass in Chrome: official players often build the stream URL in JavaScript. Open each official page
// once, record media requests (.m3u8/.mpd) for 20 s and match them to the remaining sources.
const { chromium } = await import("playwright-core");
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
const missing = results.filter(item => item.status === "not-found");
for (const channelId of [...new Set(missing.map(item => item.channelId))]) {
  for (const page of pagesFor(channelId)) {
    const context = await browser.newContext();
    const tab = await context.newPage();
    const media = new Set();
    tab.on("request", request => { if (/\.(m3u8|mpd)(\?|$)/i.test(request.url())) media.add(request.url()); });
    try { await tab.goto(page, { waitUntil: "domcontentloaded", timeout: 30_000 }); await tab.waitForTimeout(20_000); } catch { /* unreachable page */ }
    await context.close();
    for (const item of missing.filter(entry => entry.channelId === channelId && entry.status === "not-found")) {
      const hit = [...media].find(url => url === item.url) ?? [...media].find(url => stem(url) === stem(item.url))
        ?? [...media].find(url => new URL(url).hostname === new URL(item.url).hostname);
      if (hit) Object.assign(item, { status: "found-on-official-page", page, match: hit === item.url ? "browser-exact-url" : stem(hit) === stem(item.url) ? "browser-host-path" : "browser-same-host", observedUrl: hit.split("?")[0] });
    }
    console.log(`${missing.some(item => item.channelId === channelId && item.page === page) ? "✓" : "·"} browser ${channelId} ${page} (${media.size} richieste media)`);
    if (missing.filter(item => item.channelId === channelId).every(item => item.status !== "not-found")) break;
  }
}
await browser.close();

await writeFile("reports/fr-provenance.json", JSON.stringify({ version: 1, country: "FR", checkedAt: new Date().toISOString(), results }, null, 2) + "\n");
const counts = results.reduce((all, item) => ({ ...all, [item.status]: (all[item.status] ?? 0) + 1 }), {});
console.log(counts);
