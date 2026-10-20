export type CountryCode = "IT" | "ES" | "FR" | "VN" | "JP" | "CL" | "US" | "ZA";

export type CountryOption = { code: CountryCode; name: string; flag: string };

export type TvGeography = {
  regions: { code: string; name: string }[];
  scope: "national" | "regional" | "local" | "foreign" | "unknown";
  // research: broadcaster seat found by web research (data/geography/<country>.json)
  basis: "broadcaster" | "broadcast_area" | "research" | "unknown";
  sourceUrl: string | null;
  city?: string | null;
  province?: string | null;
  // Headquarters city centre, for the map. Approximate.
  coordinates?: { lat: number; lon: number } | null;
  // Country of a foreign broadcaster carried in this catalog (e.g. SM, VA, DE).
  countryCode?: string;
  confidence?: "high" | "medium" | "low";
};

export type TvStream = {
  needsVerification?: boolean;
  url: string;
  title: string | null;
  quality: string | null;
  label: string | null;
  requiresHeaders: boolean;
  sources: CatalogSource[];
  format: "hls" | "dash" | "embed" | "external" | "unknown";
  restriction: string | null;
  geography?: TvGeography;
  feedId?: string | null;
};

export type CatalogSource = { id: string; name: string; url: string };
export type CatalogReport = CatalogSource & { status: "loaded" | "failed"; entries: number; error: string | null };

export type TvChannel = {
  previousIds?: string[];
  id: string;
  name: string;
  country: CountryCode;
  categories: string[];
  website: string | null;
  stream: TvStream;
  streams: TvStream[];
  alternativeStreams: number;
  geography: TvGeography;
};

export type ChannelApiResponse = {
  country: CountryOption;
  catalogTotal: number;
  withStream: number;
  channels: TvChannel[];
  fetchedAt: string;
  sources: CatalogReport[];
  geographyWarnings: string[];
};

export type PlaybackState = "idle" | "loading" | "playing" | "failed";

export type TestOutcome = "loading" | "ready" | "playing" | "failed" | "interrupted";

export type PlaybackIssue = {
  category: "access_denied" | "unavailable" | "http" | "network_cors" | "timeout" | "manifest" | "incompatible" | "media" | "drm" | "unknown";
  stage: "manifest" | "playlist" | "segment" | "key" | "media" | "unknown";
  message: string;
  rawMessage: string;
  type: string;
  details: string;
  fatal: boolean;
  httpStatus: number | null;
  resourceUrl: string | null;
};

export type TestEvent = {
  at: string;
  kind: "started" | "ready" | "playing" | "error" | "interrupted" | "ended";
  message: string;
  issue: PlaybackIssue | null;
};

export type PlaybackTest = {
  id: string;
  channelId: string;
  channelName: string;
  country: CountryCode;
  streamUrl: string;
  streamLabel: string | null;
  requiresHeaders: boolean;
  // Optional for attempts saved before the multi-source catalog was introduced.
  sources?: CatalogSource[];
  streamFormat?: TvStream["format"];
  sourceHost?: string;
  geography?: TvGeography;
  feedId?: string | null;
  startedAt: string;
  endedAt: string | null;
  confirmedAt?: string;
  outcome: TestOutcome;
  lastError: PlaybackIssue | null;
  testerLocation: string;
  userAgent: string;
  timeZone: string;
  player: "hls.js" | "dash.js" | "native" | "official-embed" | "unsupported";
  events: TestEvent[];
  omittedEvents: number;
};
