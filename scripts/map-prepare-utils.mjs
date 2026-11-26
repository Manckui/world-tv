// Shared helpers for scripts/<cc>-prepare-map.mjs: geoBoundaries ADM1 → public/maps/<name>.json + data/regions/<CC>.json.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { geoArea, geoCentroid } from "d3-geo";

function cleanRing(ring, decimals) {
  // Overview-map precision; drop repeated points and keep rings closed.
  const out = [];
  for (const point of ring) {
    const rounded = point.map(value => +value.toFixed(decimals));
    const last = out[out.length - 1];
    if (!last || last[0] !== rounded[0] || last[1] !== rounded[1]) out.push(rounded);
  }
  if (out.length && (out[0][0] !== out.at(-1)[0] || out[0][1] !== out.at(-1)[1])) out.push(out[0]);
  return out;
}

/**
 * @param {object} options
 * @param {string} options.input      geoBoundaries GeoJSON path
 * @param {string} options.country    ISO alpha-2 code
 * @param {string} options.mapName    public/maps/<mapName>.json
 * @param {(props: object) => [string, string]} options.identify  returns [ISO 3166-2 code, display name]
 * @param {number} options.expected   number of regions
 * @param {string} options.locale     collation locale for region order
 * @param {number} [options.decimals]
 */
export async function prepareMap({ input, country, mapName, identify, expected, locale, decimals = 3 }) {
  const data = JSON.parse(await readFile(input, "utf8"));
  const features = data.features.map(feature => {
    const [code, name] = identify(feature.properties);
    const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    const coordinates = polygons.map(polygon => polygon.map(ring => cleanRing(ring, decimals)).filter(ring => ring.length >= 4))
      .filter(polygon => polygon.length)
      .map(rings => {
        // d3-geo's spherical convention uses clockwise exteriors.
        if (geoArea({ type: "Polygon", coordinates: rings }) > Math.PI * 2) rings.forEach(ring => ring.reverse());
        return rings;
      });
    return { type: "Feature", properties: { code, name }, geometry: { type: "MultiPolygon", coordinates } };
  });
  const codes = new Set(features.map(feature => feature.properties.code));
  if (features.length !== expected || codes.size !== expected) throw new Error(`Expected ${expected} distinct regions, got ${codes.size}/${features.length}`);
  const regions = features.map(feature => ({ ...feature.properties,
    center: geoCentroid(feature).map(value => +value.toFixed(4)) })).sort((a, b) => a.name.localeCompare(b.name, locale));
  await mkdir("data/regions", { recursive: true });
  await writeFile(`public/maps/${mapName}.json`, JSON.stringify({ type: "FeatureCollection", features }));
  await writeFile(`data/regions/${country}.json`, JSON.stringify({ version: 1, country, regions }, null, 2) + "\n");
  console.log(`Prepared ${regions.length} regions for ${country}.`);
}
