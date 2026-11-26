// Input: geoBoundaries gbOpen NLD ADM1 simplified GeoJSON (Nationaal Georegister / PDOK 2022, CC0 1.0).
import { prepareMap } from "./map-prepare-utils.mjs";

const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/nl-prepare-map.mjs <geoBoundaries-NLD-ADM1_simplified.geojson>");
await prepareMap({ input, country: "NL", mapName: "netherlands", expected: 12, locale: "nl",
  identify: props => {
    if (!/^NL-[A-Z]{2}$/.test(props.shapeISO)) throw new Error(`Unknown region ${props.shapeISO}`);
    return [props.shapeISO, props.shapeName];
  } });
