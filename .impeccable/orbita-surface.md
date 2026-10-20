# Orbita surface record

This record describes the implemented `/` experience. Reusable visual rules live in `DESIGN.md`; product scope remains in `PRODUCT.md`. This is a record of the approved implementation, not a newly proposed direction.

## Authority

The approved Figma direction is [Orbita · Blu notte e albicocca](https://www.figma.com/design/GrfERAHrkdfDqokEqzyqlw?node-id=26-276). Reference nodes are world desktop `26:276`, world mobile `26:618`, country desktop `26:1061`, country mobile `26:1190`, region desktop `26:1317`, and region mobile `26:1402`. The user selected this palette to replace the previous green implementation.

## Composition and behavior

Desktop gives the geographic view the flexible left stage and places the channel browser in a 368px right column. The full channel list is the default, with a fixed heading, search and filters and independently scrolling results. Country selection starts a random national channel (preferring verified direct HLS/DASH streams) in a compact player above the list, muted for autoplay. There are no featured-channel cards.

Mobile keeps the map prominent, with a scrolling regional list or compact player below the geographic focus. The catalog can open in the workspace. Selecting a channel or Surprise me fits its region and centers its known coordinates. City markers group channels: the count is labeled TV, and activating a group opens its complete channel list.

Navigation follows world → country → region. Italy and Spain are enabled;
France is being prepared. The map uses real projected geography; counts and
channel membership come from the catalog. Available countries are blue,
selected countries orange, unavailable countries dark blue. Labels appear on
interaction, except the selected country's name on the globe.

Italian / English lives in the header. A separate labeled country control sits
above the map. Language and country are independent; public copy includes
translated map, player and error states. The worldwide expansion subtitle is
visible on mobile as well as desktop. See `docs/design/languages.md`.

Broadcasts load after a country or channel is selected. There is no EPG. Source
selection is hidden from the public player; after a failure, retry advances
to the next source. The Laboratory was removed; automated diagnostics use a development-only harness.

## Intentional differences from illustrative artwork

Real boundaries, calculated counts and functional user actions take precedence over static Figma examples. Geographic points indicate approximate broadcaster locations, not coverage.

## Evidence

- Implementation: `src/components/orbita/OrbitaExplorer.tsx`, `WorldMap.tsx`, `ChannelList.tsx`, `PlayerPanel.tsx` and `Orbita.module.scss`.
- Resource and behavior notes: `docs/design/orbita-implementation.md`.
- Review captures: `.impeccable/review/` contains desktop/mobile world, country and region views.

The finish reviewer owns visual approval and test reporting. This document records the system without asserting a review verdict or stream health.
