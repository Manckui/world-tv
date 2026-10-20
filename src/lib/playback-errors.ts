import { ErrorDetails, ErrorTypes, type ErrorData } from "hls.js";
import type { PlaybackIssue } from "@/types/tv";

export function classifyHlsError(data: ErrorData): PlaybackIssue {
  const network = data.networkDetails as { status?: number; url?: string; responseURL?: string } | null | undefined;
  const code = data.response?.code || network?.status;
  const httpStatus = typeof code === "number" && code > 0 ? code : null;
  const details = data.details;
  const stage: PlaybackIssue["stage"] = details.startsWith("manifest") ? "manifest"
    : /^(level|audioTrack|subtitleTrack)/.test(details) ? "playlist"
    : details.startsWith("frag") ? "segment"
    : /^(key|keySystem)/.test(details) ? "key" : "media";
  const base = {
    stage, httpStatus, type: data.type, details, fatal: data.fatal,
    rawMessage: data.error?.message || data.reason || details,
    resourceUrl: data.response?.url || data.url || data.context?.url || data.frag?.url || network?.responseURL || network?.url || null,
  };

  if (data.type === ErrorTypes.KEY_SYSTEM_ERROR) {
    return { ...base, category: "drm", message: "Errore del sistema DRM/licenza. Nessun aggiramento previsto." };
  }
  if (httpStatus === 401 || httpStatus === 403 || httpStatus === 451) {
    return { ...base, category: "access_denied", message: `HTTP ${httpStatus}: accesso negato. Possibile restrizione geografica, autenticazione o altra limitazione; causa non confermata.` };
  }
  if (httpStatus === 404 || httpStatus === 410) {
    return { ...base, category: "unavailable", message: `HTTP ${httpStatus}: risorsa dello stream non disponibile. URL obsoleto o possibile stream offline; stato del canale non confermato.` };
  }
  if (httpStatus !== null && httpStatus >= 400) {
    return { ...base, category: "http", message: `Il server dello stream ha risposto con HTTP ${httpStatus}.` };
  }
  if (/timeout/i.test(details)) {
    return { ...base, category: "timeout", message: "Tempo di attesa scaduto. Non basta per confermare che la TV sia offline." };
  }
  if ([ErrorDetails.MANIFEST_INCOMPATIBLE_CODECS_ERROR, ErrorDetails.BUFFER_INCOMPATIBLE_CODECS_ERROR, ErrorDetails.BUFFER_ADD_CODEC_ERROR].includes(details)) {
    return { ...base, category: "incompatible", message: "Codec o formato non compatibile con questo browser." };
  }
  if ([ErrorDetails.MANIFEST_PARSING_ERROR, ErrorDetails.LEVEL_PARSING_ERROR, ErrorDetails.LEVEL_EMPTY_ERROR].includes(details)) {
    return { ...base, category: "manifest", message: "Manifest/playlist HLS non valido o vuoto. La risposta non è utilizzabile dal player." };
  }
  if (data.type === ErrorTypes.NETWORK_ERROR) {
    return { ...base, category: "network_cors", message: "Errore di rete con causa non determinata. Possibili CORS, DNS, TLS o connessione; il browser non fornisce una diagnosi certa." };
  }
  return { ...base, category: data.type === ErrorTypes.MEDIA_ERROR || data.type === ErrorTypes.MUX_ERROR ? "media" : "unknown", message: `Errore di riproduzione: ${details}.` };
}

export function classifyMediaError(error: MediaError | null, streamUrl: string): PlaybackIssue {
  const code = error?.code;
  const category: PlaybackIssue["category"] = code === 2 ? "network_cors" : code === 3 ? "media" : code === 4 ? "incompatible" : "unknown";
  const message = code === 2 ? "Errore di rete nel player nativo. HTTP e CORS non sono distinguibili da questo evento."
    : code === 3 ? "Il browser non riesce a decodificare il video."
    : code === 4 ? "Sorgente non riproducibile dal browser; formato incompatibile o risposta non utilizzabile."
    : "Riproduzione interrotta per un errore non determinato.";
  return { category, stage: "media", message, rawMessage: error?.message || message, type: "MediaError", details: `MEDIA_ERR_${code ?? "UNKNOWN"}`, fatal: true, httpStatus: null, resourceUrl: streamUrl };
}

export function classifyDashError(event: unknown, streamUrl: string): PlaybackIssue {
  const e = event as { error?: { code?: number; message?: string; data?: { request?: { status?: number; url?: string }; response?: { status?: number }; url?: string } } | string; event?: { request?: { status?: number }; url?: string; message?: string } };
  const error = typeof e.error === "object" ? e.error : null;
  const code = error?.code;
  const status = error?.data?.request?.status ?? error?.data?.response?.status ?? e.event?.request?.status;
  const httpStatus = status && status > 0 ? status : null;
  const rawMessage = error?.message || e.event?.message || String(e.error ?? "DASH playback error");
  const category: PlaybackIssue["category"] = httpStatus === 401 || httpStatus === 403 || httpStatus === 451 ? "access_denied"
    : httpStatus === 404 || httpStatus === 410 ? "unavailable" : httpStatus && httpStatus >= 400 ? "http"
    : /key|licen[cs]e|drm|encrypted/i.test(rawMessage) ? "drm"
    : /parsing|parse|no streams/i.test(rawMessage) ? "manifest"
    : /capability|codec|unsupported/i.test(rawMessage) ? "incompatible"
    : /download|load|network/i.test(rawMessage) ? "network_cors" : "media";
  return { category, stage: /manifest|mpd/i.test(rawMessage) ? "manifest" : /fragment|segment/i.test(rawMessage) ? "segment" : "unknown",
    httpStatus, type: "DashError", details: `dashError_${code ?? "unknown"}`, fatal: true, rawMessage,
    resourceUrl: error?.data?.request?.url || error?.data?.url || e.event?.url || streamUrl,
    message: httpStatus ? `HTTP ${httpStatus}: errore della fonte DASH. La causa della restrizione non è confermata.`
      : category === "network_cors" ? "Errore di caricamento DASH: possibile rete/CORS; il browser non permette una diagnosi certa."
      : category === "drm" ? "La fonte DASH richiede DRM/licenza. Usa il player ufficiale."
      : `Errore DASH: ${rawMessage}` };
}

export function hasDashProtection(value: unknown, visited = new WeakSet<object>()): boolean {
  if (!value || typeof value !== "object" || visited.has(value)) return false;
  visited.add(value);
  return Object.entries(value).some(([key, child]) =>
    /^ContentProtection(?:_asArray)?$/.test(key) && child !== null && typeof child === "object" && Object.keys(child).length > 0
    || hasDashProtection(child, visited));
}
