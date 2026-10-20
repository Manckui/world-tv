"use client";

import { geoContains } from "d3-geo";
import type { FeatureCollection } from "geojson";
import { useCallback, useMemo, useRef, useState } from "react";
import { isRegional, matchesSearch, normalize, type CatalogTab, type MapLocation, type NavigationTab } from "@/lib/orbita-catalog";
import type { MapCountry } from "@/lib/map-countries";
import type { TvChannel } from "@/types/tv";
import { countryName } from "@/lib/i18n";
import { LocaleProvider, useLocale } from "./LocaleProvider";
import { ChannelList } from "./ChannelList";
import { Icon, type IconName } from "./Icon";
import { PlayerPanel } from "./PlayerPanel";
import { WorldMap } from "./WorldMap";
import { useCatalog } from "./useCatalog";
import { useFavorites } from "./useFavorites";
import s from "./Orbita.module.scss";

const navigation: { id: NavigationTab; label: string; mobileLabel: string; icon: IconName }[] = [
  { id: "map", label: "Esplora", mobileLabel: "Mappa", icon: "globe" },
  { id: "channels", label: "Canali", mobileLabel: "Canali", icon: "list" },
  { id: "favorites", label: "Preferiti", mobileLabel: "Preferiti", icon: "heart" },
];

export function OrbitaExplorer({ countries }: { countries: MapCountry[] }) {
  return <LocaleProvider><Explorer countries={countries} /></LocaleProvider>;
}

