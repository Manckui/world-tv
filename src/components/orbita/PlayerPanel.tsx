"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { getServerTestLog, getTestLog, subscribeTestLog } from "@/lib/test-log";
import { channelLocation } from "@/lib/orbita-catalog";
import type { TvChannel } from "@/types/tv";
import { FavoriteButton } from "./ChannelList";
import { Icon } from "./Icon";
import { useLocale } from "./LocaleProvider";
import s from "./Orbita.module.scss";

// Load playback engines only after a country or channel is selected.
const TvPlayer = dynamic(() => import("@/components/TvPlayer").then(module => module.TvPlayer), {
  ssr: false, loading: PlayerLoading,
});

function PlayerLoading() {
  const { t } = useLocale();
  return <div className={s.playerLoading} role="status">{t("Prepariamo la diretta…")}</div>;
}

export function PlayerPanel({ channel, favorite, onToggle, onClose, expanded, onExpand, compact = false, muted = false }: {
  channel: TvChannel; favorite: boolean; onToggle: (id: string) => void;
  onClose: () => void; expanded: boolean; onExpand: () => void;
  compact?: boolean; muted?: boolean;
}) {
  const { locale, t } = useLocale();
  const { preferredSources } = useSyncExternalStore(subscribeTestLog, getTestLog, getServerTestLog);
  const [sourceIndex, setSourceIndex] = useState(() => Math.max(0, channel.streams.findIndex(stream => stream.url === preferredSources[channel.id])));
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  // Sources already tried in this automatic round: each one is tried once, then the error is shown.
  const tried = useRef(new Set([sourceIndex]));
  const closeRef = useRef<HTMLButtonElement>(null);
  const activeChannel = useMemo(() => ({ ...channel, stream: channel.streams[sourceIndex] ?? channel.stream }), [channel, sourceIndex]);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!muted) closeRef.current?.focus({ preventScroll: true });
    return () => previous?.focus({ preventScroll: true });
  }, [muted]);

  useEffect(() => {
    function close(event: KeyboardEvent) { if (event.key === "Escape") onClose(); }
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  function playable(index: number) {
    const stream = channel.streams[index];
    return Boolean(stream) && !stream.restriction && stream.format !== "external";
  }

  // A dead first source must not make the channel look broken: move on to the next untried source.
  function failure() {
    const next = channel.streams.findIndex((_, index) => !tried.current.has(index) && playable(index));
    if (next < 0) { setFailed(true); return; }
    tried.current.add(next);
    setSourceIndex(next);
    setAttempt(value => value + 1);
  }

  function retry() {
    // Manual retry after every source failed: start a new round from the next source.
    if (failed) {
      const next = (sourceIndex + 1) % Math.max(1, channel.streams.length);
      tried.current = new Set([next]);
      setSourceIndex(next);
    }
    setFailed(false);
    setAttempt(value => value + 1);
  }

  return <section className={`${s.player} ${compact ? s.compactPlayer : ""}`} aria-label={t("Guarda {name}", { name: channel.name })}>
    <div className={s.playerToolbar}>
      <button ref={closeRef} className={s.textButton} onClick={onClose}><Icon name="back" /> {t("Torna a esplorare")}</button>
      <button className={`${s.iconButton} ${s.expandPlayer}`} aria-label={t(expanded ? "Riduci player" : "Allarga player")} onClick={onExpand}><Icon name={expanded ? "close" : "expand"} /></button>
    </div>
    <div className={s.playerTitle}>
      <div><h2>{channel.name}</h2><p>{channelLocation(channel, locale)}</p></div>
      <FavoriteButton channel={channel} favorite={favorite} onToggle={onToggle} />
    </div>
    <TvPlayer key={attempt} channel={activeChannel} 
      muted={muted} locale={locale} onRetry={retry} onFailure={failure} />
    {!compact && <p className={s.playerNote}>{t("Le dirette sono fornite dalle emittenti. Alcune possono richiedere il player ufficiale o essere disponibili solo in determinate aree.")}</p>}
  </section>;
}
