// Fetch a broadcaster's public homepage and Impressum/Kontakt page and extract postal-address hints
// (German "PLZ Ort" lines). Plain GET requests only: no login, no header spoofing.
// Usage: node scripts/de-research-impressum.mjs input.json output.json
// input: [{ id, name, website, impressum? }]
import { readFile, writeFile } from "node:fs/promises";

const [input, output] = process.argv.slice(2);
if (!output) throw new Error("Usage: input.json output.json");
const items = JSON.parse(await readFile(input, "utf8"));
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36 world-tv-research";

const get = async url => {
  const response = await fetch(url, { headers: { "user-agent": UA, "accept-language": "de" }, redirect: "follow", signal: AbortSignal.timeout(20_000) });
  return { status: response.status, url: response.url, html: await response.text() };
};
const text = html => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<br\s*\/?>|<\/(p|div|li|td|h\d)>/gi, "\n").replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&uuml;/g, "ü").replace(/&ouml;/g, "ö").replace(/&auml;/g, "ä")
  .replace(/&szlig;/g, "ß").replace(/&Uuml;/g, "Ü").replace(/&Ouml;/g, "Ö").replace(/&Auml;/g, "Ä").replace(/&#8211;|&ndash;/g, "–")
  .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n");
const addresses = body => [...new Set([...body.matchAll(/(?:D-|DE-)?\b(\d{5})\s+([A-ZÄÖÜ][A-Za-zÄÖÜäöüß.\-/ ()]{2,40})/g)]
  .map(match => `${match[1]} ${match[2].trim()}`))].slice(0, 8);

const results = [];
const queue = [...items];
async function worker() {
  for (let item = queue.shift(); item; item = queue.shift()) {
    const result = { id: item.id, name: item.name, website: item.website, checkedAt: new Date().toISOString() };
    try {
      let impressum = item.impressum;
      if (!impressum && item.website) {
        const home = await get(item.website);
        result.homeStatus = home.status; result.homeUrl = home.url;
        const links = [...home.html.matchAll(/<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]{0,200}?)<\/a>/gi)]
          .filter(match => /impressum|imprint|kontakt|contact/i.test(match[1] + match[2]))
          .map(match => { try { return new URL(match[1].replaceAll("&amp;", "&"), home.url).href; } catch { return null; } }).filter(Boolean);
        impressum = links.find(link => /impressum|imprint/i.test(link)) ?? links[0];
        result.homeAddresses = addresses(text(home.html));
      }
      if (impressum) {
        const page = await get(impressum);
        result.impressum = page.url; result.impressumStatus = page.status;
        const body = text(page.html);
        result.addresses = addresses(body);
        const at = body.search(/impressum|anbieter|herausgeber|verantwortlich|angaben gemäß/i);
        result.excerpt = body.slice(Math.max(0, at), Math.max(0, at) + 900).trim();
      }
    } catch (error) { result.error = String(error.message ?? error).slice(0, 200); }
    results.push(result);
    console.log(JSON.stringify({ id: result.id, impressum: result.impressum, addresses: result.addresses ?? result.homeAddresses, error: result.error }));
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
results.sort((a, b) => a.id.localeCompare(b.id));
await writeFile(output, JSON.stringify(results, null, 2));
