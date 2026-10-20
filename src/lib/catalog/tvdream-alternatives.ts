import type { CatalogSource, TvChannel, TvStream } from "@/types/tv";

// Only channels classified as uncertain in the saved reports on 2026-09-17.
// HTTP 200 and an HLS manifest were observed; browser playback is a separate test.
export const TVDREAM_ALTERNATIVES: {
  channelIds: string[]; name: string; url: string; page: string; playerPage: string; format?: "hls" | "embed";
}[] = [
  {
    channelIds: ["catalog:IT:supertvoristanonot247"],
    name: "Super TV Oristano",
    url: "https://video2.azotosolutions.com:1936/supertvoristano/supertvoristano/playlist.m3u8",
    page: "https://www.tvdream.net/web-tv/super-tv-oristano/",
    playerPage: "https://www.supertvoristano.it/",
  },
  {
    channelIds: ["catalog:IT:teleregionecolor"],
    name: "Teleregione Color",
    url: "https://live-antennasud.cdn.netrw.it/antennasud/hls/ccr/teleregione/master.m3u8",
    page: "https://www.tvdream.net/web-tv/teleregione-color/",
    playerPage: "https://stream.antennasudwebtv.it:9443/tr.html",
  },
  {
    channelIds: ["TeleVenezia.it"],
    name: "TeleVenezia",
    url: "https://59d7d6f47d7fc.streamlock.net/televenezia/televenezia.stream/playlist.m3u8",
    page: "https://www.tvdream.net/web-tv/televenezia-diretta-streaming/",
    playerPage: "https://player.streamshow.it/hosted/televenezia.php?autoplay=false&muted=false&posterimage=",
  },
  {
    channelIds: ["TrentinoTV.it", "catalog:IT:trentinotvnot247"],
    name: "Trentino TV",
    url: "https://tntv.fluid.stream/TrentinoTV/livestream/playlist.m3u8?FLID=1",
    page: "https://www.tvdream.net/web-tv/trentino-tv/",
    playerPage: "https://www.trentinotv.it/live.php",
  },
  {
    channelIds: ["tv9Telemaremma.it"],
    name: "TV9 Telemaremma",
    url: "https://view.dacast.com/76305317bd6d5f2af13478c9b0ef4aef-live-6339ee65498e3ca8e75590daa7e447f5/adaptive.m3u8",
    page: "https://www.tvdream.net/web-tv/tv9-telemaremma/",
    playerPage: "https://www.tv9italia.it/diretta/",
  },
  {
    channelIds: ["Videolina.it", "VideolinaSardegna.it", "catalog:IT:videolinasardegnanot247"],
    name: "Videolina",
    url: "https://geo.dailymotion.com/player/x1jo48.html?video=k5IzEKA6K34xZiEXbVm",
    page: "https://www.tvdream.net/web-tv/videolina/",
    playerPage: "https://www.videolina.it/live",
    format: "embed",
  },
];

export function addTvDreamAlternatives(channels: TvChannel[]): number {
  let added = 0;
  for (const alternative of TVDREAM_ALTERNATIVES) {
    for (const channel of channels.filter(c => c.country === "IT" && alternative.channelIds.includes(c.id))) {
      const sources: CatalogSource[] = [
        { id: `tvdream:${channel.id}`, name: `TVdream · ${alternative.name}`, url: alternative.page },
        { id: `tvdream-player:${channel.id}`, name: `${alternative.name} · pagina del player`, url: alternative.playerPage },
      ];
      let stream = channel.streams.find(s => s.url === alternative.url);
      if (stream) {
        for (const source of sources) if (!stream.sources.some(s => s.id === source.id)) stream.sources.push(source);
      } else {
        stream = { url: alternative.url, title: alternative.name, quality: null, label: "Alternativa trovata tramite TVdream · da verificare",
          needsVerification: true, requiresHeaders: false, sources, format: alternative.format ?? "hls", restriction: null, geography: channel.geography } satisfies TvStream;
        channel.streams.unshift(stream);
        added++;
      }
      channel.streams = [stream, ...channel.streams.filter(s => s !== stream)];
      channel.stream = stream;
      channel.alternativeStreams = channel.streams.length - 1;
    }
  }
  return added;
}
