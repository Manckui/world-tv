// Input: geoBoundaries gbOpen POL ADM1 simplified GeoJSON (OpenStreetMap/Wambacher 2017, ODbL 1.0).
// Upstream uses the pre-2018 letter codes; ISO 3166-2:PL now uses numeric codes (PL-02…PL-32).
import { prepareMap } from "./map-prepare-utils.mjs";

const codes = {
  "PL-DS": ["PL-02", "Dolnośląskie"], "PL-KP": ["PL-04", "Kujawsko-pomorskie"], "PL-LU": ["PL-06", "Lubelskie"],
  "PL-LB": ["PL-08", "Lubuskie"], "PL-LD": ["PL-10", "Łódzkie"], "PL-MA": ["PL-12", "Małopolskie"],
  "PL-MZ": ["PL-14", "Mazowieckie"], "PL-OP": ["PL-16", "Opolskie"], "PL-PK": ["PL-18", "Podkarpackie"],
  "PL-PD": ["PL-20", "Podlaskie"], "PL-PM": ["PL-22", "Pomorskie"], "PL-SL": ["PL-24", "Śląskie"],
  "PL-SK": ["PL-26", "Świętokrzyskie"], "PL-WN": ["PL-28", "Warmińsko-mazurskie"], "PL-WP": ["PL-30", "Wielkopolskie"],
  "PL-ZP": ["PL-32", "Zachodniopomorskie"],
};
const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/pl-prepare-map.mjs <geoBoundaries-POL-ADM1_simplified.geojson>");
await prepareMap({ input, country: "PL", mapName: "poland", expected: 16, locale: "pl",
  identify: props => {
    const match = codes[props.shapeISO];
    if (!match) throw new Error(`Unknown region ${props.shapeISO}`);
    return match;
  } });
