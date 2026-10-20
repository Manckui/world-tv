"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { getHiddenChannels, getServerHiddenChannels, subscribeHiddenChannels } from "@/lib/hidden-channels";
import type { ChannelApiResponse, CountryCode } from "@/types/tv";

export function useCatalog(country: CountryCode = "IT") {
  const [data, setData] = useState<ChannelApiResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [resolvedCountry, setResolvedCountry] = useState<CountryCode | null>(null);
  const hidden = useSyncExternalStore(subscribeHiddenChannels, getHiddenChannels, getServerHiddenChannels);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/channels?country=${country}`, { signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error("Catalogo non disponibile");
        if (!controller.signal.aborted) { setData(payload as ChannelApiResponse); setError(""); }
      } catch {
        if (!controller.signal.aborted) { setData(null); setError("Non riusciamo a caricare le TV di questo Paese. Riprova tra poco."); }
      } finally {
        if (!controller.signal.aborted) { setResolvedCountry(country); setLoading(false); }
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt, country]);

  return {
    // Do not show the previous country's channels while its replacement loads.
    channels: (data?.country.code === country ? data.channels : []).filter(channel => !hidden.channelIds.includes(channel.id)),
    loading: loading || resolvedCountry !== country,
    error: resolvedCountry === country ? error : "",
    retry: () => { setError(""); setLoading(true); setAttempt(value => value + 1); },
  };
}
