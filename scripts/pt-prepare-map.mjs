// Input: geoBoundaries gbOpen PRT ADM1 simplified GeoJSON.
// Output: public/maps/portugal.json and data/regions/PT.json.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { geoArea, geoCentroid } from "d3-geo";

const expected = new Set(["PT-01", "PT-02", "PT-03", "PT-04", "PT-05", "PT-06", "PT-07", "PT-08", "PT-09", "PT-10", "PT-11", "PT-12", "PT-13", "PT-14", "PT-15", "PT-16", "PT-17", "PT-18", "PT-20", "PT-30"]);
const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/pt-prepare-map.mjs <geoBoundaries-PRT-ADM1_simplified.geojson>");
const data = JSON.parse(await readFile(input, "utf8"));
const names = { "PT-01": "Aveiro", "PT-02": "Beja", "PT-03": "Braga", "PT-04": "Bragança", "PT-05": "Castelo Branco", "PT-06": "Coimbra", "PT-07": "Évora", "PT-08": "Faro", "PT-09": "Guarda", "PT-10": "Leiria", "PT-11": "Lisboa", "PT-12": "Portalegre", "PT-13": "Porto", "PT-14": "Santarém", "PT-15": "Setúbal", "PT-16": "Viana do Castelo", "PT-17": "Vila Real", "PT-18": "Viseu", "PT-20": "Açores", "PT-30": "Madeira" };
function cleanRing(ring) {
  const out = [];
  for (const point of ring) {
    const rounded = point.map(value => +value.toFixed(4));
    const last = out.at(-1);
    if (!last || last[0] !== rounded[0] || last[1] !== rounded[1]) out.push(rounded);
  }
  if (out.length && (out[0][0] !== out.at(-1)[0] || out[0][1] !== out.at(-1)[1])) out.push(out[0]);
  return out;
}
const features = data.features.map(feature => {
  const raw = feature.properties.shapeISO ?? feature.properties.shapeISO3166 ?? feature.properties.shapeID;
  const code = raw === "PT-20" || raw === "PT-30" ? raw : raw?.match(/PT-(\d\d)/)?.[0];
  if (!expected.has(code)) throw new Error(`Unknown region ${raw}`);
  const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  const coordinates = polygons.map(polygon => polygon.map(cleanRing).filter(ring => ring.length >= 4)).filter(Boolean).filter(polygon => polygon.length).map(rings => {
    if (geoArea({ type: "Polygon", coordinates: rings }) > Math.PI * 2) rings.forEach(ring => ring.reverse());
    return rings;
  });
  return { type: "Feature", properties: { code, name: names[code] ?? feature.properties.shapeName }, geometry: { type: "MultiPolygon", coordinates } };
});
if (features.length !== 20 || new Set(features.map(f => f.properties.code)).size !== 20) throw new Error(`Expected 20 Portugal regions, got ${features.length}`);
const regions = features.map(feature => ({ ...feature.properties, center: geoCentroid(feature).map(value => +value.toFixed(4)) })).sort((a, b) => a.name.localeCompare(b.name, "pt"));
await mkdir("data/regions", { recursive: true });
await writeFile("public/maps/portugal.json", JSON.stringify({ type: "FeatureCollection", features }));
await writeFile("data/regions/PT.json", JSON.stringify({ version: 1, country: "PT", regions }, null, 2) + "\n");
await writeFile("public/maps/portugal-credits.txt", "Fonte: geoBoundaries gbOpen PRT ADM1, release 9469f09 (DG Território). Licenza: ODbL 1.0.\nModifiche: selezionati i 20 distretti/regioni autonome del Portogallo, codici ISO 3166-2 PT-01…PT-18, PT-20 e PT-30; geometrie semplificate arrotondate a 4 decimali; winding normalizzato per d3-geo; centri calcolati con geoCentroid. Scaricato e trasformato per World TV.\n");
console.log(`Prepared ${regions.length} regions.`);
