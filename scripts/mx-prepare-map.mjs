// Input: geoBoundaries gbOpen MEX ADM1 simplified GeoJSON (INEGI 2020, CC BY 3.0 IGO).
// Upstream tags both "Distrito Federal" and "Mexico" as MX-MEX: Mexico City is MX-CMX (ISO 3166-2 since 2016).
import { prepareMap } from "./map-prepare-utils.mjs";

const byName = {
  "Aguascalientes": ["MX-AGU", "Aguascalientes"], "Baja California": ["MX-BCN", "Baja California"],
  "Baja California Sur": ["MX-BCS", "Baja California Sur"], "Campeche": ["MX-CAM", "Campeche"],
  "Chiapas": ["MX-CHP", "Chiapas"], "Chihuahua": ["MX-CHH", "Chihuahua"],
  "Coahuila de Zaragoza": ["MX-COA", "Coahuila"], "Colima": ["MX-COL", "Colima"],
  "Distrito Federal": ["MX-CMX", "Ciudad de México"], "Durango": ["MX-DUR", "Durango"],
  "Guanajuato": ["MX-GUA", "Guanajuato"], "Guerrero": ["MX-GRO", "Guerrero"], "Hidalgo": ["MX-HID", "Hidalgo"],
  "Jalisco": ["MX-JAL", "Jalisco"], "Mexico": ["MX-MEX", "Estado de México"],
  "Michoacan de Ocampo": ["MX-MIC", "Michoacán"], "Morelos": ["MX-MOR", "Morelos"], "Nayarit": ["MX-NAY", "Nayarit"],
  "Nuevo Leon": ["MX-NLE", "Nuevo León"], "Oaxaca": ["MX-OAX", "Oaxaca"], "Puebla": ["MX-PUE", "Puebla"],
  "Queretaro de Arteaga": ["MX-QUE", "Querétaro"], "Quintana Roo": ["MX-ROO", "Quintana Roo"],
  "San Luis Potosi": ["MX-SLP", "San Luis Potosí"], "Sinaloa": ["MX-SIN", "Sinaloa"], "Sonora": ["MX-SON", "Sonora"],
  "Tabasco": ["MX-TAB", "Tabasco"], "Tamaulipas": ["MX-TAM", "Tamaulipas"], "Tlaxcala": ["MX-TLA", "Tlaxcala"],
  "Veracruz de Ignacio de la Llave": ["MX-VER", "Veracruz"], "Yucatan": ["MX-YUC", "Yucatán"],
  "Zacatecas": ["MX-ZAC", "Zacatecas"],
};
const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/mx-prepare-map.mjs <geoBoundaries-MEX-ADM1_simplified.geojson>");
await prepareMap({ input, country: "MX", mapName: "mexico", expected: 32, locale: "es", decimals: 2,
  identify: props => {
    const match = byName[props.shapeName];
    if (!match) throw new Error(`Unknown region ${props.shapeName}`);
    return match;
  } });
