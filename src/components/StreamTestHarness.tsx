"use client";

import { useEffect, useState } from "react";
import { TvPlayer } from "@/components/TvPlayer";
import { COUNTRIES } from "@/lib/countries";
import { clearTests, getTestLog, setTesterLocation } from "@/lib/test-log";
import type { StreamTestBridge } from "@/lib/stream-automation";
import type { ChannelApiResponse, CountryCode, TvChannel } from "@/types/tv";

// Local-only adapter for scripts/test-streams.mjs. Keep its browser protocol
// independent of the public UI so catalog reviews survive design changes.
export function StreamTestHarness() {
  const [country, setCountry] = useState<CountryCode>("IT");
  const [catalog, setCatalog] = useState<ChannelApiResponse | null>(null);
  const [error, setError] = useState("");
  const [selection, setSelection] = useState<{ channel: TvChannel; testId: string; attempt: number } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/channels?country=${country}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Catalog unavailable");
        return response.json() as Promise<ChannelApiResponse>;
      })
      .then(data => { if (!controller.signal.aborted) setCatalog(data); })
      .catch(caught => { if (!controller.signal.aborted) setError(String(caught)); });
    return () => controller.abort();
  }, [country]);

  useEffect(() => {
    const bridge: StreamTestBridge = {
      catalog, error,
      setCountry(code) {
        if (!COUNTRIES.some(item => item.code === code)) throw new Error("Unsupported country");
        if (code !== country) { setCatalog(null); setError(""); setSelection(null); setCountry(code); }
      },
      setLocation: setTesterLocation,
      select(id, url, testId) {
        const channel = catalog?.channels.find(item => item.id === id);
        const stream = channel?.streams.find(item => item.url === url);
        if (!channel || !stream || !testId) throw new Error("Source absent from catalog");
        setSelection(previous => ({ channel: { ...channel, stream }, testId, attempt: (previous?.attempt ?? 0) + 1 }));
      },
      stop: () => setSelection(null),
      discardRecords: clearTests,
      sample(id) {
        const record = getTestLog().records.find(item => item.id === id) ?? null;
        const video = selection?.testId === id ? document.querySelector("video") : null;
        return { record, video: video ? {
          at: performance.now(), currentTime: video.currentTime,
          frames: video.getVideoPlaybackQuality?.().totalVideoFrames ?? null,
          width: video.videoWidth, paused: video.paused, readyState: video.readyState,
        } : null };
      },
    };
    window.worldTvTester = bridge;
    return () => { if (window.worldTvTester === bridge) delete window.worldTvTester; };
  }, [catalog, country, error, selection]);

  return <main data-stream-test-harness>
    {selection && <TvPlayer key={`${selection.testId}-${selection.attempt}`} channel={selection.channel}
      testId={selection.testId} muted onRetry={() => {}} onFailure={() => {}} />}
  </main>;
}
