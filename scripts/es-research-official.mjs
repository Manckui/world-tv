// Read-only evidence collection. Discovered URLs are candidates, not automatically
// trusted live channels: review their identity, then use the real browser runner.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

const input = JSON.parse(await readFile(process.argv[2] ?? "data/catalogs/ES.json", "utf8"));
const catalog = Array.isArray(input) ? input : input.channels;
const directory = process.argv[3] ?? "/tmp/world-tv-es-official";
await mkdir(directory, { recursive: true });
const records = [];
const pending = [...catalog];
const cache = new Map();
const decode = value => value.replaceAll("\\/", "/").replaceAll("&amp;", "&").replaceAll("\\u0026", "&");

async function page(url) {
  if (cache.has(url)) return cache.get(url);
  const request = (async () => {
    const file = `${directory}/${createHash("sha256").update(url).digest("hex").slice(0, 16)}.html`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      const html = (await response.text()).slice(0, 2_000_000);
      await writeFile(file, html);
      const text = decode(html);
      const streams = [...new Set(text.match(/https?:\/\/[^"'<>\s\\]+?\.(?:m3u8|mpd)(?:\?[^"'<>\s\\]*)?/gi) ?? [])];
      const frames = [...text.matchAll(/<iframe\b[^>]*(?:src|data-src)=["']([^"']+)/gi)]
        .flatMap(match => { try { return [new URL(match[1], response.url).href]; } catch { return []; } });
      const scripts = [...text.matchAll(/<script\b[^>]*src=["']([^"']+)/gi)]
        .flatMap(match => { try { return [new URL(match[1], response.url).href]; } catch { return []; } });
      return { url, finalUrl: response.url, status: response.status, streams, frames, scripts, file };
    } catch (error) { return { url, error: error.message, streams: [], frames: [], scripts: [], file }; }
  })();
  cache.set(url, request);
  return request;
}

async function worker() {
  while (pending.length) {
    const channel = pending.shift();
    if (!channel.website) continue;
    const main = await page(channel.website);
    const frames = main.frames.filter(url => !/youtube|google|facebook|twitter|doubleclick/i.test(url)).slice(0, 3);
    const embedded = [];
    for (const frame of frames) embedded.push(await page(frame));
    records.push({ id: channel.id, name: channel.name, checkedAt: new Date().toISOString(), pages: [main, ...embedded] });
    await writeFile(`${directory}/evidence.json`, JSON.stringify(records, null, 2));
    console.log(`${records.length}/${catalog.length} ${channel.name}: HTTP ${main.status ?? "error"}; ${[main, ...embedded].reduce((sum, item) => sum + item.streams.length, 0)} media URLs`);
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
