import type { TvChannel, TvStream } from "@/types/tv";

// Public URLs actually published by the broadcaster; playback must be tested separately.
export type OfficialAlternative = {
  channelIds: string[];
  name: string;
  page: string;
  url: string;
  format: "hls" | "dash" | "embed";
};

export const OFFICIAL_ALTERNATIVES: OfficialAlternative[] = [
  {
    "channelIds": [
      "catalog:IT:cremona1"
    ],
    "name": "Cremona 1",
    "page": "https://cr1.it/",
    "url": "https://cdn2.streamshow.it/cloud-cremona1/cremona1/playlist.m3u8?uid=7548-1",
    "format": "hls"
  },
  {
    "channelIds": [
      "GOTVCanale163.it"
    ],
    "name": "GO-TV Canale 163",
    "page": "https://www.go-tv.org/it/",
    "url": "https://64b16f23efbee.streamlock.net/gooo/gooo/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "catalog:IT:ideaplus"
    ],
    "name": "Idea Plus",
    "page": "https://www.ideaplustv.com/",
    "url": "https://rst2.saiuzwebnetwork.it:8081/ideaplus/index.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "La7Cinema.it"
    ],
    "name": "La7 Cinema",
    "page": "https://www.la7.it/la7cinema",
    "url": "https://stream.la7.it/out/v1/fe849af8150c4c51889b15dadc717774/index.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "catalog:IT:news24city"
    ],
    "name": "News24 City",
    "page": "https://news24.city/",
    "url": "https://news24.telesveva.com/hls/news24.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "OttoChannel.it"
    ],
    "name": "Otto Channel",
    "page": "https://www.ottochannel.tv/diretta-live/",
    "url": "https://load-balancer.azotosolutions.com/cdnedge/smil:live.smil/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "PassioneLotto.it"
    ],
    "name": "Passione Lotto",
    "page": "https://www.passionelotto.com/",
    "url": "https://5dcabf026b188.streamlock.net/livevideo2/livestream/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "catalog:IT:primantennatorino"
    ],
    "name": "Primantenna Torino",
    "page": "https://www.primantenna.tv/",
    "url": "https://64b16f23efbee.streamlock.net/primantenna14/primantenna14/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "PrimAntennaTV.it"
    ],
    "name": "PrimAntenna TV",
    "page": "https://www.primantenna.tv/",
    "url": "https://64b16f23efbee.streamlock.net/primantenna14/primantenna14/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "catalog:IT:retemianot247"
    ],
    "name": "Retemia",
    "page": "https://www.retemia.eu/come-guardare-retemia/",
    "url": "https://5db313b643fd8.streamlock.net/rete/rete/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "STEuropeChannel.it"
    ],
    "name": "ST Europe Channel",
    "page": "https://www.globusmagazine.it/st-europe-channel-radiotelevision/",
    "url": "https://cdn.cubws.com/live/steurope.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "SuperTVOristano.it"
    ],
    "name": "Super TV Oristano",
    "page": "http://www.supertvoristano.it/diretta-tv/",
    "url": "https://video2.azotosolutions.com:1936/supertvoristano/supertvoristano/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "T9.it"
    ],
    "name": "T9",
    "page": "https://www.grupposciscione.it/t9-2/",
    "url": "https://5f11919dca3bd.streamlock.net/tnove/_definst_/tnove/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "TeleCostaSmeralda.it"
    ],
    "name": "Tele Costa Smeralda",
    "page": "http://www.telecostasmeralda.tv/",
    "url": "https://5bb65e9de3fdf.streamlock.net/live/TCS/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "catalog:IT:teleradioorte"
    ],
    "name": "Tele Radio Orte",
    "page": "https://www.teleorte.it/",
    "url": "https://stream10.xdevel.com/video0s977516-2077/stream/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "catalog:IT:teletutto"
    ],
    "name": "Tele Tutto",
    "page": "https://www.teletutto.it/",
    "url": "https://3177cee185284d2990021eccc8b06ae6.msvdn.net/live/S55287570/tq6PELOcQoAf/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "catalog:IT:teletutto2"
    ],
    "name": "Tele Tutto 2",
    "page": "https://www.teletutto.it/in_diretta/12550.html",
    "url": "https://3177cee185284d2990021eccc8b06ae6.msvdn.net/live/S75141837/T3wd5WoxAo4B/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "catalog:IT:teletutto24"
    ],
    "name": "Tele Tutto 24",
    "page": "https://www.teletutto.it/in_diretta/12556.html",
    "url": "https://3177cee185284d2990021eccc8b06ae6.msvdn.net/live/S64637685/c2e0XXmwILE9/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "catalog:IT:teleambiente"
    ],
    "name": "TeleAmbiente",
    "page": "https://teleambiente.tv/diretta-streaming/",
    "url": "https://64b16f23efbee.streamlock.net/teleambiente3/teleambiente3/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "catalog:IT:telecampione"
    ],
    "name": "Telecampione",
    "page": "https://www.publirose.it/streaming-telecampione/",
    "url": "https://64b16f23efbee.streamlock.net/telecampione/telecampione/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "catalog:IT:telecittapadova"
    ],
    "name": "Telecittà Padova",
    "page": "https://www.telecitta.tv/diretta-web-telecitta/",
    "url": "https://soobeat.fluid.stream/Telecitta/livestream/playlist.m3u8?FLID=2&type=.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "Telejato.it"
    ],
    "name": "Telejato",
    "page": "https://www.telejato.it/",
    "url": "https://648026e87a75e.streamlock.net/telejato/telejato/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "Telenord.it"
    ],
    "name": "Telenord",
    "page": "https://telenord.it/",
    "url": "https://64b16f23efbee.streamlock.net/telenord/telenord/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "catalog:IT:telenordnot247"
    ],
    "name": "Telenord",
    "page": "https://telenord.it/",
    "url": "https://64b16f23efbee.streamlock.net/telenord/telenord/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "Telepavia.it"
    ],
    "name": "Telepavia",
    "page": "https://www.milanopavia.tv/diretta-tv-milanopaviatv",
    "url": "https://load-balancer.azotosolutions.com/cdnedge42/milanopaviatv-sito/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "Teleregione.it"
    ],
    "name": "Teleregione",
    "page": "https://www.teleregionecolor.com/teleregione-live-stream/",
    "url": "https://live-antennasud.cdn.netrw.it/antennasud/hls/ccr/teleregione/master.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "Televallo.it"
    ],
    "name": "Televallo",
    "page": "https://www.televallo.it/",
    "url": "https://64b16f23efbee.streamlock.net/televallo/televallo/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "catalog:IT:tvcampiflegrei"
    ],
    "name": "Tv Campi Flegrei",
    "page": "https://www.tvcampiflegrei.it/",
    "url": "https://rst2.saiuzwebnetwork.it:8081/campiflegreitv/index.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "catalog:IT:tvrxenon"
    ],
    "name": "Tvr Xenon",
    "page": "https://www.tvrxenon.it/diretta-tv/",
    "url": "https://load-balancer.azotosolutions.com/cdnedge4/smil:live4.smil/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "TVRS.it"
    ],
    "name": "TVRS",
    "page": "https://www.tvrs.it/",
    "url": "https://cdn8.streamshow.it/cloud-tvrs/tvrs/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "catalog:IT:tvrsnot247"
    ],
    "name": "TVRS",
    "page": "https://www.tvrs.it/",
    "url": "https://cdn8.streamshow.it/cloud-tvrs/tvrs/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "catalog:IT:veratvnot247"
    ],
    "name": "Vera TV",
    "page": "https://veratv.it/diretta-tv?secondmenu=diretta-tv",
    "url": "https://cdn9.streamshow.it/cloud-veratv/veratv/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "WeddingTV.it"
    ],
    "name": "Wedding TV",
    "page": "https://www.weddingtv.it/",
    "url": "https://604e46ac2bdee.streamlock.net:1936/marcorenzi/marcorenzi/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "ZerounoTVMusic.it"
    ],
    "name": "Zerouno TV Music",
    "page": "https://www.zerounotv.it/",
    "url": "https://64b16f23efbee.streamlock.net/zerounotvmusic/zerounotvmusic/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "catalog:IT:telereporter"
    ],
    "name": "Telereporter",
    "page": "https://www.publirose.it/streaming-telereporter/",
    "url": "https://64b16f23efbee.streamlock.net/telereporter/telereporter/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "catalog:IT:italia8prestige"
    ],
    "name": "Italia 8 Prestige",
    "page": "https://www.publirose.it/diretta-italia8prestige/",
    "url": "https://64b16f23efbee.streamlock.net/italia8prestige/italia8prestige/playlist.m3u8",
    "format": "hls"
  },
  {
    "channelIds": [
      "TCI.it"
    ],
    "name": "TCI",
    "page": "https://www.tci-italia.it/",
    "url": "https://cdn.jwplayer.com/players/9G7uKMZf-QWoLnH32.html",
    "format": "embed"
  },
  {
    "channelIds": [
      "catalog:IT:telegranducato"
    ],
    "name": "Telegranducato",
    "page": "https://www.telegranducato.it/live-tv/",
    "url": "https://www.telegranducato.com/VOD/tv/",
    "format": "embed"
  },
  {
    "channelIds": [
      "catalog:IT:videotouringtv"
    ],
    "name": "Video Touring",
    "page": "https://progettotouring.it/videotouring/",
    "url": "https://restreamer.auranex.cloud/26878d5b-7de5-431e-ac9b-a7f03ad4ad7b.html",
    "format": "embed"
  },
  {
    "channelIds": [
      "Sardegna1.it"
    ],
    "name": "Sardegna 1",
    "page": "https://sardegna1.it/live/diretta-live/",
    "url": "https://geo.dailymotion.com/player/x1jr3i.html?video=x893du6",
    "format": "embed"
  }
];

// Researched sources (data/alternatives/<country>.json) are applied after the hand-reviewed list.
export function addOfficialAlternatives(channels: TvChannel[], researched: OfficialAlternative[] = []): number {
  let added = 0;
  for (const alternative of [...OFFICIAL_ALTERNATIVES, ...researched]) {
    for (const channel of channels.filter(c => alternative.channelIds.includes(c.id))) {
      const source = { id: `official-alternative:${channel.id}`, name: `${alternative.name} · player ufficiale`, url: alternative.page };
      let stream = channel.streams.find(s => s.url === alternative.url);
      if (stream) {
        if (!stream.sources.some(s => s.id === source.id)) stream.sources.push(source);
      } else {
        stream = { url: alternative.url, title: alternative.name, quality: null, label: null, needsVerification: true,
          requiresHeaders: false, sources: [source], format: alternative.format, restriction: null, geography: channel.geography } satisfies TvStream;
        channel.streams.unshift(stream);
        added++;
      }
      channel.streams = [stream, ...channel.streams.filter(s => s !== stream)];
      channel.stream = stream;
      channel.website = alternative.page;
      channel.alternativeStreams = channel.streams.length - 1;
    }
  }
  return added;
}
