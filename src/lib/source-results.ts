import type { PlaybackTest, TvChannel } from "@/types/tv";

export function latestSourceTests(channel: TvChannel, records: PlaybackTest[]): Map<string, PlaybackTest> {
  const latest = new Map<string, PlaybackTest>();
  for (const record of records) {
    if ((record.channelId === channel.id || channel.previousIds?.includes(record.channelId)) && record.country === channel.country) {
      const previous = latest.get(record.streamUrl);
      if (!previous || record.confirmedAt && !previous.confirmedAt) latest.set(record.streamUrl, record);
    }
  }
  return latest;
}

export function channelResult(channel: TvChannel, latest: Map<string, PlaybackTest>) {
  if ([...latest.values()].some(test => test.confirmedAt)) return "playing";
  const tests = channel.streams.map(stream => latest.get(stream.url));
  if (tests.some(test => test?.confirmedAt || test?.outcome === "playing")) return "playing";
  if (tests.some(test => test?.outcome === "loading" || test?.outcome === "ready")) return "loading";
  // Failure of one URL does not imply failure of every alternative of the channel.
  if (tests.every(test => test?.outcome === "failed")) return "failed";
  return "idle";
}

export function nextUntriedSource(channel: TvChannel, current: number, tried: Set<string>): number {
  for (let offset = 1; offset < channel.streams.length; offset++) {
    const index = (current + offset) % channel.streams.length;
    if (!tried.has(channel.streams[index].url)) return index;
  }
  return -1;
}
