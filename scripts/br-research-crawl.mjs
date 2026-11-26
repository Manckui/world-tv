// Brazil research helper: fetch the public homepage and contact/"expediente"
// pages of each candidate with a plain HTTPS GET and extract address snippets
// (CEP, "Cidade - UF"). Output is raw evidence for manual curation, stored
// outside the repository (argv[2], default /tmp/br-crawl.json).
// Usage: node scripts/br-research-crawl.mjs [out.json] [extra-urls.json]
import { readFile, writeFile } from "node:fs/promises";

const out = process.argv[2] ?? "/tmp/br-crawl.json";
const candidates = JSON.parse(await readFile("reports/br-candidates.json", "utf8")).channels;
const extra = process.argv[3] ? JSON.parse(await readFile(process.argv[3], "utf8")) : [];
const targets = process.argv[4] === "--extra-only" ? extra : [...candidates.filter(c => c.website).map(c => ({ id: c.id, website: c.website })), ...extra];

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131 Safari/537.36";
const UF = "AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO";
const linkRe = /href=["']([^"'#]+)["'][^>]*>([\s\S]{0,120}?)<\/a>/gi;
const contactRe = /contato|contact|fale-?conosco|expediente|quem-?somos|sobre|institucional|a-?emissora|endereco|endereço/i;

async function get(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, { redirect: "follow", signal: controller.signal, headers: { "user-agent": UA, accept: "text/html,*/*" } });
    const text = (await res.text()).slice(0, 1_500_000);
    return { status: res.status, finalUrl: res.url, text };
  } catch (error) { return { status: 0, finalUrl: url, text: "", error: String(error.message ?? error) }; }
  finally { clearTimeout(timer); }
}
const plain = html => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&#8211;|&ndash;/g, "-").replace(/\s+/g, " ");
function snippets(text) {
  const found = new Set();
  for (const re of [/.{0,140}\bCEP\b.{0,80}/gi, /.{0,120}\b\d{5}-\d{3}\b.{0,60}/g, new RegExp(`.{0,80}[A-ZÀ-Ú][\\wÀ-ú' ]{2,40}\\s?[-/–]\\s?(?:${UF})\\b.{0,40}`, "g")]) {
    for (const m of text.matchAll(re)) { found.add(m[0].trim()); if (found.size > 12) break; }
  }
  return [...found];
}
async function crawl(target) {
  const pages = [];
  const home = await get(target.website.replace(/^http:/, "https:"));
  const first = home.status ? home : await get(target.website);
  pages.push({ url: first.finalUrl, status: first.status, error: first.error, snippets: snippets(plain(first.text)) });
  const links = new Set();
  for (const m of first.text.matchAll(linkRe)) {
    if (!contactRe.test(m[1] + " " + m[2])) continue;
    try { const u = new URL(m[1], first.finalUrl); if (u.protocol.startsWith("http")) links.add(u.href); } catch { /* invalid href */ }
  }
  for (const link of [...links].slice(0, 4)) {
    const page = await get(link);
    pages.push({ url: page.finalUrl, status: page.status, error: page.error, snippets: snippets(plain(page.text)) });
  }
  return { id: target.id, website: target.website, pages };
}
const results = [];
let index = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (index < targets.length) {
    const target = targets[index++];
    results.push(await crawl(target));
    process.stderr.write(`${results.length}/${targets.length} ${target.id}\n`);
  }
}));
results.sort((a, b) => a.id.localeCompare(b.id));
await writeFile(out, JSON.stringify(results, null, 2));
console.log(`crawl: ${results.length} sites -> ${out}`);
