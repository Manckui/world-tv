# Help map television, one country at a time

World TV is an interactive atlas of television. Contributions are especially
welcome from people who know a country's local broadcasters and languages.

Start an issue naming the country you want to research, so other contributors
can coordinate with you. A useful contribution can cover one missing region
or fix one broken stream; it does not need to cover an entire country.

## What to contribute

- National, regional and local television channels with official websites.
- Stable public HLS/DASH sources, or a publisher's embeddable player.
- Evidence of the broadcaster's location and editorial coverage.
- Regional boundaries with a redistribution license and attribution.
- Playback results, including failures and regions still missing coverage.

The app connects viewers to broadcasters. It does not host or relay their video.
Keep authentication, DRM, geographic restrictions and publisher controls intact.
Do not submit credentials, expiring playback tokens or URLs requiring spoofed headers.

## Files for a country

Each country has a small data pack. Use Spain as a structural example:

| File | Content |
| --- | --- |
| `data/catalogs/CC.json` | Channel IDs, names, official pages and stream sources |
| `data/geography/CC.json` | Coverage, documented city/province and approximate coordinates |
| `data/regions/CC.json` | Region codes, names and `[longitude, latitude]` map centers |
| `data/alternatives/CC.json` | Optional researched sources for existing channels |
| `public/maps/country.json` | Regional GeoJSON with matching `properties.code` and `name` |
| `public/maps/country-credits.txt` | Source, license, date and transformations |
| `docs/diagnostics/country-handoff.md` | Evidence, test summary and remaining gaps |

Packs use `version: 1` and the ISO alpha-2 country code. IDs must be stable:
reuse an existing IPTV-org ID only when the channel matches; otherwise use
`catalog:CC:slug`. Preserve accented display names.

Every stream has `url`, `format` (`hls`, `dash` or `embed`) and `page` recording
where it was found. Set `verifiedAt` only after a successful playback test
of that exact URL. A regional edition or international feed with different
programming should have its own identity.

A national broadcaster's headquarters do **not** make it regional. National
entries have `scope: "national"` and `regionCode: null`. Local/regional entries
need a documented region. A city pin needs an official location source and
a geographical coordinate source. If the city is unknown, leave `city`,
`lat` and `lon` null instead of guessing the regional capital.

Pin coordinates represent approximate city centers, not transmitter sites or
reception coverage. State that precision and retain evidence URLs in the data.
Keep islands and overseas regions at their actual coordinates. This project uses
d3-geo, which expects clockwise exterior rings for these small polygons.

## Test the actual video

Use Node 22 and an installed Google Chrome:

```sh
npm ci
npm run dev
```

In a second terminal, after the country has been registered:

```sh
npm run test:streams -- --country ES --location "actual test location or unverified" --concurrency 2 --headless --output reports/my-review-ES.json
```

Replace `ES` and the location. The location describes the tester's environment,
not the broadcaster's country. Never infer it from the channel being tested.

The default test requires decoded frames, valid video dimensions and advancing
media for a 20-second observation window. HTTP 200, a valid playlist or a loaded
iframe do not prove playback. Keep `verified`, `failed`, `inconclusive` and
`skipped` separate. Embedded players that the runner cannot measure require
additional review; do not silently label them successful.

Reports resume when their configuration matches. Use a new filename for an
independent review and preserve previous evidence. Raw reports remain local
because they can contain network diagnostics or temporary media URLs.
Share a sanitized summary in the handoff, including date, browser, environment,
scope, counts, official alternatives and unresolved gaps.

## Checks and review

```sh
node scripts/check-country-packs.mjs ES
node --test scripts/stream-test-utils.test.mjs
npm run lint
npx tsc --noEmit
npm run build -- --webpack
```

When adding a new country, a maintainer also registers its code and reference
clock in `src/lib/countries.ts` / `src/types/tv.ts`, its map in
`src/lib/load-map-countries.ts`, and its code in the runner/validator allowlists.
Existing-country data changes usually need no component changes.

Open a pull request with a short description of the area covered, primary
sources, playback results and limitations. Have another contributor review
the data and independently reproduce the playback checks before declaring a
country reviewed. Availability can still change after a successful test.
