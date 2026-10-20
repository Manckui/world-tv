// Check country framing separately from changing broadcaster data.
import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

await mkdir(".impeccable/review", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 960 : 844 }, reducedMotion: "reduce" });
    await page.goto(process.env.ORBITA_URL ?? "http://localhost:3000");
    await page.getByLabel("Paese da esplorare").selectOption("FR");
    const map = page.locator("svg[aria-label='Mappa interattiva Francia']");
    await map.waitFor();
    assert.equal(await map.locator("path[role='button']").count(), 21);
    const bounds = await map.getByRole("button", { name: /^Nouvelle-Aquitaine:/ }).evaluate(path => ({
      width: path.getBBox().width, mapWidth: path.ownerSVGElement.viewBox.baseVal.width,
    }));
    assert.ok(bounds.width > bounds.mapWidth * .08, "Metropolitan regions should not collapse into a world overview");
    await page.screenshot({ path: `.impeccable/review/france-overview-${width}.png`, animations: "disabled" });
    if (width < 760) await page.getByRole("button", { name: "Apri elenco regioni Francia" }).click();
    const region = page.locator("#channel-browser").getByRole("button", { name: /^Polynésie française / });
    await region.click();
    const overseas = page.locator("svg[aria-label='Mappa interattiva Polynésie française']");
    await overseas.waitFor();
    const geometry = await overseas.getByRole("button", { name: /^Polynésie française:/ }).getAttribute("d");
    assert.ok(geometry && !geometry.includes("NaN"), "Overseas geometry can be explored");
    await page.screenshot({ path: `.impeccable/review/france-overseas-${width}.png`, animations: "disabled" });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.close();
  }
  console.log("PASS France map: metropolitan overview, all 21 territories retained, Polynesia accessible, desktop/mobile.");
} finally { await browser.close(); }
