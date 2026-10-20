// Input: geoBoundaries gbOpen ESP ADM1 simplified GeoJSON (IGN, CC BY 4.0).
// Geometry is already simplified upstream; keep small Ceuta/Melilla polygons.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { geoArea, geoCentroid } from "d3-geo";

const names = {
  "Andalucía": ["AN", "Andalucía"], "Aragón": ["AR", "Aragón"],
  "Principado de Asturias": ["AS", "Asturias"], "Illes Balears": ["IB", "Illes Balears"],
  "Canarias": ["CN", "Canarias"], "Cantabria": ["CB", "Cantabria"],
  "Castilla y León": ["CL", "Castilla y León"], "Castilla-La Mancha": ["CM", "Castilla-La Mancha"],
  "Cataluña/Catalunya": ["CT", "Catalunya"], "Comunitat Valenciana": ["VC", "Comunitat Valenciana"],
  "Extremadura": ["EX", "Extremadura"], "Galicia": ["GA", "Galicia"],
  "Comunidad de Madrid": ["MD", "Comunidad de Madrid"], "Región de Murcia": ["MC", "Región de Murcia"],
  "Comunidad Foral de Navarra": ["NC", "Navarra"], "País Vasco/Euskadi": ["PV", "País Vasco / Euskadi"],
  "La Rioja": ["RI", "La Rioja"], "Ciudad Autónoma de Ceuta": ["CE", "Ceuta"],
  "Ciudad Autónoma de Melilla": ["ML", "Melilla"],
};
const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/es-prepare-map.mjs <geoBoundaries-ESP-ADM1_simplified.geojson>");
const data = JSON.parse(await readFile(input, "utf8"));
data.features = data.features.map(feature => {
  const match = names[feature.properties.shapeName];
  if (!match) throw new Error(`Unknown region ${feature.properties.shapeName}`);
  const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  const coordinates = polygons.map(polygon => {
    const rings = polygon.map(ring => ring.map(point => point.map(value => +value.toFixed(5))));
    // d3-geo's spherical convention uses clockwise exteriors.
    if (geoArea({ type: "Polygon", coordinates: rings }) > Math.PI * 2) rings.forEach(ring => ring.reverse());
    return rings;
  });
  return { type: "Feature", properties: { code: `ES-${match[0]}`, name: match[1] },
    geometry: { type: "MultiPolygon", coordinates } };
});
if (data.features.length !== 19) throw new Error("Expected 17 autonomous communities and 2 autonomous cities");
const regions = data.features.map(feature => ({ ...feature.properties,
  center: geoCentroid(feature).map(value => +value.toFixed(4)) })).sort((a, b) => a.name.localeCompare(b.name, "es"));
await mkdir("data/regions", { recursive: true });
await writeFile("public/maps/spain.json", JSON.stringify({ type: "FeatureCollection", features: data.features }));
await writeFile("data/regions/ES.json", JSON.stringify({ version: 1, country: "ES", regions }, null, 2) + "\n");
console.log(`Prepared ${regions.length} regions.`);
