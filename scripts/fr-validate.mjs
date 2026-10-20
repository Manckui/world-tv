// Consistency checks for the French data pack. Exit code 1 on blocking errors.
import { readFile } from "node:fs/promises";
import { geoContains, geoDistance } from "d3-geo";

const read = async file => JSON.parse(await readFile(file, "utf8"));
const catalog = await read("data/catalogs/FR.json");
const geography = (await read("data/geography/FR.json")).channels;
const regions = (await read("data/regions/FR.json")).regions;
const map = await read("public/maps/france.json");
const codes = new Set(regions.map(region => region.code));
const feature = new Map(map.features.map(item => [item.properties.code, item]));
const errors = [], warnings = [];

if (codes.size !== feature.size || [...codes].some(code => !feature.has(code))) errors.push("Codici diversi fra data/regions/FR.json e public/maps/france.json");
for (const channel of catalog.channels) {
  const g = geography[channel.id];
  if (!g) errors.push(`${channel.id}: geografia assente`);
  if (!channel.streams.length) errors.push(`${channel.id}: nessuna fonte`);
  for (const stream of channel.streams) {
    if (!stream.verifiedAt) errors.push(`${channel.id}: fonte senza verifiedAt ${stream.url}`);
    if (stream.url.startsWith("http:")) errors.push(`${channel.id}: fonte HTTP ${stream.url}`);
    if (/\[[A-Z_.]+\]/.test(stream.url)) errors.push(`${channel.id}: macro non risolte nell'URL`);
    if (/[?&](token|expires|signature|hdnts|wmsAuthSign|Policy|Key-Pair-Id)=/i.test(stream.url)) errors.push(`${channel.id}: URL con parametri firmati ${stream.url}`);
    if (!["hls", "dash", "embed"].includes(stream.format)) errors.push(`${channel.id}: formato ${stream.format}`);
  }
  if (!g) continue;
  if (["regional", "local"].includes(g.scope) && !codes.has(g.regionCode)) errors.push(`${channel.id}: regione ${g.regionCode} non valida`);
  if (!["regional", "local"].includes(g.scope) && g.regionCode) errors.push(`${channel.id}: ${g.scope} con regionCode`);
  for (const extra of g.extraRegions ?? []) if (!codes.has(extra)) errors.push(`${channel.id}: regione extra ${extra}`);
  if (g.lat != null && (!g.city || !g.coordinateSourceUrl)) errors.push(`${channel.id}: pin senza città o fonte delle coordinate`);
  if (g.lat != null && g.regionCode) {
    const point = [g.lon, g.lat], area = feature.get(g.regionCode);
    if (!geoContains(area, point)) {
      // Coastal towns can fall just outside generalized coastlines: tolerate ≤ 3 km from any vertex of the region.
      const near = area.geometry.coordinates.flat(2).some(vertex => geoDistance(vertex, point) * 6371 <= 3);
      (near ? warnings : errors).push(`${channel.id}: pin ${g.city} fuori dalla geometria ${g.regionCode}${near ? " (costa generalizzata, ≤ 3 km)" : ""}`);
    }
  }
}
for (const id of Object.keys(geography)) if (!catalog.channels.some(channel => channel.id === id)) warnings.push(`${id}: geografia senza canale`);
console.log(`${catalog.channels.length} canali, ${catalog.channels.reduce((n, c) => n + c.streams.length, 0)} fonti, ${Object.values(geography).filter(g => g.lat != null).length} pin.`);
for (const warning of warnings) console.log(`AVVISO  ${warning}`);
for (const error of errors) console.log(`ERRORE  ${error}`);
if (errors.length) process.exitCode = 1; else console.log("Validazione FR superata.");
