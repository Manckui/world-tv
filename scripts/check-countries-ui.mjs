// Geography and interaction regression; playback is tested by test:streams.
import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const base = process.env.ORBITA_URL ?? "http://localhost:3000";
const directory = ".impeccable/review";
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
try {
  for (const viewport of [{ width: 1440, height: 960 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(base);
    const globe = page.locator("svg[aria-label^='Globo']");
    await globe.getByRole("button", { name: "Italia: esplora le regioni" }).waitFor();
    assert.equal(await globe.locator("text").count(), 1, "Only the active country has a label");
    await globe.getByRole("button", { name: "Spagna: seleziona il Paese" }).click();
    await globe.getByRole("button", { name: "Spagna: esplora le regioni" }).waitFor();
    assert.deepEqual(await globe.locator("text").allTextContents(), ["Spagna"]);
    await page.screenshot({ path: `${directory}/countries-world-${viewport.width}.png`, animations: "disabled" });
    await globe.getByRole("button", { name: "Spagna: esplora le regioni" }).click();
    await page.mouse.move(0, 0);
    const map = page.locator("svg[aria-label='Mappa interattiva Spagna']");
    await map.getByRole("button", { name: /^Andalucía: \d+/ }).waitFor();
    assert.equal(await map.locator("path[role='button']").count(), 19);
    assert.equal(await map.locator("text").count(), 0, "Country labels stay hidden until interaction");
    const andalucia = map.getByRole("button", { name: /^Andalucía: \d+/ });
    await andalucia.focus();
    await map.locator("text").filter({ hasText: /^Andalucía$/ }).waitFor();
    await page.getByRole("combobox", { name: "Paese da esplorare" }).focus();
    assert.equal(await map.locator("text").count(), 0);
    await page.screenshot({ path: `${directory}/spain-${viewport.width}.png`, animations: "disabled" });
    // Keyboard navigation avoids a tiny polygon's hitbox becoming the test target.
    await andalucia.focus();
    await andalucia.press("Enter");
    const regional = page.locator("svg[aria-label='Mappa interattiva Andalucía']");
    await regional.waitFor();
    await page.mouse.move(0, 0);
    assert.equal(await regional.locator("text").count(), 0, "Regional labels also start hidden");
    const city = regional.locator("g[role='button']").first();
    await city.waitFor();
    await city.focus();
    assert.equal(await city.locator("text").count(), 1, "A focused city shows its name");
    await page.getByRole("combobox", { name: "Paese da esplorare" }).focus();
    await page.screenshot({ path: `${directory}/andalucia-${viewport.width}.png`, animations: "disabled" });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "No horizontal overflow");
    await page.getByRole("combobox", { name: "Paese da esplorare" }).selectOption("IT");
    await page.locator("svg[aria-label='Mappa interattiva Italia']").waitFor();
    assert.equal(await page.locator("svg path[role='button']").count(), 20);
    await page.getByRole("combobox", { name: "Paese da esplorare" }).selectOption("ES");
    await page.locator("svg[aria-label='Mappa interattiva Spagna']").waitFor();
    assert.equal(await page.locator("svg path[role='button']").count(), 19);
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log("PASS country selection, isolated catalogs, 19 Spanish/20 Italian regions, labels on interaction, desktop/mobile.");
} finally { await browser.close(); }