function Explorer({ countries: availableCountries }: { countries: MapCountry[] }) {
  const { locale, setLocale, t } = useLocale();
  const countries = useMemo(() => availableCountries.map(country => ({
    ...country, name: countryName(country.code, locale),
  })), [availableCountries, locale]);
  const favorites = useFavorites();
  const [location, setLocation] = useState<MapLocation>({ level: "world", countryCode: "IT" });
  const country = countries.find(country => country.code === location.countryCode) ?? countries[0];
  const regions = country.regions;
  const { channels, loading, error, retry } = useCatalog(country.code);
  const [nav, setNav] = useState<NavigationTab>("map");
  const [tab, setTab] = useState<CatalogTab>("all");
  const [query, setQuery] = useState("");
  const [chosenChannel, setSelected] = useState<TvChannel | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [countryDraw, setCountryDraw] = useState(0);
  // Draw once per country selection, keeping the choice stable during renders
  // and catalog loading. Official embeds may require Play, so use direct streams.
  const nationalChannels = channels.filter(channel => channel.geography.scope === "national"
    && ["hls", "dash"].includes(channel.stream.format) && !channel.stream.restriction && !channel.stream.requiresHeaders);
  const verifiedNationals = nationalChannels.filter(channel => !channel.stream.needsVerification);
  const autoPlayPool = verifiedNationals.length ? verifiedNationals : nationalChannels;
  const selected = chosenChannel ?? (autoPlay ? autoPlayPool[Math.floor(countryDraw * autoPlayPool.length)] ?? null : null);
  const [watching, setWatching] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [focusedChannel, setFocusedChannel] = useState<TvChannel | null>(null);
  const [pinChannels, setPinChannels] = useState<TvChannel[] | null>(null);
  const region = regions.find(region => region.code === location.regionCode);
  const world = location.level === "world";
  const inRegion = location.level === "region";
  const regionChannels = useMemo(() => region ? channels.filter(channel => isRegional(channel, region.code)) : [], [channels, region]);
  const regionCounts = useMemo(() => Object.fromEntries(regions.map(region => [region.code, channels.filter(channel => isRegional(channel, region.code)).length])), [channels, regions]);
  const favoriteChannels = channels.filter(channel => favorites.ids.includes(channel.id) || channel.previousIds?.some(id => favorites.ids.includes(id)));
  const scopedChannels = pinChannels ?? (nav === "favorites" ? favoriteChannels : inRegion ? regionChannels
    : tab === "national" ? channels.filter(channel => channel.geography.scope === "national") : channels);
  const visibleChannels = scopedChannels.filter(channel => matchesSearch(channel, query, locale));
  const visibleRegions = regions.filter(region => normalize(region.name).includes(normalize(query)));
  const showRegions = !inRegion && !world && tab === "regions" && nav !== "favorites";
  const currentName = region?.name ?? country.name;
  const randomRequest = useRef(0);

  const navigate = useCallback((next: MapLocation) => {
    randomRequest.current += 1;
    setLocation(previous => ({ ...next, countryCode: next.countryCode ?? previous.countryCode }));
    setNav("map"); setQuery(""); setTab("all");
    setFocusedChannel(null); setPinChannels(null);
    if (next.countryCode) {
      setCountryDraw(Math.random());
      setSelected(null); setAutoPlay(true); setWatching(true); setExpanded(false);
    }
  }, []);
  const closePlayer = useCallback(() => { setWatching(false); setAutoPlay(false); setExpanded(false); }, []);

  async function select(channel: TvChannel) {
    const request = ++randomRequest.current;
    setSelected(channel);
    setWatching(true); setAutoPlay(false);
    let regionCode = channel.geography.regions.find(item => regions.some(region => region.code === item.code))?.code;
    const coordinates = channel.geography.coordinates;
    // Coverage and headquarters may differ, especially for national TV.
    // Prefer the region containing the actual pin, without inventing a location.
    if (coordinates) {
      try {
        const response = await fetch(`/maps/${country.map}.json`);
        if (response.ok) {
          const map = await response.json() as FeatureCollection;
          regionCode = map.features.find(feature => geoContains(feature, [coordinates.lon, coordinates.lat]))?.properties?.code ?? regionCode;
        }
      } catch { /* The catalog region remains usable when the map is offline. */ }
    }
    if (request !== randomRequest.current) return;
    setLocation({ level: regionCode ? "region" : "country", countryCode: country.code, regionCode });
    setFocusedChannel(channel); setPinChannels(null); setQuery(""); setNav("map"); setTab("all");
  }
  function random() {
    const pool = scopedChannels.filter(channel => channel.id !== selected?.id);
    const channel = pool[Math.floor(Math.random() * pool.length)] ?? scopedChannels[0];
    if (channel) void select(channel);
  }
  function selectPin(group: TvChannel[]) {
    if (group.length === 1) { select(group[0]); return; }
    closePlayer(); setPinChannels(group); setQuery(""); setNav("channels");
  }
  function changeNav(next: NavigationTab) {
    setNav(next); setQuery(""); setPinChannels(null); closePlayer();
    if (next === "channels" && world) setTab("all");
  }

  const listContent = <>
    {loading ? <div className={s.empty} role="status"><span className={s.loadingDot} /><h3>{t("Arriviamo in {name}.", { name: country.name })}</h3><p>{t("Stiamo caricando le emittenti.")}</p></div>
      : error ? <div className={s.empty} role="alert"><h3>{t("Un attimo di pausa.")}</h3><p>{t(error)}</p><button className={s.primaryButton} onClick={retry}>{t("Riprova")} <Icon name="arrow" /></button></div>
      : showRegions ? <ul className={s.regionList}>
        {visibleRegions.map(item => <li key={item.code}><button onClick={() => navigate({ level: "region", regionCode: item.code })}>
          <span><strong>{item.name}</strong><small>{regionCounts[item.code] ? t("{count} TV del territorio", { count: regionCounts[item.code] }) : t("Nessun canale disponibile")}</small></span><Icon name="arrow" />
        </button></li>)}
        {!visibleRegions.length && <li className={s.empty}><h3>{t("Nessuna regione trovata.")}</h3><button className={s.textButton} onClick={() => setQuery("")}>{t("Cancella la ricerca")}</button></li>}
      </ul> : visibleChannels.length ? <ChannelList channels={visibleChannels} favorites={favorites.ids} onSelect={select} onToggle={favorites.toggle} selectedId={selected?.id} />
        : <div className={s.empty}>
          <Icon name={nav === "favorites" ? "heart" : "globe"} width={40} height={40} />
          <h3>{t(query ? "Nessun risultato, per ora." : nav === "favorites" ? "I tuoi posti preferiti." : inRegion ? "Qui c’è ancora da scoprire." : "Nessuna TV disponibile.")}</h3>
          <p>{t(query ? "Prova il nome di un’altra TV o di una città." : nav === "favorites" ? "Tocca il cuore accanto a una TV. La ritroverai qui, anche al prossimo viaggio." : inRegion ? "Non abbiamo ancora canali per {name}. Esplora un’altra regione oppure guarda le TV nazionali." : "Riprova a caricare il catalogo.", { name: currentName })}</p>
          <button className={s.primaryButton} onClick={() => {
            if (query) setQuery("");
            else { navigate({ level: "country" }); setNav("channels"); setTab("national"); }
          }}>{query ? t("Cancella la ricerca") : t("Esplora le TV: {name}", { name: country.name })} <Icon name="arrow" /></button>
        </div>}
  </>;

  return <main className={`${s.app} ${nav !== "map" ? s.showPanel : ""} ${watching && selected ? s.watching : ""} ${expanded ? s.expanded : ""}`}>
    <a className={s.skipLink} href="#channel-browser" onClick={() => changeNav("channels")}>{t("Vai all’elenco delle TV")}</a>
    <header className={s.header}>
      <button className={s.brand} aria-label={t("World TV, torna al mondo")} onClick={() => { navigate({ level: "world" }); closePlayer(); }}><Icon name="globe" width={24} height={24} />world tv</button>
      <nav className={s.desktopNav} aria-label={t("Navigazione principale")}>
        {navigation.map(item => <button key={item.id} aria-current={nav === item.id ? "page" : undefined} onClick={() => changeNav(item.id)}>{t(item.label)}</button>)}
      </nav>
      <button id="interface-language" className={s.languageButton}
        aria-label={t("Cambia lingua: {name}", { name: locale === "it" ? "English" : "Italiano" })}
        title={t("Cambia lingua: {name}", { name: locale === "it" ? "English" : "Italiano" })}
        onClick={() => setLocale(locale === "it" ? "en" : "it")}>
        <span aria-hidden="true">{locale === "it" ? "🇮🇹" : "🇬🇧"}</span>
      </button>
      <button className={`${s.iconButton} ${s.mobileFavorite}`} aria-label={t("Apri i preferiti")} onClick={() => changeNav("favorites")}><Icon name="heart" /></button>
    </header>
    <div className={s.explorationBar}>
      <label htmlFor="explore-country">{t("Paese da esplorare")}</label>
      <div className={s.countryField}>
        <select id="explore-country" className={s.countrySelect} value={country.code}
          onChange={event => navigate({ level: "country", countryCode: countries.find(country => country.code === event.target.value)!.code })}>
          {countries.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}
        </select>
        <Icon name="chevronDown" width={16} height={16} />
      </div>
    </div>
    <div className={s.workspace}>
      <section className={s.mapArea} aria-label={t("Esplora la mappa")} inert={expanded && watching}>
        <WorldMap key={`${country.code}-${location.level}-${location.regionCode ?? ""}-${focusedChannel?.id ?? ""}`} countries={countries} country={country} location={location} channels={regionChannels} focusedChannel={focusedChannel} regionCounts={regionCounts} onNavigate={navigate} onSelectPin={selectPin} />
        <div className={`${s.mapIntro} ${!world ? s.countryIntro : ""}`}>
          {!world && <nav className={s.breadcrumb} aria-label={t("Percorso geografico")}>
            <button onClick={() => navigate({ level: "world" })}>{t("Mondo")}</button><span>/</span>
            {inRegion ? <><button onClick={() => navigate({ level: "country" })}>{country.name}</button><span>/</span><span aria-current="page">{currentName}</span></> : <span aria-current="page">{country.name}</span>}
          </nav>}
          <h1>{world ? <span className={s.worldHeading}>{t("Accendi la TV")}<br />{t("di un altro posto.")}</span> : currentName}</h1>
          <p className={world ? s.expansionNote : undefined}>{world ? t("Nuovi paesi da tutto il mondo, un po’ alla volta.") : inRegion ? <>{t("Le voci e le storie")}<br />{t("di questo territorio.")}</> : <>{t("Avvicinati alle")}<br />{t("storie locali.")}</>}</p>
        </div>
        <div className={s.mapFooter}>
          <p>{world ? <>{t("Avvicinati a un Paese.")}<br />{t("Scopri le sue regioni.")}</> : t(inRegion ? "Scegli un punto sulla mappa o una TV nell’elenco." : "Scegli una regione. Ogni posto ha qualcosa da raccontare.")}</p>
          <button className={s.randomButton} onClick={random} disabled={loading || !scopedChannels.length}>{t("Sorprendimi")} <Icon name="shuffle" /></button>
          <small>{t("Ora in esplorazione: {name}", { name: country.name })}</small>
        </div>
        {inRegion && regionChannels.length > 0 && <div className={s.mobileRegionChannels}>
          <header><h2>{t("Canali in {name}", { name: currentName })}</h2><button className={s.textButton} aria-label={t("Apri elenco TV {name}", { name: currentName })} onClick={() => changeNav("channels")}>{t("Tutti")} <Icon name="arrow" /></button></header>
          <div className={s.results} tabIndex={0} aria-label={t("Canali in {name}", { name: currentName })}><ChannelList channels={regionChannels} favorites={favorites.ids} onSelect={select} onToggle={favorites.toggle} selectedId={selected?.id} /></div>
        </div>}
        {(!inRegion || !regionChannels.length) && <div className={s.mobileSummary}>
          <div><strong>{currentName}</strong><span>{loading ? t("Caricamento…") : inRegion ? t("{count} TV del territorio", { count: regionChannels.length }) : t("Esplora le regioni e le TV nazionali")}</span></div>
          <button aria-label={t(inRegion ? "Apri elenco TV {name}" : "Apri elenco regioni {name}", { name: currentName })} onClick={() => changeNav("channels")}><Icon name="list" /></button>
        </div>}
      </section>
      <aside id="channel-browser" className={s.sidebar} aria-label={t("Esplora le TV")} tabIndex={-1}>
        <div className={s.sidebarHeading}>
          <h2>{pinChannels ? pinChannels[0].geography.city ?? currentName : nav === "favorites" ? t("Preferiti") : inRegion ? currentName : showRegions ? country.code === "IT" ? t("Esplora l’Italia") : t("Esplora {name}", { name: country.name }) : t("Le TV: {name}", { name: country.name })}</h2>
          {nav === "favorites" && <p>{t("I tuoi canali in {name}.", { name: country.name })}</p>}
          {inRegion && nav !== "favorites" && <p>{t("{count} TV del territorio", { count: pinChannels?.length ?? regionChannels.length })}</p>}
          <button className={`${s.iconButton} ${s.closePanel}`} aria-label={t("Torna alla mappa")} onClick={() => changeNav("map")}><Icon name="close" /></button>
        </div>
        {watching && selected && <div className={expanded ? s.playerArea : s.dockedPlayer}>
          <PlayerPanel key={selected.id} channel={selected} favorite={favorites.ids.includes(selected.id)} onToggle={favorites.toggle}
            compact={!expanded} muted={autoPlay} onClose={closePlayer} expanded={expanded} onExpand={() => setExpanded(value => !value)} />
        </div>}
          <label className={s.search}><Icon name="search" /><input aria-label={t(showRegions ? "Cerca una regione" : "Cerca una TV o una città")} placeholder={t(showRegions ? "Cerca una regione" : "Cerca una TV o una città")} value={query} onChange={event => setQuery(event.target.value)} />{query && <button aria-label={t("Cancella ricerca")} onClick={() => setQuery("")}><Icon name="close" width={16} height={16} /></button>}</label>
          {!inRegion && nav !== "favorites" && <div className={s.tabs} role="group" aria-label={t("Filtra il catalogo")}>
            {(["regions", "national", "all"] as const).map(value => <button key={value} aria-pressed={tab === value} onClick={() => { setTab(value); setQuery(""); if (world && value === "regions") setLocation(previous => ({ ...previous, level: "country" })); }}>
              {t({ regions: "Regioni", national: "TV nazionali", all: "Tutte" }[value])}
            </button>)}
          </div>}
          {inRegion && nav !== "favorites" && <button className={s.textButton} onClick={() => { navigate({ level: "country" }); setNav("channels"); }}><Icon name="back" /> {t("Altre regioni")}</button>}
          {pinChannels && <button className={s.textButton} onClick={() => setPinChannels(null)}>{t("Tutti i canali della regione")}</button>}
          <div className={s.results} tabIndex={0} aria-label={t("Elenco canali e regioni")} aria-live="polite">{listContent}</div>
          {showRegions && <p className={s.catalogNote}>{t("Le TV nazionali sono raccolte nella scheda dedicata al Paese.")}</p>}
        {favorites.error && <p className={s.catalogNote} role="status">{t(favorites.error)}</p>}
        <footer className={s.sidebarFooter}><span>{t("Un Paese alla volta.")}</span></footer>
      </aside>
    </div>
    <nav className={s.mobileNav} aria-label={t("Navigazione mobile")}>
      {navigation.map(item => <button key={item.id} aria-current={nav === item.id && !watching ? "page" : undefined} onClick={() => changeNav(item.id)}><Icon name={item.icon} /><span>{t(item.mobileLabel)}</span></button>)}
    </nav>
  </main>;
}
