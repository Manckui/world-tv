// Input: geoBoundaries gbOpen BRA ADM1 simplified GeoJSON (Wikimedia Commons "Brazil_States.svg", CC BY 2.5).
// Upstream names are unaccented and partly misspelled: display names come from the ISO code.
import { prepareMap } from "./map-prepare-utils.mjs";

const names = {
  "BR-AC": "Acre", "BR-AL": "Alagoas", "BR-AP": "Amapá", "BR-AM": "Amazonas", "BR-BA": "Bahia", "BR-CE": "Ceará",
  "BR-DF": "Distrito Federal", "BR-ES": "Espírito Santo", "BR-GO": "Goiás", "BR-MA": "Maranhão", "BR-MT": "Mato Grosso",
  "BR-MS": "Mato Grosso do Sul", "BR-MG": "Minas Gerais", "BR-PA": "Pará", "BR-PB": "Paraíba", "BR-PR": "Paraná",
  "BR-PE": "Pernambuco", "BR-PI": "Piauí", "BR-RJ": "Rio de Janeiro", "BR-RN": "Rio Grande do Norte",
  "BR-RS": "Rio Grande do Sul", "BR-RO": "Rondônia", "BR-RR": "Roraima", "BR-SC": "Santa Catarina",
  "BR-SP": "São Paulo", "BR-SE": "Sergipe", "BR-TO": "Tocantins",
};
const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/br-prepare-map.mjs <geoBoundaries-BRA-ADM1_simplified.geojson>");
await prepareMap({ input, country: "BR", mapName: "brazil", expected: 27, locale: "pt",
  identify: props => {
    const name = names[props.shapeISO];
    if (!name) throw new Error(`Unknown region ${props.shapeISO} ${props.shapeName}`);
    return [props.shapeISO, name];
  } });
