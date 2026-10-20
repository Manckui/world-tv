// Coordinates of documented headquarters cities (town centre) from OpenStreetMap Nominatim.
// Input: reports/fr-research-geography.json (only entries with a documented city). Output: reports/fr-geocode.json.
// The query URL is stored as coordinateSourceUrl; precision is "city-centre", never the exact building.
// Nominatim policy: one request per second, identifying User-Agent.
import { readFile, writeFile } from "node:fs/promises";

const geography = JSON.parse(await readFile("reports/fr-research-geography.json", "utf8"));
const cache = {};
const iso = item => Object.entries(item.address ?? {}).filter(([key]) => key.startsWith("ISO3166-2")).map(([, value]) => value);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
// Overseas territories have their own ISO codes in OSM.
const COUNTRY = { FR: "fr,gp,mq,gf,re,yt,pm,nc,pf,bl,mf,wf", MC: "mc", BE: "be", CH: "ch", GB: "gb", CG: "cg", CN: "cn", RU: "ru" };

for (const [id, g] of Object.entries(geography)) {
  if (!g.city) continue;
  const countrycodes = COUNTRY[g.countryCode ?? "FR"];
  if (!countrycodes) continue;
  const key = `${g.city}|${g.province ?? ""}|${countrycodes}`;
  if (cache[key]) continue;
  // The département code narrows homonyms (e.g. Saint-Denis 93 vs 974).
  // Settlements only: a free-text query can match a street named after the city.
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: g.city, featureType: "settlement", countrycodes, format: "jsonv2", limit: "10", addressdetails: "1" })}`;
  const response = await fetch(url, { headers: { "User-Agent": "world-tv-lab-poc/0.1 (broadcaster seat geocoding)" } });
  const hits = response.ok ? await response.json() : [];
  // Prefer a hit whose postcode starts with the département code (97x for overseas).
  const place = hits.filter(item => ["city", "town", "village", "municipality", "hamlet", "suburb"].includes(item.addresstype));
  const department = g.province && /^\d/.test(String(g.province)) ? String(g.province) : null;
  // With a département, the postcode must match; otherwise accept a single unambiguous settlement.
  const territory = g.province && /^[A-Z]{2}$/.test(String(g.province)) ? String(g.province).toLowerCase() : null;
  const inDepartment = item => item.address?.postcode?.startsWith(department) ||
    iso(item).some(value => value.startsWith(`FR-${department}`) || value.endsWith(`-${department}`));
  const hit = department ? place.find(inDepartment)
    : territory ? place.find(item => item.address?.country_code === territory || iso(item).some(value => value === `FR-${territory.toUpperCase()}`))
    // Single-country search outside France (e.g. Monaco): the first settlement is unambiguous enough.
    : !countrycodes.includes(",") && countrycodes !== "fr" ? place[0]
    : place.length === 1 || new Set(place.map(item => item.display_name.split(",").slice(-3).join())).size === 1 ? place[0] : null;
  cache[key] = hit ? { lat: +(+hit.lat).toFixed(4), lon: +(+hit.lon).toFixed(4), osm: `${hit.osm_type}/${hit.osm_id}`, displayName: hit.display_name, sourceUrl: url }
    : { lat: null, lon: null, sourceUrl: url, error: place.length ? "risultati ambigui o fuori dipartimento" : "nessun centro abitato trovato" };
  console.log(`${hit ? "✓" : "·"} ${g.city} (${g.province ?? "-"}) ${hit ? `${cache[key].lat},${cache[key].lon} ${hit.display_name.slice(0, 60)}` : ""}`);
  await sleep(1100);
}
await writeFile("reports/fr-geocode.json", JSON.stringify({ version: 1, source: "OpenStreetMap Nominatim (ODbL)", precision: "city-centre", places: cache }, null, 2) + "\n");
