// Deterministic UI fixtures: these checks do not certify real TV availability.
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const base = process.env.ORBITA_URL ?? 'http://localhost:3000';
const output = '.impeccable/review';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const stream = { url: `${base}/orbita-fixture.m3u8`, format: 'hls', sources: [], requiresHeaders: false };
const make = (id, name, scope, region, city, lat, lon) => ({ id, name, country: 'IT', categories: [], website: null,
  stream, streams: [stream, { ...stream, url: `${base}/orbita-fixture-2.m3u8` }], alternativeStreams: 1,
  geography: { scope, regions: [{ code: region, name: region === 'IT-82' ? 'Sicilia' : 'Lazio' }], city,
    coordinates: { lat, lon }, basis: 'research', sourceUrl: null } });
const channels = [make('national', 'TV nazionale prova', 'national', 'IT-62', 'Roma', 41.9, 12.5),
  ...Array.from({ length: 16 }, (_, i) => make(`local-${i}`, `TV locale ${i + 1}`, 'local', 'IT-82', i < 8 ? 'Palermo' : 'Catania', i < 8 ? 38.12 : 37.5, i < 8 ? 13.36 : 15.09))];
try {
  for (const width of [1440, 390, 320]) {
    const mobile = width < 760;
    const context = await browser.newContext({ viewport: { width, height: mobile ? 844 : 960 }, reducedMotion: 'reduce' });
    await context.route('**/api/channels?country=*', route => route.fulfill({ json: { country: { code: 'IT' }, channels } }));
    await context.route('**/orbita-fixture*.m3u8', route => route.fulfill({ status: 404 }));
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.getByRole('button', { name: 'Italia: esplora le regioni', exact: true }).waitFor();
    await page.screenshot({ path: `${output}/world-new-${width}.png`, animations: 'disabled' });
    assert.equal(await page.getByRole('link', { name: /Laboratorio/ }).count(), 0);
    assert.equal(await page.locator('video').count(), 0, 'No stream before a country or channel is selected');
    await page.getByRole('button', { name: 'Italia: esplora le regioni', exact: true }).click();
    await page.getByLabel('Diretta TV nazionale prova', { exact: true }).waitFor();
    assert.equal(await page.locator('video').evaluate(video => video.muted), true, 'Country autoplay starts muted');
    await page.getByRole('button', { name: 'Torna a esplorare', exact: true }).click();
    if (mobile) await page.getByRole('button', { name: 'Apri elenco regioni Italia' }).click();
    const sidebar = page.locator('#channel-browser');
    assert.equal(await sidebar.getByRole('button', { name: 'Tutte', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(await sidebar.locator('ul li').count(), 17);
    // The scroll container is focusable, with fixed header/search/filter siblings.
    const scroll = sidebar.locator('[aria-label="Elenco canali e regioni"]');
    const headingBefore = await sidebar.locator('h2').first().boundingBox();
    await scroll.evaluate(el => { el.scrollTop = el.scrollHeight; });
    assert.ok(await scroll.evaluate(el => el.scrollTop > 0), 'Only channel results scroll');
    assert.deepEqual(await sidebar.locator('h2').first().boundingBox(), headingBefore);
    await sidebar.getByRole('button', { name: 'Regioni', exact: true }).click();
    await sidebar.getByRole('button', { name: 'Sicilia 16 TV del territorio', exact: true }).click();
    await page.locator('svg[aria-label="Mappa interattiva Sicilia"]').waitFor();
    if (!mobile) assert.equal(await sidebar.locator('ul li').count(), 16, 'Region list is never truncated');
    else assert.equal(await page.locator('[class*="mobileRegionChannels"] ul li').count(), 16);
    await page.getByRole('button', { name: 'Palermo: 8 TV', exact: true }).click();
    assert.equal(await sidebar.locator('ul li').count(), 8, 'Cluster count equals the displayed channels');
    await sidebar.getByRole('button', { name: 'Guarda TV locale 1', exact: true }).click();
    await page.locator('g[data-focused="true"]').waitFor();
    assert.ok((await page.locator('g[data-focused="true"]').getAttribute('data-channel-ids')).includes('local-0'));
    const pin = await page.locator('g[data-focused="true"] circle').first().boundingBox();
    assert.ok(pin && pin.x >= 0 && pin.x < width && pin.y > 140 && pin.y < (mobile ? 550 : 850), 'Selected pin stays in the visible map');
    await page.screenshot({ path: `${output}/selected-pin-${width}.png`, animations: 'disabled' });
    await page.getByRole('button', { name: 'Torna a esplorare', exact: true }).click();
    await page.getByRole('button', { name: 'Sorprendimi', exact: true }).click();
    await page.getByRole('button', { name: 'Torna a esplorare', exact: true }).waitFor();
    await page.waitForFunction(() => {
      const pin = document.querySelector('g[data-focused="true"]');
      return pin?.textContent && !pin.textContent.startsWith('TV locale 1 ·');
    });
    await page.getByRole('button', { name: 'Torna a esplorare', exact: true }).click();
    if (mobile) await page.getByRole('button', { name: 'Apri elenco TV Sicilia' }).click();
    await sidebar.getByRole('textbox').fill('zzznonesiste');
    await page.getByRole('heading', { name: 'Nessun risultato, per ora.' }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await context.close();
  }
  const autoplay = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const nationals = [channels[0], { ...channels[0], id: 'national-2', name: 'Seconda TV nazionale' },
    { ...channels[0], id: 'embed', name: 'Player ufficiale', stream: { ...stream, format: 'embed' } }];
  await autoplay.route('**/api/channels?country=*', route => route.fulfill({ json: { country: { code: 'IT' }, channels: nationals } }));
  await autoplay.route('**/orbita-fixture*.m3u8', route => route.fulfill({ status: 404 }));
  const page = await autoplay.newPage();
  await page.goto(base);
  await page.getByRole('button', { name: 'Italia: esplora le regioni', exact: true }).waitFor();
  for (const [draw, name] of [[0, 'TV nazionale prova'], [.99, 'Seconda TV nazionale']]) {
    await page.evaluate(value => { Math.random = () => value; }, draw);
    await page.getByRole('button', { name: 'Italia: esplora le regioni', exact: true }).click();
    await page.getByLabel(`Diretta ${name}`, { exact: true }).waitFor();
    assert.equal(await page.locator('video').evaluate(video => video.muted), true);
    await page.getByRole('button', { name: 'World TV, torna al mondo', exact: true }).click();
  }
  await autoplay.close();
  assert.deepEqual(errors, []);
  console.log('PASS: country autoplay, full lists, independent scrolling, cluster counts, selection/random pin focus, desktop/mobile 1440/390/320.');
} finally { await browser.close(); }
