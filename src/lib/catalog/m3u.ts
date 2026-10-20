import type { CatalogSource, TvStream } from "@/types/tv";

export type PlaylistEntry = { id: string; name: string; stream: TvStream };

export function httpUrl(value: string | null | undefined): string | null {
  try {
    const url = new URL(value ?? "");
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function streamFormat(url: string): TvStream["format"] {
  const parsed = new URL(url);
  if (/(^|\.)(youtube\.com|youtu\.be|dailymotion\.com)$/.test(parsed.hostname)) return "external";
  if (/\.mpd$/i.test(parsed.pathname)) return "dash";
  if (/\.m3u8?$/i.test(parsed.pathname) || /relinker/i.test(parsed.pathname)) return "hls";
  return "unknown";
}

export function streamRestriction(url: string): string | null {
  if (new URL(url).searchParams.has("forceUserAgent")) return "Questa voce richiede di simulare un altro player. Non viene eseguita: usare un’altra fonte.";
  return null;
}

export function normalizeChannelName(name: string): string {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/^\[\d+\]\s*/, "").replace(/[ⒼⓈⓎ]/g, "")
    .replace(/\s*\((?:\d+p|geo[^)]*|.*?backup|.*?not 24\/7)\)\s*/gi, "")
    .replace(/\s+(?:HD|SD|FHD|4K)$/i, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function parseM3u(text: string, source: CatalogSource): PlaylistEntry[] {
  if (!text.trimStart().startsWith("#EXTM3U")) throw new Error("La risposta non è una playlist M3U");
  const entries: PlaylistEntry[] = [];
  let current: { id: string; name: string; geo: boolean; headers: boolean } | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("#EXTINF:")) {
      // Locate the title comma outside attribute quotes (group names can contain commas).
      let quoted = false;
      let comma = -1;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') quoted = !quoted;
        if (line[i] === "," && !quoted) { comma = i; break; }
      }
      const attrs = Object.fromEntries([...line.slice(0, comma).matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
      const name = (attrs["tvg-name"] || line.slice(comma + 1)).replace(/^\[\d+\]\s*/, "").replace(/[ⒼⓈⓎ]/g, "").trim();
      current = comma >= 0 && name ? { id: attrs["tvg-id"] ?? "", name, geo: line.includes("Ⓖ") || /geo.blocked/i.test(line), headers: false } : null;
    } else if (/^#(?:EXTVLCOPT|KODIPROP|EXTHTTP):/i.test(line)) {
      if (current && /user.agent|referr?er|headers|license/i.test(line)) current.headers = true;
    } else if (line && !line.startsWith("#") && current) {
      // Some desktop lists put player options after a pipe. Retain the URL but never imitate headers.
      const [rawUrl, options] = line.split("|", 2);
      const url = httpUrl(rawUrl);
      if (url) {
        const requiresHeaders = current.headers || Boolean(options);
        entries.push({ id: current.id, name: current.name, stream: {
          url, title: current.name, quality: null, label: current.geo ? "Possibile restrizione geografica indicata dal catalogo" : null,
          requiresHeaders, sources: [source], format: streamFormat(url), restriction: streamRestriction(url),
        } });
      }
      current = null;
    }
  }
  return entries;
}
