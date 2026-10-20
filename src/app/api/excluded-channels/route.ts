import { COUNTRIES } from "@/lib/countries";
import { addExcludedChannels, readExcludedChannels } from "@/lib/excluded-channels";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };

export async function GET() {
  return Response.json({ channels: await readExcludedChannels() }, { headers });
}

// Body: { country: "IT", channels: [{ id, name }] }
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { country?: unknown; channels?: unknown } | null;
  const country = COUNTRIES.find(item => item.code === body?.country);
  const channels = Array.isArray(body?.channels) ? body.channels : null;
  if (!country || !channels?.length || channels.length > 1000 || !channels.every(channel => typeof channel?.id === "string" && channel.id.length <= 200 &&
    (channel.name == null || typeof channel.name === "string"))) {
    return Response.json({ error: "Richiesta non valida." }, { status: 400, headers });
  }
  try {
    const saved = await addExcludedChannels(country.code, channels.map(channel => ({ id: channel.id, name: channel.name ?? null })));
    return Response.json({ channels: saved }, { headers });
  } catch {
    return Response.json({ error: "Eliminazione non salvata sul server." }, { status: 500, headers });
  }
}
