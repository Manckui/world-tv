"use client";

import Hls from "hls.js";
import type { MediaPlayerClass } from "dashjs";
import { useEffect, useRef, useState } from "react";
import { classifyDashError, classifyHlsError, classifyMediaError, hasDashProtection } from "@/lib/playback-errors";
import { createTest, saveTest } from "@/lib/test-log";
import type { PlaybackIssue, PlaybackState, PlaybackTest, TestEvent, TvChannel } from "@/types/tv";
import { translate, type Locale } from "@/lib/i18n";

type TvPlayerProps = {
  channel: TvChannel | null;
  onRetry: () => void;
  onFailure: () => void;
  muted?: boolean;
  testId?: string;
  locale?: Locale;
};


// Twitch embeds only play when parent= matches the page host.
function embedUrl(url: string): string {
  const parsed = new URL(url);
  if (parsed.hostname !== "player.twitch.tv" || typeof window === "undefined") return url;
  parsed.searchParams.set("parent", window.location.hostname);
  return parsed.href;
}

export function TvPlayer({ channel, onRetry, onFailure, muted = false, testId, locale = "it" }: TvPlayerProps) {
  const t = (message: string, values?: Record<string, string | number>) => translate(locale, message, values);
  const failureRef = useRef(onFailure);
  useEffect(() => { failureRef.current = onFailure; }, [onFailure]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [, setDetail] = useState("Seleziona una TV dalla lista.");
  const [state, setState] = useState<PlaybackState>("idle");
  const [needsPlay, setNeedsPlay] = useState(false);

  useEffect(() => {
    if (!channel) return;
    if (channel.stream.format === "embed") {
      let record: PlaybackTest | null = null;
      const setup = setTimeout(() => {
        record = createTest(channel, "official-embed");
        if (testId) record.id = testId;
        const at = new Date().toISOString();
        record = { ...record, outcome: "ready", events: [...record.events, {
          at, kind: "ready", message: "Player ufficiale incorporato. Apertura e caricamento non dimostrano la riproduzione: conferma manuale richiesta.", issue: null,
        }] };
        saveTest(record);
        setState("idle");
        setDetail(channel.id === "PlutoTV.it"
          ? "Scegli una diretta nel portale Pluto TV e premi Play. Conferma successo solo dopo aver visto il video funzionare. Se il portale non si apre, usa il sito ufficiale."
          : "Premi Play nel player ufficiale. Se il video funziona, premi Conferma successo.");
      }, 0);
      return () => {
        clearTimeout(setup);
        if (!record) return;
        const at = new Date().toISOString();
        saveTest({ ...record, endedAt: at, outcome: "interrupted", events: [...record.events, {
          at, kind: "interrupted", message: "Player ufficiale chiuso. La riproduzione non è misurata dal POC; un’eventuale conferma manuale resta salvata.", issue: null,
        }] });
      };
    }
    const video = videoRef.current;
    if (!video || !channel) return;

    const src = channel.stream.url;
    let hls: Hls | null = null;
    let dash: MediaPlayerClass | null = null;
    let record: PlaybackTest | null = null;
    let disposed = false;
    let watchdog: ReturnType<typeof setTimeout> | undefined;

    function log(kind: TestEvent["kind"], message: string, outcome?: PlaybackTest["outcome"], issue: PlaybackIssue | null = null) {
      if (!record) return;
      const events = [...record.events, { at: new Date().toISOString(), kind, message, issue }];
      record = { ...record, outcome: outcome ?? record.outcome, lastError: issue ?? record.lastError,
        events: events.slice(-100), omittedEvents: record.omittedEvents + Math.max(0, events.length - 100) };
      saveTest(record);
    }

    function clearWatchdog() { clearTimeout(watchdog); }

    function fail(issue: PlaybackIssue) {
      if (disposed || record?.outcome === "failed") return;
      clearWatchdog();
      log("error", issue.message, "failed", issue);
      setDetail(issue.message);
      setState("failed");
      hls?.stopLoad();
      dash?.reset();
      failureRef.current();
    }

    function armWatchdog() {
      clearWatchdog();
      watchdog = setTimeout(() => fail({ category: "timeout", stage: "unknown", message: "Nessuna riproduzione/progresso osservato per 30 secondi. Possibile lentezza o stream non disponibile; offline non confermato.", rawMessage: "Playback watchdog expired after 30000ms", type: "PlayerTimeout", details: "playbackTimeout", fatal: true, httpStatus: null, resourceUrl: src }), 30_000);
    }

    function setPlaying() {
      if (disposed || record?.outcome === "failed") return;
      clearWatchdog();
      if (record?.outcome !== "playing") log("playing", "Il browser ha emesso l’evento playing: riproduzione avviata, durata e continuità non garantite.", "playing");
      setDetail("Diretta in riproduzione");
      setNeedsPlay(false);
      setState("playing");
    }

    function onEncrypted() { fail({ ...classifyMediaError(null, src), category: "drm", stage: "key", type: "EncryptedMedia", details: "encrypted", message: "Il browser ha rilevato contenuti cifrati che richiedono DRM. Usa il player ufficiale." }); }

    function setFailed() { fail(classifyMediaError(video!.error, src)); }
    function onPause() { clearWatchdog(); }
    function onWaiting() { if (!video!.paused && record?.outcome !== "failed") armWatchdog(); }
    function onProgress() { if (!video!.paused && watchdog && record?.outcome === "playing") armWatchdog(); }
    function onPlay() { if (record?.outcome !== "failed") armWatchdog(); }

    function requestPlay() {
      if (disposed) return;
      void video!.play().catch((error: unknown) => {
        if (disposed || record?.outcome === "failed") return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (error instanceof DOMException && error.name === "NotAllowedError") {
          clearWatchdog();
          log("ready", "Il browser richiede un clic su Play. Non è un fallimento dello stream.", "ready");
          setDetail("Premi Play per verificare la diretta: l’avvio automatico è stato bloccato dal browser.");
          setNeedsPlay(true);
        } else {
          fail({ ...classifyMediaError(video!.error, src), rawMessage: error instanceof Error ? error.message : String(error), details: error instanceof Error ? error.name : "playRejected" });
        }
      });
    }

    // Defer setup so React Strict Mode's effect probe does not create fake attempts.
    const setup = setTimeout(() => {
      void (async () => {
      if (disposed) return;
      const player = channel.stream.restriction || channel.stream.format === "external" ? "unsupported" : channel.stream.format === "dash" ? "dash.js" : Hls.isSupported() ? "hls.js" : video.canPlayType("application/vnd.apple.mpegurl") ? "native" : "unsupported";
      record = createTest(channel, player);
      if (testId) record.id = testId;
      saveTest(record);
      setDetail("Connessione allo stream…");
      setNeedsPlay(false);
      setState("loading");
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.addEventListener("encrypted", onEncrypted);
      video.addEventListener("playing", setPlaying);
      video.addEventListener("error", setFailed);
      video.addEventListener("play", onPlay);
      video.addEventListener("pause", onPause);
      video.addEventListener("waiting", onWaiting);
      video.addEventListener("timeupdate", onProgress);
      if (channel.stream.restriction) {
        fail({ ...classifyMediaError(null, src), category: "incompatible", type: "SourceRequirements", details: "specialHeadersRequired", message: channel.stream.restriction });
      } else if (player === "dash.js") {
        armWatchdog();
        const { MediaPlayer } = await import("dashjs");
        if (disposed || record?.outcome === "failed") return;
        dash = MediaPlayer().create();
        // No account, custom license server, or emulated broadcaster headers.
        dash.updateSettings({ streaming: { protection: { ignoreEmeEncryptedEvent: true } } });
        dash.on(MediaPlayer.events.MANIFEST_LOADED, event => {
          if (!disposed && hasDashProtection(event.data)) {
            fail({ ...classifyMediaError(null, src), category: "drm", stage: "manifest", type: "DashContentProtection", details: "contentProtection", message: "Il manifest DASH dichiara contenuti protetti. Usa il player ufficiale." });
          }
        });
        dash.on(MediaPlayer.events.ERROR, event => { if (!disposed && record?.outcome !== "failed") fail(classifyDashError(event, src)); });
        dash.on(MediaPlayer.events.STREAM_INITIALIZED, () => {
          if (disposed || record?.outcome === "failed") return;
          log("ready", "Manifest DASH analizzato. La riproduzione video deve ancora essere verificata.", "ready");
          requestPlay();
        });
        dash.initialize(video, src, false);
      } else if (player === "hls.js") {
        hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (disposed || record?.outcome === "failed") return;
          log("ready", "Manifest HLS analizzato. La riproduzione video deve ancora essere verificata.", "ready");
          requestPlay();
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (disposed || record?.outcome === "failed") return;
          const issue = classifyHlsError(data);
          if (data.fatal) fail(issue);
          else log("error", `Errore temporaneo: ${issue.message}`, undefined, issue);
        });
        armWatchdog();
        hls.loadSource(src);
        hls.attachMedia(video);
      } else if (player === "native") {
        armWatchdog();
        video.src = src;
        requestPlay();
      } else {
        fail({ ...classifyMediaError(null, src), category: "incompatible", type: "BrowserSupport", details: "hlsUnsupported", message: "Questo browser non supporta HLS nativo né hls.js." });
      }
      })().catch(error => {
        if (!disposed) fail({ ...classifyMediaError(null, src), type: "PlayerSetup", details: "playerSetupError", rawMessage: error instanceof Error ? error.message : String(error), message: "Impossibile inizializzare il player per questa fonte." });
      });
    }, 0);

    return () => {
      disposed = true;
      clearTimeout(setup);
      clearWatchdog();
      if (record) {
        const incomplete = record.outcome === "loading" || record.outcome === "ready";
        log(incomplete ? "interrupted" : "ended", incomplete ? "Test interrotto prima di verificare la riproduzione." : "Tentativo terminato.", incomplete ? "interrupted" : undefined);
        record = { ...record!, endedAt: new Date().toISOString() };
        saveTest(record);
      }
      hls?.destroy();
      dash?.destroy();
      video.removeEventListener("encrypted", onEncrypted);
      video.removeEventListener("playing", setPlaying);
      video.removeEventListener("error", setFailed);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("timeupdate", onProgress);
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [channel, testId]);

  const viewerDetail = channel?.stream.format === "embed"
    ? t("Premi Play nel player ufficiale. Se non parte, apri il sito dell’emittente.")
    : state === "failed"
      ? t("Questa diretta non è disponibile adesso. Riprova o apri il sito ufficiale.")
      : needsPlay ? t("Premi Play per avviare la diretta.")
      : state === "playing" ? t("Diretta in riproduzione") : t("Connessione alla diretta…");

  return (
    <section className="player-panel" aria-label={t("Player TV")}>
      <div className="video-frame">
        {channel?.stream.format === "embed" ? (
          <iframe src={embedUrl(channel.stream.url)} title={t("Diretta ufficiale {name}", { name: channel.name })} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
        ) : channel ? (
          <video ref={videoRef} controls playsInline muted={muted} aria-label={t("Diretta {name}", { name: channel.name })} />
        ) : (
          <div className="video-placeholder">
            <span aria-hidden="true">▶</span>
            <p>{t("Scegli un canale per iniziare")}</p>
          </div>
        )}
      </div>

      <div className="player-status" aria-live="polite">
        <span className={`status-dot ${channel ? state : "idle"}`} />
        <span>{channel ? viewerDetail : t("Seleziona una TV dalla lista.")}</span>
      </div>

      {channel ? <button className="retry-button" type="button" onClick={onRetry}>{t("Riprova")}</button> : null}

      {channel?.website ? (
        <a className="official-link" href={channel.website} target="_blank" rel="noreferrer">
          {t("Apri il sito ufficiale")} ↗
        </a>
      ) : null}
    </section>
  );
}
