// Validate researched data before merging a country's contribution.
// This checks geography and provenance; it does not certify video playback.
import { readFile, readdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { geoArea, geoContains } from "d3-geo";

const mapNames = { ES: "spain", FR: "france" };
const countries = process.argv.slice(2);
if (!countries.length) countries.push(...(await readdir("data/catalogs")).filter(file => /^[A-Z]{2}\.json$/.test(file)).map(file => file.slice(0, 2)));
async function json(filename) { return JSON.parse(await readFile(filename, "utf8")); }
function url(value, label) {
  const parsed = new URL(value);
  assert.ok(["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password, label);
  return parsed;
}
for (const country of countries) {
  assert.match(country, /^[A-Z]{2}$/);
  assert.ok(mapNames[country], `Register a map filename for ${country}`);
  const [catalog, geography, regions, map] = await Promise.all([
    json(`data/catalogs/${country}.json`), json(`data/geography/${country}.json`),
    json(`data/regions/${country}.json`), json(`public/maps/${mapNames[country]}.json`),
  ]);
  for (const pack of [catalog, geography, regions]) {
    assert.equal(pack.version, 1); assert.equal(pack.country, country);
  }
  const regionCodes = new Set(regions.regions.map(region => region.code));
  assert.equal(regionCodes.size, regions.regions.length, "Duplicate region");
  assert.equal(map.features.length, regionCodes.size);
  for (const feature of map.features) {
    assert.ok(regionCodes.has(feature.properties.code), `Unknown map region ${feature.properties.code}`);
    assert.ok(geoArea(feature) > 0 && geoArea(feature) < Math.PI * 2, `Invalid winding ${feature.properties.code}`);
  }
  const ids = new Set();
  let sources = 0, pins = 0, datedSources = 0;
  for (const channel of catalog.channels) {
    assert.ok(channel.id && channel.name && !ids.has(channel.id), `Missing or duplicate channel: ${channel.id}`);
    ids.add(channel.id);
    if (channel.website) url(channel.website, channel.id);
    const location = geography.channels[channel.id];
    assert.ok(location, `Missing geography for ${channel.id}`);
    assert.ok(["national", "regional", "local", "foreign", "unknown"].includes(location.scope));
    if (["regional", "local"].includes(location.scope)) {
      assert.ok(regionCodes.has(location.regionCode), `Unknown region for ${channel.id}: ${location.regionCode}`);
      for (const extra of location.extraRegions ?? []) assert.ok(regionCodes.has(extra), `Unknown extra region ${extra}`);
    }
    if (location.scope === "national") assert.equal(location.regionCode, null, `National HQ must not become a region: ${channel.id}`);
    assert.equal(location.lat == null, location.lon == null, `Incomplete coordinates ${channel.id}`);
    if (location.lat != null) {
      assert.ok(location.city && location.sourceUrl, `Pin without documented city ${channel.id}`);
      assert.ok(Number.isFinite(location.lat) && Math.abs(location.lat) <= 90);
      assert.ok(Number.isFinite(location.lon) && Math.abs(location.lon) <= 180);
      if (["regional", "local"].includes(location.scope)) {
        const feature = map.features.find(feature => feature.properties.code === location.regionCode);
        assert.ok(geoContains(feature, [location.lon, location.lat]), `Pin outside its region: ${channel.id}`);
      }
      pins++;
    }
    const urls = new Set();
    assert.ok(channel.streams.length, `No sources for ${channel.id}`);
    for (const stream of channel.streams) {
      const parsed = url(stream.url, channel.id);
      url(stream.page, `Missing provenance ${channel.id}`);
      assert.ok(["hls", "dash", "embed"].includes(stream.format), `Unsupported format ${channel.id}`);
      assert.ok(!urls.has(parsed.href), `Duplicate source ${channel.id}`);
      assert.ok(!/\[.*\]|\$\{|\/fmt_token\/|\/token\/eyJ|[?&](?:expires|hdnts|hdnea|access_token|signature)=/i.test(stream.url),
        `Temporary token or unresolved macro in ${channel.id}`);
      urls.add(parsed.href); sources++;
      if (stream.verifiedAt) {
        assert.ok(Number.isFinite(Date.parse(stream.verifiedAt)), `Invalid verification date ${channel.id}`);
        datedSources++;
      }
    }
  }
  console.log(`PASS ${country}: ${ids.size} channels, ${sources} sources (${datedSources} dated), ${regionCodes.size} regions, ${pins} documented pins.`);
}
