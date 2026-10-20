// Inspect public official pages without changing headers, authentication or geolocation.
import { chromium } from 'playwright-core';
import { readFile, writeFile } from 'node:fs/promises';
const input = JSON.parse(await readFile(process.argv[2], 'utf8'));
const output = process.argv[3];
if (!output) throw new Error('Provide input JSON and output JSON paths');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  for (const item of input) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const media = new Set();
    page.on('request', request => { if (/\.m3u8|\.mpd|\/player\/|\/embed\//i.test(request.url())) media.add(request.url()); });
    let error = null;
    try {
      await page.goto(item.page, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(3500);
      const reject = page.getByRole('button', { name: /tout refuser|continuer sans accepter|reject all/i }).first();
      if (await reject.isVisible()) await reject.click();
      for (const frame of page.frames()) {
        const play = frame.getByRole('button', { name: /^(play|lire|lecture|regarder le direct|lancer la vidéo)/i }).first();
        if (await play.isVisible().catch(() => false)) await play.click({ timeout: 1000 }).catch(() => {});
      }
      await page.waitForTimeout(6500);
    } catch (caught) { error = caught.message; }
    const html = await page.content().catch(() => '');
    const embeds = [...html.matchAll(/(?:src|data-src)=["']([^"']*(?:dailymotion|youtube|player|embed)[^"']*)["']/gi)].map(match => match[1].replaceAll('&amp;', '&'));
    const links = await page.locator('a[href]').evaluateAll(nodes => nodes.map(node => ({text: node.textContent?.trim(), url: node.href})).filter(link => /direct|live|mention|contact/i.test(link.text + link.url))).catch(() => []);
    const result = {...item, checkedAt: new Date().toISOString(), url: page.url(), error, media: [...media], embeds, frames: page.frames().map(frame => frame.url()), links,
      text: (await page.locator('body').innerText().catch(() => '')).slice(0, 5000)};
    results.push(result);
    await writeFile(output, JSON.stringify(results, null, 2));
    console.log(JSON.stringify({name:item.name, media:[...media].filter(url=>/m3u8|mpd/.test(url)).map(url=>url.split('?')[0]), embeds, error}));
    await context.close();
  }
} finally { await browser.close(); }
