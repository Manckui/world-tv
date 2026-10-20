// Prepare public/maps/france.json and data/regions/FR.json.
// Sources: gregoiredavid/france-geojson "regions-avec-outre-mer.geojson" (IGN Admin Express, Licence Ouverte),
// plus New Caledonia / French Polynesia / Saint-Pierre-et-Miquelon from the original Natural Earth data.
// Overseas territories keep their real coordinates: no repositioned insets.
//
// curl -o /tmp/regions-om.geojson https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions-avec-outre-mer.geojson
// curl -o /tmp/ne50m-countries.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson
// node scripts/fr-prepare-map.mjs /tmp/regions-om.geojson /tmp/ne50m-countries.geojson
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { geoArea, geoCentroid } from "d3-geo";

// INSEE region code → ISO 3166-2:FR (verified against IPTV-org subdivisions.json, which follows ISO).
const ISO = {
  "11": "FR-IDF", "24": "FR-CVL", "27": "FR-BFC", "28": "FR-NOR", "32": "FR-HDF", "44": "FR-GES", "52": "FR-PDL",
  "53": "FR-BRE", "75": "FR-NAQ", "76": "FR-OCC", "84": "FR-ARA", "93": "FR-PAC", "94": "FR-20R",
  "01": "FR-971", "02": "FR-972", "03": "FR-973", "04": "FR-974", "06": "FR-976",
};
// Overseas collectivities absent from the IGN file: Natural Earth admin-0 code → ISO 3166-2:FR and French name.
const COLLECTIVITIES = { NCL: ["FR-NC", "Nouvelle-Calédonie"], PYF: ["FR-PF", "Polynésie française"], SPM: ["FR-PM", "Saint-Pierre-et-Miquelon"] };

// Same simplification as scripts/prepare-orbita-maps.mjs (Douglas–Peucker), copied to keep that file untouched.
function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const [ax, ay] = points[0], [bx, by] = points.at(-1);
  const length = (bx - ax) ** 2 + (by - ay) ** 2;
  let best = 0, index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const t = length ? Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / length)) : 0;
    const distance = (x - ax - t * (bx - ax)) ** 2 + (y - ay - t * (by - ay)) ** 2;
    if (distance > best) { best = distance; index = i; }
  }
  return best > tolerance ** 2
    ? [...simplify(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplify(points.slice(index), tolerance)]
    : [points[0], points.at(-1)];
}

function geometry(source, tolerance) {
  const polygons = source.type === "Polygon" ? [source.coordinates] : source.coordinates;
  const coordinates = polygons.map(polygon => {
    const rings = polygon.map(ring => simplify(ring, tolerance).map(point => point.map(n => +n.toFixed(4)))).filter(ring => ring.length >= 4);
    if (!rings.length) return null;
    // d3-geo expects clockwise exterior rings, unlike RFC 7946 GeoJSON.
    if (geoArea({ type: "Polygon", coordinates: rings }) > Math.PI * 2) rings.forEach(ring => ring.reverse());
    return rings;
  }).filter(Boolean);
  return { type: "MultiPolygon", coordinates };
}

const [regionsPath, overseasPath] = process.argv.slice(2);
if (!regionsPath || !overseasPath) throw new Error("Usage: node scripts/fr-prepare-map.mjs <regions-avec-outre-mer.geojson> <ne_50m_admin_0_countries.geojson>");
const source = JSON.parse(await readFile(regionsPath, "utf8"));
const overseas = JSON.parse(await readFile(overseasPath, "utf8"));
const features = source.features.map(feature => {
  const code = ISO[feature.properties.code];
  if (!code) throw new Error(`Codice regione sconosciuto: ${feature.properties.code}`);
  // Small overseas regions need a finer tolerance to keep their shape.
  // Overseas regions are small and coastal: a finer tolerance keeps seaside towns (e.g. Le Robert) inside the coastline.
  const tolerance = Number(feature.properties.code) < 10 ? .0005 : .006;
  return { type: "Feature", properties: { code, name: feature.properties.nom }, geometry: geometry(feature.geometry, tolerance) };
});
for (const [worldCode, [code, name]] of Object.entries(COLLECTIVITIES)) {
  const feature = overseas.features.find(item => item.properties.ADM0_A3 === worldCode);
  if (!feature) throw new Error(`${worldCode} assente dalla fonte Natural Earth`);
  // world.json is simplified for the globe: it can drop entire small islands.
  // Retain every source ring here, so regional zoom still includes Saint-Pierre.
  features.push({ type: "Feature", properties: { code, name }, geometry: geometry(feature.geometry, 0) });
}
const regions = features.map(feature => ({ code: feature.properties.code, name: feature.properties.name,
  center: geoCentroid(feature).map(n => +n.toFixed(4)) })).sort((a, b) => a.name.localeCompare(b.name, "fr"));
await mkdir("data/regions", { recursive: true });
await writeFile("public/maps/france.json", JSON.stringify({ type: "FeatureCollection", features }));
await writeFile("data/regions/FR.json", JSON.stringify({ version: 1, country: "FR",
  note: "center = [longitudine, latitudine], centroide della geometria in public/maps/france.json.", regions }, null, 2) + "\n");
console.log(`France: ${features.length} regioni/collettività.`);
