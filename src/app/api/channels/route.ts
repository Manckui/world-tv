import { COUNTRIES } from "@/lib/countries";
import { getChannelsByCountry } from "@/lib/iptv";

export async function GET(request: Request) {
  const countryParam = new URL(request.url).searchParams.get("country")?.toUpperCase();
  const country = COUNTRIES.find((item) => item.code === countryParam);

  if (!country) {
    return Response.json(
      { error: `Paese non valido. Usa uno tra: ${COUNTRIES.map((item) => item.code).join(", ")}` },
      { status: 400 },
    );
  }

  try {
    return Response.json(await getChannelsByCountry(country.code));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore sconosciuto";
    return Response.json({ error: `Impossibile caricare il catalogo: ${message}` }, { status: 502 });
  }
}
