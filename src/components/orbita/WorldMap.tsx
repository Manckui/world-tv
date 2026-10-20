"use client";

import { geoCentroid, geoDistance, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import type { MapCountry } from "@/lib/map-countries";
import type { MapLocation } from "@/lib/orbita-catalog";
import type { TvChannel } from "@/types/tv";
import { Icon } from "./Icon";
import { useLocale } from "./LocaleProvider";
import s from "./Orbita.module.scss";

type MapData = FeatureCollection<Geometry, { code: string; name: string }>;
const cachedMaps = new Map<string, { world: MapData; regions: MapData }>();
type Props = {
  countries: MapCountry[];
  country: MapCountry;
  location: MapLocation;
  channels: TvChannel[];
  focusedChannel: TvChannel | null;
  regionCounts: Record<string, number>;
  onNavigate: (location: MapLocation) => void;
  onSelectPin: (channels: TvChannel[]) => void;
};
const graticule = geoGraticule10();
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function WorldMap({ countries, country, location, channels, focusedChannel, regionCounts, onNavigate, onSelectPin }: Props) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragStart = useRef({ x: 0, y: 0 });
  const moved = useRef(false);
  const [size, setSize] = useState({ width: 1000, height: 800 });
  const [maps, setMaps] = useState(cachedMaps.get(country.code) ?? null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [zoom, setZoom] = useState(location.level === "world" ? 2 : 1);
  const [rotation, setRotation] = useState<[number, number]>([-12, -38]);
  const [pan, setPan] = useState<[number, number]>([0, 0]);
  const [hovered, setHovered] = useState("");
  const [activePin, setActivePin] = useState("");
  const world = location.level === "world";
  const mobile = size.width < 650;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (cachedMaps.has(country.code)) return;
    const controller = new AbortController();
    Promise.all(["world", country.map].map(async name => {
      const response = await fetch(`/maps/${name}.json`, { signal: controller.signal });
      if (!response.ok) throw new Error("Map unavailable");
      return response.json() as Promise<MapData>;
    })).then(([world, regions]) => {
      if (!controller.signal.aborted) { cachedMaps.set(country.code, { world, regions }); setMaps({ world, regions }); }
    })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt, country.code, country.map]);

  const projection = useMemo(() => {
    const { width: w, height: h } = size;
    const projection = geoOrthographic().precision(.5);
    if (world || !maps) {
      return projection.rotate([rotation[0], rotation[1] + (mobile ? 4 : 0)]).scale((mobile ? w * .79 : Math.min(w * .43, h * .49)) * zoom)
        .translate([w * (mobile ? .5 : .59) + pan[0], h * (mobile ? .62 : .53) + pan[1]]);
    }
    const feature = maps.regions.features.find(feature => feature.properties.code === location.regionCode);
    const center = feature ? geoCentroid(feature) : country.center;
    projection.rotate([-center[0], -center[1]]);
    // Distant overseas territories must not shrink the country overview to a
    // world map. They remain in the list and use their real geometry on selection.
    const overview = country.overviewRegionCodes ? { ...maps.regions,
      features: maps.regions.features.filter(region => country.overviewRegionCodes!.includes(region.properties.code)),
    } : maps.regions;
    // Fit the actual region geometry; the padding reserves space for the title
    // and mobile sheet without coupling geographic coordinates to CSS pixels.
    projection.fitExtent(
      [[mobile ? 30 : w * .23, mobile ? 140 : h * .12], [w - (mobile ? 30 : 80), h - (mobile ? 195 : 100)]],
      feature ?? overview,
    );
    const focus = focusedChannel?.geography.coordinates;
    if (focus) {
      projection.scale(projection.scale() * 1.4);
      const point = projection([focus.lon, focus.lat]);
      const [x, y] = projection.translate();
      if (point) projection.translate([x + w * (mobile ? .5 : .6) - point[0], y + h * (mobile ? .36 : .5) - point[1]]);
    }
    const [x, y] = projection.translate();
    return projection.scale(projection.scale() * zoom).translate([x + pan[0], y + pan[1]]);
  }, [size, world, maps, mobile, rotation, zoom, pan, location.regionCode, country.center, country.overviewRegionCodes, focusedChannel]);

  const path = geoPath(projection);
  const region = country.regions.find(region => region.code === location.regionCode);
  const regionChannels = (focusedChannel && !channels.some(channel => channel.id === focusedChannel.id)
    ? [...channels, focusedChannel] : channels).filter(channel => channel.geography.coordinates);
  // Group broadcasters sharing a city, so stacked markers do not hide channels.
  const cities = Array.from(new Set(regionChannels.map(channel => channel.geography.city ?? channel.name)))
    .map(city => ({ city, channels: regionChannels.filter(channel => (channel.geography.city ?? channel.name) === city) }))
    .sort((a, b) => b.channels.length - a.channels.length);

  const zoomBy = useCallback((factor: number) => {
    const next = zoom * factor;
    if (world && next > 2.4) { onNavigate({ level: "country" }); return; }
    if (!world && next < .7) {
      onNavigate({ level: location.level === "region" ? "country" : "world" });
      return;
    }
    setZoom(clamp(next, .75, world ? 2.4 : 5));
  }, [zoom, world, onNavigate, location.level]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    // A native non-passive listener is needed to keep trackpad zoom inside
    // the map. The rest of the page retains normal scrolling and browser zoom.
    function wheel(event: WheelEvent) {
      event.preventDefault();
      zoomBy(Math.exp(-clamp(event.deltaY, -80, 80) * .004));
    }
    svg.addEventListener("wheel", wheel, { passive: false });
    return () => svg.removeEventListener("wheel", wheel);
  }, [zoomBy, maps]);

  function pointerMove(event: PointerEvent<SVGSVGElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const next = { x: event.clientX, y: event.clientY };
    const all = [...pointers.current.entries()];
    if (Math.hypot(next.x - dragStart.current.x, next.y - dragStart.current.y) > 5) {
      moved.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (all.length === 2) {
      const other = all.find(([id]) => id !== event.pointerId)![1];
      const before = Math.hypot(previous.x - other.x, previous.y - other.y);
      const after = Math.hypot(next.x - other.x, next.y - other.y);
      if (before > 0) zoomBy(after / before);
      moved.current = true;
    } else if (world) {
      setRotation(([lon, lat]) => [lon + (next.x - previous.x) / (4 * zoom), clamp(lat - (next.y - previous.y) / (4 * zoom), -80, 80)]);
    } else {
      setPan(([x, y]) => [
        clamp(x + next.x - previous.x, -size.width * zoom * .7, size.width * zoom * .7),
        clamp(y + next.y - previous.y, -size.height * zoom * .7, size.height * zoom * .7),
      ]);
    }
    pointers.current.set(event.pointerId, next);
  }

  function selectRegion(code: string) {
    if (!moved.current) onNavigate({ level: "region", regionCode: code });
  }

  return <div className={s.mapCanvas} ref={containerRef}>
    {error ? <div className={s.mapMessage} role="alert">
      <p>{t("La mappa non è disponibile. Puoi continuare a esplorare le TV dall’elenco.")}</p>
      <button onClick={() => { setError(false); setAttempt(value => value + 1); }}>{t("Ricarica la mappa")}</button>
    </div> : !maps ? <p className={s.mapMessage} role="status">{t("Prepariamo il tuo punto di vista…")}</p> :
      <svg ref={svgRef} className={`${s.mapSvg} ${location.level === "region" ? s.regionMap : ""}`} viewBox={`0 0 ${size.width} ${size.height}`}
        aria-label={world ? t("Globo interattivo. Trascina per ruotare e scegli un Paese.") : t("Mappa interattiva {name}", { name: region?.name ?? country.name })}
        onPointerDown={event => {
          moved.current = false;
          dragStart.current = { x: event.clientX, y: event.clientY };
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        }}
        onPointerMove={pointerMove}
        onPointerUp={event => pointers.current.delete(event.pointerId)}
        onPointerCancel={event => pointers.current.delete(event.pointerId)}
        onPointerLeave={event => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) pointers.current.delete(event.pointerId); }}
        onDoubleClick={() => zoomBy(1.5)}>
        {world && <>
          <path className={s.ocean} d={path({ type: "Sphere" }) ?? ""} />
          <path className={s.graticule} d={path(graticule) ?? ""} />
          {maps.world.features.map(feature => <path key={feature.properties.code} d={path(feature) ?? ""}
            className={`${s.land} ${countries.some(country => country.iso3 === feature.properties.code) ? s.availableLand : ""} ${feature.properties.code === country.iso3 ? s.selectedLand : ""}`} />)}
        </>}
        {/* Keep neighboring countries in the same projection as the regions,
            without including them in the fit bounds or making them selectable. */}
        {!world && <g aria-hidden="true" className={s.neighborCountries}>
          {maps.world.features.filter(feature => feature.properties.code !== country.iso3).map(feature =>
            <path key={feature.properties.code} d={path(feature) ?? ""} />)}
        </g>}
        {!world && maps.regions.features.map(feature => <path key={feature.properties.code}
          className={`${s.regionShape} ${location.regionCode === feature.properties.code || hovered === feature.properties.code ? s.selectedRegion : ""}`}
          d={path(feature) ?? ""} role="button" tabIndex={0}
          aria-label={t("{name}: {count} canali regionali", { name: feature.properties.name, count: regionCounts[feature.properties.code] ?? 0 })}
          onMouseEnter={() => setHovered(feature.properties.code)} onMouseLeave={() => setHovered("")}
          onFocus={() => setHovered(feature.properties.code)} onBlur={() => setHovered("")}
          onClick={() => selectRegion(feature.properties.code)}
          onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onNavigate({ level: "region", regionCode: feature.properties.code }); } }}>
          <title>{feature.properties.name}</title>
        </path>)}
        {world && countries.map(item => {
          const point = projection(item.center);
          if (!point || geoDistance(item.center, [-rotation[0], -rotation[1]]) >= Math.PI / 2) return null;
          const selected = item.code === country.code;
          const labelLeft = item.code === "ES";
          const labelX = labelLeft ? -34 : 34;
          // First select a country on the globe; a second activation enters it.
          // This also lets touch users discover the name without hover.
          const destination: MapLocation = { level: selected ? "country" : "world", countryCode: item.code };
          return <g key={item.code} className={`${s.mapPin} ${selected ? s.activePin : ""}`} transform={`translate(${point[0]},${point[1]})`}
            role="button" tabIndex={0} aria-label={t(selected ? "{name}: esplora le regioni" : "{name}: seleziona il Paese", { name: item.name })}
            onClick={() => { if (!moved.current) onNavigate(destination); }}
            onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onNavigate(destination); } }}>
            <circle r={selected ? 28 : 22} className={s.pinRing} /><circle r="10" className={s.pinCenter} /><circle r="3" className={s.pinCore} />
            {selected && <text x={labelX} y="6" textAnchor={labelLeft ? "end" : "start"} className={s.pinLabel}>{item.name}</text>}
          </g>;
        })}
        {location.level === "country" && country.regions.filter(item => (regionCounts[item.code] ?? 0) > 0).map(item => {
          const position = projection([...item.center]);
          if (!position) return null;
          const showLabel = hovered === item.code;
          return <g key={item.code} className={`${s.mapPin} ${s.localPin}`} transform={`translate(${position[0]},${position[1]})`}
            onMouseEnter={() => setHovered(item.code)} onMouseLeave={() => setHovered("")}
            onClick={() => selectRegion(item.code)} aria-hidden="true">
            <circle r="22" className={s.pinHit} /><circle r="12" className={s.pinRing} /><circle r="6" className={s.pinCenter} />
            {showLabel && <text x="21" y="4" className={s.regionLabel}>{item.name}</text>}
          </g>;
        })}
        {!world && cities.map(({ city, channels: group }) => {
          const coordinates = group[0].geography.coordinates!;
          const position = projection([coordinates.lon, coordinates.lat]);
          if (!position) return null;
          const focused = group.some(channel => channel.id === focusedChannel?.id);
          const showLabel = hovered === city || activePin === city || focused;
          const labelLeft = position[0] > size.width * .65;
          return <g key={city} className={`${s.mapPin} ${s.localPin} ${activePin === city || focused ? s.activePin : ""}`} transform={`translate(${position[0]},${position[1]})`}
            data-channel-ids={group.map(channel => channel.id).join(",")} data-focused={focused || undefined}
            role="button" tabIndex={0} aria-label={t("{city}: {count} TV", { city, count: group.length })}
            onMouseEnter={() => setHovered(city)} onMouseLeave={() => setHovered("")}
            onFocus={() => setHovered(city)} onBlur={() => setHovered("")}
            onClick={() => { if (!moved.current) { setActivePin(city); onSelectPin(group); } }}
            onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActivePin(city); onSelectPin(group); } }}>
            <circle r="22" className={s.pinHit} /><circle r="12" className={s.pinRing} /><circle r="6" className={s.pinCenter} />
            {showLabel && <text x={labelLeft ? -21 : 21} textAnchor={labelLeft ? "end" : "start"} y="5" className={s.regionLabel}>{focused ? focusedChannel?.name : city}{group.length > 1 ? ` · ${group.length} TV` : ""}</text>}
          </g>;
        })}
      </svg>}
    <div className={s.mapControls} aria-label={t("Controlli mappa")}>
      <button aria-label={t("Avvicina la mappa")} title={t("Avvicina")} onClick={() => zoomBy(1.5)}><Icon name="plus" /></button>
      <button aria-label={t("Allontana la mappa")} title={t("Allontana")} disabled={world && zoom <= .75} onClick={() => zoomBy(1 / 1.5)}><Icon name="minus" /></button>
      <button aria-label={t("Ricentra la mappa")} title={t("Ricentra")} onClick={() => { setZoom(world ? 2 : 1); setPan([0, 0]); setRotation([-12, -38]); }}><Icon name="compass" /></button>
    </div>
    <a className={s.mapCredits} href={`/maps/${world ? "credits" : country.credits}.txt`} target="_blank" rel="noreferrer">{t("Crediti mappa")}</a>
  </div>;
}
