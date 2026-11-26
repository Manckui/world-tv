// Fetch a broadcaster's public homepage plus its contact/colofon/over-ons pages and
// extract Dutch postal addresses ("1234 AB Plaats"). Plain GET requests only:
// no login, no header spoofing. Research helper, not a playback validator.
// Usage: node scripts/nl-research-crawl.mjs input.json output.json
// input: [{ id, name, website, pages?: [] }]
import { readFile, writeFile } from "node:fs/promises";

const [input, output] = process.argv.slice(2);
if (!output) throw new Error("Usage: input.json output.json");
const items = JSON.parse(await readFile(input, "utf8"));
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36 world-tv-research";

const get = async url => {
  const response = await fetch(url, { headers: { "user-agent": UA, "accept-language": "nl" }, redirect: "follow", signal: AbortSignal.timeout(20_000) });
  return { status: response.status, url: response.url, html: (await response.text()).slice(0, 3_000_000) };
};
const entities = { nbsp: " ", amp: "&", euml: "ë", eacute: "é", iuml: "ï", ouml: "ö", uuml: "ü", acirc: "â", ecirc: "ê" };
const text = html => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<br\s*\/?>|<\/(p|div|li|td|h\d|span|a)>/gi, "\n").replace(/<[^>]+>/g, " ")
  .replace(/&(\w+);/g, (m, e) => entities[e] ?? m).replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n))
  .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n");
const addresses = body => [...new Set([...body.matchAll(/\b([1-9]\d{3})\s?([A-Z]{2})\b[ ,\n]+([A-Z'][A-Za-zÀ-ÿ'.\- ]{1,30})/g)]
  .filter(m => !/^(SS|SA|SD)$/.test(m[2]))
  .map(m => `${m[1]} ${m[2]} ${m[3].split("\n")[0].trim()}`))].slice(0, 10);
const LINK = /contact|colofon|colophon|over-?ons|over-|about|impressum|disclaimer|privacy|adres|organisatie|stichting|wie-zijn/i;

const results = [];
const queue = [...items];
async function worker() {
  for (let item = queue.shift(); item; item = queue.shift()) {
    const result = { id: item.id, name: item.name, website: item.website, pages: [] };
    const seen = new Set();
    const visit = async url => {
      if (seen.has(url) || seen.size > 7) return null;
      seen.add(url);
      try {
        const page = await get(url);
        const body = text(page.html);
        result.pages.push({ url: page.url, status: page.status, addresses: addresses(body) });
        return page;
      } catch (error) { result.pages.push({ url, error: String(error.message).slice(0, 120) }); return null; }
    };
    const home = item.website ? await visit(item.website) : null;
    const links = home ? [...home.html.matchAll(/<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]{0,200}?)<\/a>/gi)]
      .filter(m => LINK.test(m[1] + " " + m[2].replace(/<[^>]+>/g, "")))
      .map(m => { try { return new URL(m[1].replaceAll("&amp;", "&"), home.url).href; } catch { return null; } })
      .filter(link => link && /^https?:/.test(link) && new URL(link).hostname.replace(/^www\./, "") === new URL(home.url).hostname.replace(/^www\./, "")) : [];
    for (const link of [...(item.pages ?? []), ...new Set(links)].slice(0, 6)) await visit(link);
    result.addresses = [...new Set(result.pages.flatMap(p => p.addresses ?? []))];
    results.push(result);
    process.stderr.write(`${item.id}: ${result.addresses.slice(0, 3).join(" | ")}\n`);
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
results.sort((a, b) => a.id.localeCompare(b.id));
await writeFile(output, JSON.stringify(results, null, 2) + "\n");
