// Input: geoBoundaries gbOpen DEU ADM1 simplified GeoJSON (BKG, dl-de/by-2-0).
// Output: public/maps/germany.json and data/regions/DE.json (16 Länder).
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { geoArea, geoCentroid } from "d3-geo";

const expected = ["DE-BW", "DE-BY", "DE-BE", "DE-BB", "DE-HB", "DE-HH", "DE-HE", "DE-MV",
  "DE-NI", "DE-NW", "DE-RP", "DE-SL", "DE-SN", "DE-ST", "DE-SH", "DE-TH"];
const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/de-prepare-map.mjs <geoBoundaries-DEU-ADM1_simplified.geojson>");
const data = JSON.parse(await readFile(input, "utf8"));

function cleanRing(ring) {
  // ~100 m precision is plenty for a regional overview map; drop repeated points.
  const out = [];
  for (const point of ring) {
    const rounded = point.map(value => +value.toFixed(3));
    const last = out[out.length - 1];
    if (!last || last[0] !== rounded[0] || last[1] !== rounded[1]) out.push(rounded);
  }
  if (out.length && (out[0][0] !== out.at(-1)[0] || out[0][1] !== out.at(-1)[1])) out.push(out[0]);
  return out;
}

const features = data.features.map(feature => {
  const code = feature.properties.shapeISO;
  if (!expected.includes(code)) throw new Error(`Unknown region ${code}`);
  const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  const coordinates = polygons.map(polygon => polygon.map(cleanRing).filter(ring => ring.length >= 4))
    .filter(polygon => polygon.length)
    .map(rings => {
      // d3-geo's spherical convention uses clockwise exteriors.
      if (geoArea({ type: "Polygon", coordinates: rings }) > Math.PI * 2) rings.forEach(ring => ring.reverse());
      return rings;
    });
  return { type: "Feature", properties: { code, name: feature.properties.shapeName },
    geometry: { type: "MultiPolygon", coordinates } };
});
if (features.length !== 16) throw new Error("Expected 16 Länder");
const regions = features.map(feature => ({ ...feature.properties,
  center: geoCentroid(feature).map(value => +value.toFixed(4)) })).sort((a, b) => a.name.localeCompare(b.name, "de"));
await mkdir("data/regions", { recursive: true });
await writeFile("public/maps/germany.json", JSON.stringify({ type: "FeatureCollection", features }));
await writeFile("data/regions/DE.json", JSON.stringify({ version: 1, country: "DE", regions }, null, 2) + "\n");
console.log(`Prepared ${regions.length} regions.`);
