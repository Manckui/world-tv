// Language and country are independent. Use deterministic channels so these
// checks measure UI behavior rather than a broadcaster's current availability.
import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const base = process.env.ORBITA_URL ?? "http://localhost:3000";
const output = ".impeccable/review";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
try {
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 960 : 844 }, reducedMotion: "reduce" });
    await context.route("**/api/channels?country=*", route => {
      const country = new URL(route.request().url()).searchParams.get("country");
      const streams = [1, 2].map(index => ({ url: `${base}/language-fixture-${index}.m3u8`, format: "hls",
        sources: [{ id: "fixture", name: "Fixture", url: base }], requiresHeaders: false }));
      const channel = { id: `fixture:${country}`, name: "Test TV", country, categories: [], website: "https://example.org",
        streams, stream: streams[0], alternativeStreams: 1,
        geography: { scope: "national", regions: [], basis: "unknown", sourceUrl: null } };
      return route.fulfill({ json: { country: { code: country }, channels: [channel] } });
    });
    await context.route("**/language-fixture-*.m3u8", route => route.fulfill({ status: 404 }));
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (/hydration|didn't match/i.test(message.text())) errors.push(message.text()); });
    await page.goto(base);
    await page.getByRole("button", { name: "Cambia lingua: English", exact: true }).waitFor();
    assert.equal(await page.locator("header").first().getByRole("combobox").count(), 0);
    assert.equal(await page.locator("header").first().getByLabel("Paese da esplorare").count(), 0);
    await page.getByLabel("Paese da esplorare").selectOption("ES");
    await page.locator("svg[aria-label='Mappa interattiva Spagna']").waitFor();
    await page.getByRole("button", { name: "Cambia lingua: English", exact: true }).click();
    await page.locator("html[lang='en']").waitFor();
    assert.equal(await page.getByLabel("Country to explore").inputValue(), "ES");
    await page.locator("svg[aria-label='Interactive map of Spain']").waitFor();
    await page.getByLabel("Country to explore").selectOption("IT");
    await page.locator("svg[aria-label='Interactive map of Italy']").waitFor();
    await page.getByRole("button", { name: "World TV, back to the globe", exact: true }).click();
    await page.getByText("More countries around the world, one step at a time.", { exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${output}/english-world-${width}.png`, animations: "disabled" });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "No horizontal overflow");
    if (width < 760) await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("button", { name: "Channels", exact: true }).click();
    await page.locator("#channel-browser").getByRole("button", { name: "Watch Test TV", exact: true }).click();
    await page.getByText("This live stream is unavailable right now.", { exact: false }).waitFor();
    assert.equal(await page.getByLabel("Fonte della diretta").count(), 0);
    const nextSource = page.waitForRequest("**/language-fixture-2.m3u8");
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await nextSource;
    await page.locator("[class*=playerTitle]").getByRole("button", { name: "Save Test TV to favorites", exact: true }).click();
    await page.getByRole("button", { name: "Switch language: Italiano", exact: true }).click();
    await page.getByRole("button", { name: "Torna a esplorare", exact: true }).waitFor();
    await page.getByRole("button", { name: "Cambia lingua: English", exact: true }).click();
    await page.locator("[class*=playerTitle]").getByRole("button", { name: "Remove Test TV from favorites", exact: true }).waitFor();
    await page.reload();
    await page.locator("html[lang='en']").waitFor();
    assert.equal(await page.getByRole("button", { name: "Switch language: Italiano", exact: true }).innerText(), "🇬🇧");
    const nav = page.getByRole("navigation", { name: width === 1440 ? "Main navigation" : "Mobile navigation" });
    await nav.getByRole("button", { name: "Favorites", exact: true }).click();
    await page.getByRole("button", { name: "Remove Test TV from favorites", exact: true }).waitFor();
    await nav.getByRole("button", { name: "Channels", exact: true }).click();
    await page.getByRole("textbox", { name: "Search for a channel or city" }).fill("missing-fixture");
    await page.getByRole("heading", { name: "No results this time." }).waitFor();
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log("PASS IT/EN: independent country/language, persistence, translated map/player/errors/search, favorites, retry, 1440/390/320.");
} finally { await browser.close(); }
