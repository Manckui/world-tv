import type { ChannelApiResponse, CountryCode, PlaybackTest } from "@/types/tv";

export type VideoSample = {
  at: number;
  currentTime: number;
  frames: number | null;
  width: number;
  paused: boolean;
  readyState: number;
};

// Only exposed in the explicitly requested ?stream-test=1 browser session.
export type StreamTestBridge = {
  catalog: ChannelApiResponse | null;
  error: string;
  setCountry: (country: CountryCode) => void;
  setLocation: (location: string) => void;
  select: (channelId: string, url: string, attemptId: string) => void;
  stop: () => void;
  discardRecords: () => void;
  sample: (attemptId: string) => { record: PlaybackTest | null; video: VideoSample | null };
};

declare global {
  interface Window {
    worldTvTester?: StreamTestBridge;
  }
}

export const subscribeAutomationMode = () => () => {};
export const getServerAutomationMode = () => false;
export const getAutomationMode = () => new URLSearchParams(window.location.search).get("stream-test") === "1";
