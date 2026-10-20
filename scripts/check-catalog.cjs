/* eslint-disable @typescript-eslint/no-require-imports -- This Node-only fixture runner uses CommonJS to load TS modules without another test dependency. */
// Pure data/fallback checks; no browser or network playback is represented by these fixtures.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const modules = new Map();
function load(relative) {
  const filename = path.resolve(root, relative);
  if (modules.has(filename)) return modules.get(filename);
  const exports = {};
  modules.set(filename, exports);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  }).outputText;
  vm.runInThisContext(`(function(require,exports){${code}\n})`, { filename })(
    name => name.startsWith('@/') ? load(`src/${name.slice(2)}.ts`) : require(name), exports);
  return exports;
}
const { parseM3u } = load('src/lib/catalog/m3u.ts');
const { mergeCatalog } = load('src/lib/iptv.ts');
const { createGeographyLookup, geographyLabel } = load('src/lib/geography.ts');
const { exportTests } = load('src/lib/test-log.ts');
const { channelResult, latestSourceTests, nextUntriedSource } = load('src/lib/source-results.ts');
const { classifyDashError, hasDashProtection } = load('src/lib/playback-errors.ts');
const { summarizeAutomaticReport, latestChannelAttempts, channelTestStatus, sourceAttemptLabel } = load('src/lib/automatic-results.ts');
const { replacePlutoChannels, PLUTO_PORTAL_SOURCE } = load('src/lib/catalog/pluto.ts');
const { duplicateFailureIds } = load('src/lib/catalog/duplicate-failures.ts');
const { addOfficialAlternatives, OFFICIAL_ALTERNATIVES } = load('src/lib/catalog/official-alternatives.ts');
const telejatoFixture = mergeCatalog('IT', [{ id: 'Telejato.it', name: 'Telejato', country: 'IT', categories: [], website: 'https://www.telejato.it/', closed: null, is_nsfw: false }], parseM3u('#EXTM3U\n#EXTINF:-1 tvg-id="Telejato.it",Telejato\nhttps://telejato.liberotratto.com/hls/stream.m3u8\n', { id: 'fixture', name: 'Fixture', url: 'https://example.com/list' }));
const telejatoOldFailure = { channelId: 'Telejato.it', country: 'IT', streamUrl: telejatoFixture[0].stream.url, startedAt: '2026-09-17T12:00:00Z', outcome: 'failed' };
assert.equal(channelTestStatus(telejatoFixture[0], latestChannelAttempts(telejatoFixture[0], [telejatoOldFailure])), 'failed');
assert.equal(addOfficialAlternatives(telejatoFixture), 1);
assert.equal(telejatoFixture[0].stream.url, 'https://648026e87a75e.streamlock.net/telejato/telejato/playlist.m3u8');
assert.equal(channelTestStatus(telejatoFixture[0], latestChannelAttempts(telejatoFixture[0], [telejatoOldFailure])), 'uncertain');
assert.equal(telejatoFixture[0].streams.length, 2);
assert.equal(addOfficialAlternatives(telejatoFixture), 0);
assert.equal(telejatoFixture[0].streams.length, 2);
// Curated additions must stay pending and preserve failures until a test confirms the new URL.
const officialResearch = JSON.parse(fs.readFileSync(path.join(root, 'reports/official-players-errors-IT.json'), 'utf8'));
for (const alternative of OFFICIAL_ALTERNATIVES) {
  for (const id of alternative.channelIds) {
    const audited = officialResearch.stations.find(station => station.channelId === id);
    assert.equal(audited?.disposition, 'alternative_added_pending_verification');
    assert.ok(audited.selectedAlternatives.some(source => source.url === alternative.url));
    const fixture = mergeCatalog('IT', [{ id, name: alternative.name, country: 'IT', categories: [], website: null, closed: null, is_nsfw: false }], parseM3u(`#EXTM3U\n#EXTINF:-1 tvg-id="${id}",${alternative.name}\nhttps://example.com/old.m3u8\n`, { id: 'fixture', name: 'Fixture', url: 'https://example.com/list' }));
    const oldFailure = { channelId: id, country: 'IT', streamUrl: fixture[0].stream.url, startedAt: '2026-09-17T12:00:00Z', outcome: 'failed' };
    assert.equal(addOfficialAlternatives(fixture), 1);
    assert.equal(fixture[0].stream.format, alternative.format);
    assert.equal(fixture[0].streams.length, 2);
    assert.equal(channelTestStatus(fixture[0], latestChannelAttempts(fixture[0], [oldFailure])), 'uncertain');
    assert.equal(addOfficialAlternatives(fixture), 0);
  }
}
assert.ok(!OFFICIAL_ALTERNATIVES.some(source => source.channelIds.some(id => ['GoldTVSat.it', 'NuovaTV2.it', 'LA7d.it'].includes(id))));
assert.equal(new Set(OFFICIAL_ALTERNATIVES.filter(source => source.channelIds.some(id => /^catalog:IT:teletutto/.test(id))).map(source => source.url)).size, 3);
const duplicateCandidates = [
  { id: 'good', name: 'Canale 5', country: 'IT' },
  { id: 'bad', name: 'Canale 5 (1080p) [Geo-blocked]', country: 'IT' },
  { id: 'badHd', name: 'Canale 5 HD', country: 'IT' },
  { id: 'uncertain', name: 'Canale 5', country: 'IT' },
  { id: 'region', name: 'Canale 5 Sicilia', country: 'IT' },
  { id: 'other', name: 'Canale 50', country: 'IT' },
  { id: 'abroad', name: 'Canale 5', country: 'CL' },
];
const duplicateStates = { good: 'playing', bad: 'failed', badHd: 'failed', uncertain: 'uncertain', region: 'failed', other: 'failed', abroad: 'failed' };
assert.deepEqual(duplicateFailureIds(duplicateCandidates, duplicateStates), ['bad', 'badHd']);
assert.deepEqual(duplicateFailureIds(duplicateCandidates, { ...duplicateStates, good: 'loading' }), []);
assert.deepEqual(duplicateFailureIds(duplicateCandidates.filter(channel => channel.id !== 'good'), duplicateStates), []);
const plutoFixtures = mergeCatalog('IT', [], parseM3u('#EXTM3U\n#EXTINF:-1,Pluto TV Anime\nhttps://jmp2.uk/plu-anime.m3u8\n#EXTINF:-1,Serie su Pluto\nhttps://api.pluto.tv/live/series.m3u8\n#EXTINF:-1,Emittente indipendente\nhttps://jmp2.uk/plu-independent.m3u8\n#EXTINF:-1,Emittente indipendente\nhttps://example.com/independent.m3u8\n', { id: 'fixture', name: 'Fixture', url: 'https://example.com/list' }));
assert.equal(replacePlutoChannels(plutoFixtures), 2);
assert.equal(plutoFixtures.length, 2);
const plutoPortal = plutoFixtures.find(channel => channel.id === 'PlutoTV.it');
assert.equal(plutoPortal.name, 'Pluto TV');
assert.equal(plutoPortal.stream.url, PLUTO_PORTAL_SOURCE.url);
assert.equal(plutoPortal.stream.format, 'embed');
assert.equal(plutoPortal.previousIds, undefined);
const oldPlutoFailure = { channelId: 'catalog:IT:plutotvanime', country: 'IT', streamUrl: 'https://jmp2.uk/plu-anime.m3u8', startedAt: '2026-09-17T12:00:00Z', outcome: 'failed' };
assert.equal(channelTestStatus(plutoPortal, latestChannelAttempts(plutoPortal, [oldPlutoFailure])), 'uncertain');
assert.deepEqual(plutoFixtures.find(channel => channel.name === 'Emittente indipendente').streams.map(stream => stream.url), ['https://example.com/independent.m3u8']);
replacePlutoChannels(plutoFixtures);
assert.equal(plutoFixtures.filter(channel => channel.id === 'PlutoTV.it').length, 1);
// Official Canale Dieci and the two catalog spellings must open the official URL first.
const canaleDieciMeta = [{ id: 'CanaleDieci.it', name: 'Canale Dieci', country: 'IT', categories: [], website: 'https://canaledieci.it/', closed: null, is_nsfw: false }];
const canaleDieciLegacyUrl = 'http://37.187.142.147:1935/ch10live/high.stream/playlist.m3u8';
const canaleDieciOfficialUrl = 'https://nrvideo1.newradio.it:1936/desxcerbht/desxcerbht/playlist.m3u8';
const officialSource = { id: 'canale10-official', name: 'Canale Dieci · player ufficiale', url: 'https://canaledieci.it/diretta/' };
const legacyEntries = parseM3u(`#EXTM3U\n#EXTINF:-1 tvg-id="CanaleDieci.it",Canale Dieci\n${canaleDieciLegacyUrl}\n#EXTINF:-1,Canale 10 (540p) [Not 24/7]\n${canaleDieciLegacyUrl}\n#EXTINF:-1,Canale 10\n${canaleDieciOfficialUrl}\n`, { id: 'fixture', name: 'Fixture', url: 'https://example.com/list' });
const officialEntry = parseM3u(`#EXTM3U\n#EXTINF:-1 tvg-id="CanaleDieci.it",Canale Dieci\n${canaleDieciOfficialUrl}\n`, officialSource)[0];
officialEntry.stream.needsVerification = true;
for (const metadata of [canaleDieciMeta, []]) {
  const merged = mergeCatalog('IT', metadata, [...legacyEntries, officialEntry]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, 'CanaleDieci.it');
  assert.equal(merged[0].name, 'Canale Dieci');
  assert.equal(merged[0].stream.url, canaleDieciOfficialUrl);
  assert.equal(merged[0].streams.length, 2);
  assert.ok(merged[0].stream.sources.some(source => source.id === 'canale10-official'));
  assert.equal(channelTestStatus(merged[0], new Map()), 'uncertain');
  const legacyConfirmation = { channelId: 'catalog:IT:canale10', country: 'IT', streamUrl: canaleDieciOfficialUrl, startedAt: '2026-09-17T12:00:00Z', outcome: 'interrupted', confirmedAt: '2026-09-17T12:01:00Z' };
  assert.equal(channelTestStatus(merged[0], latestChannelAttempts(merged[0], [legacyConfirmation])), 'playing');
  assert.equal(channelResult(merged[0], latestSourceTests(merged[0], [legacyConfirmation])), 'playing');
}
const autoChannel = { id: 'Auto.it', country: 'IT', streams: [{ url: 'https://example.com/a', restriction: null, format: 'hls' }, { url: 'https://example.com/b', restriction: null, format: 'hls' }, { url: 'https://example.com/restricted', restriction: 'Requires another player', format: 'hls' }] };
const autoAttempt = (url, verdict, startedAt = '2026-09-17T12:00:00Z') => ({ id: url, channelId: 'Auto.it', country: 'IT', streamUrl: url, startedAt, endedAt: '2026-09-17T12:00:30Z', outcome: verdict === 'verified' ? 'playing' : verdict === 'failed' ? 'failed' : 'interrupted', lastError: null, automation: { verdict, complete: verdict !== 'interrupted', reason: 'Fixture only' } });
const aFailed = autoAttempt(autoChannel.streams[0].url, 'failed');
const bVerified = autoAttempt(autoChannel.streams[1].url, 'verified');
const bFailed = autoAttempt(autoChannel.streams[1].url, 'failed');
assert.equal(channelTestStatus(autoChannel, latestChannelAttempts(autoChannel, [aFailed, bVerified])), 'playing');
assert.equal(channelTestStatus(autoChannel, latestChannelAttempts(autoChannel, [aFailed, bFailed])), 'failed'); // Restricted alternatives do not hide failure of every usable source.
assert.equal(channelTestStatus(autoChannel, latestChannelAttempts(autoChannel, [aFailed])), 'partial');
assert.equal(channelTestStatus(autoChannel, latestChannelAttempts(autoChannel, [aFailed, autoAttempt(autoChannel.streams[1].url, 'inconclusive')])), 'uncertain');
assert.equal(channelTestStatus(autoChannel, new Map()), 'idle');
const newerFailed = autoAttempt(bVerified.streamUrl, 'failed', '2026-09-17T13:00:00Z');
assert.equal(latestChannelAttempts(autoChannel, [bVerified, newerFailed]).get(bVerified.streamUrl), newerFailed);
const manualConfirmation = { ...bVerified, automation: undefined, confirmedAt: '2026-09-17T12:01:00Z', outcome: 'interrupted' };
for (const records of [[manualConfirmation, newerFailed], [newerFailed, manualConfirmation]]) {
  assert.equal(channelTestStatus(autoChannel, latestChannelAttempts(autoChannel, records)), 'playing');
  assert.equal(channelResult(autoChannel, latestSourceTests(autoChannel, records)), 'playing');
}
assert.equal(channelTestStatus({ ...autoChannel, streams: [{ url: 'https://example.com/new', format: 'hls' }] }, latestChannelAttempts(autoChannel, [manualConfirmation])), 'playing');
assert.equal(sourceAttemptLabel(autoAttempt('url', 'skipped')), 'Non testabile');
assert.equal(latestChannelAttempts(autoChannel, [{ ...bVerified, country: 'US' }]).size, 0);
const automaticFixture = { version: 1, exportedAt: '2026-09-17T12:01:00Z', run: { runnerVersion: 1, status: 'complete', config: { country: 'IT', location: 'Italia' }, queue: [aFailed, bVerified] }, tests: [aFailed, bVerified] };
const automaticSummary = summarizeAutomaticReport(automaticFixture, 'IT');
assert.equal(automaticSummary.completed, 2);
assert.equal(automaticSummary.total, 2);
assert.equal(automaticSummary.testerLocation, 'Italia');
assert.throws(() => summarizeAutomaticReport(automaticFixture, 'US'));
assert.throws(() => summarizeAutomaticReport({ ...automaticFixture, tests: [{ ...aFailed, automation: null }] }, 'IT'));
const raiItaliaEntries = parseM3u('#EXTM3U\n#EXTINF:-1,Rai Italia\nhttps://cdn.example/rai.m3u8\n#EXTINF:-1,Rai Italia Asia e Australia\nhttps://cdn.example/asia.m3u8\n#EXTINF:-1,Rai Italia Nord America\nhttps://cdn.example/rai.m3u8\n#EXTINF:-1,Rai Italia Europa e Africa\nhttps://cdn.example/europa.m3u8\n#EXTINF:-1,Rai Italia Sud America\nhttps://cdn.example/sud.m3u8\n', { id: 'fixture', name: 'Fixture', url: 'https://example.com/list' });
const raiItaliaMerged = mergeCatalog('IT', [], raiItaliaEntries);
assert.equal(raiItaliaMerged.length, 1);
assert.equal(raiItaliaMerged[0].name, 'Rai Italia');
assert.equal(raiItaliaMerged[0].streams.length, 4);
const geography = createGeographyLookup([
  { channel: 'Rai3.it', id: 'SD', is_main: true, broadcast_area: ['c/IT'] },
  { channel: 'Rai3.it', id: 'Sicilia', is_main: false, broadcast_area: ['s/IT-82'] },
  { channel: 'Regional.it', id: 'SD', is_main: true, broadcast_area: ['ct/ITMOD'] },
  { channel: 'Unknown.it', id: 'SD', is_main: true, broadcast_area: ['c/IT'] },
], [
  { country: 'IT', code: 'IT-82', name: 'Sicilia', parent: null },
  { country: 'IT', code: 'IT-RG', name: 'Ragusa', parent: 'IT-82' },
  { country: 'IT', code: 'IT-25', name: 'Lombardia', parent: null },
], [{ country: 'IT', code: 'ITMOD', subdivision: 'IT-RG' }]);
assert.equal(geographyLabel(geography('AntennaSicilia.it', 'IT')), 'Regione: Sicilia');
assert.equal(geographyLabel(geography('TelecolorLombardia.it', 'IT')), 'Regione: Lombardia');
assert.equal(geographyLabel(geography('Regional.it', 'IT')), 'Area: Sicilia');
assert.equal(geographyLabel(geography('Rai3.it', 'IT')), 'Nazionale');
assert.equal(geographyLabel(geography('Rai3.it', 'IT', 'Sicilia')), 'Area: Sicilia');
assert.equal(geographyLabel(geography('Unknown.it', 'IT')), 'Regione non indicata'); // Country coverage is not proof of national broadcaster scope.
assert.equal(geographyLabel(geography('Channel called Sicilia', 'IT')), 'Regione non indicata');
assert.equal(geographyLabel(geography('Regional.it', 'US')), 'Regione non indicata');
const recorded = { id: 'test', channelId: 'Regional.it', channelName: 'Regional', country: 'IT', geography: geography('Regional.it', 'IT'), lastError: null, events: [] };
assert.deepEqual(JSON.parse(exportTests([recorded], 'json')).tests[0].geography, recorded.geography);
const csv = exportTests([recorded], 'csv');
assert.ok(csv.includes('IT-82') && csv.includes('Sicilia') && csv.includes('broadcast_area') && csv.includes('regionSourceUrl'));
const a = { id: 'a', name: 'Catalog A', url: 'https://a.example/list.m3u' };
const b = { id: 'b', name: 'Catalog B', url: 'https://b.example/list.m3u' };
const fixture = `#EXTM3U
#EXTINF:-1 tvg-id="Rai1.it" group-title="Italy, TV",Rai 1
https://cdn.example/rai1.m3u8
#EXTINF:-1 tvg-id="Canale.5.it",Canale 5 Ⓖ
#EXTVLCOPT:http-user-agent=HbbTV/1.6.1
https://cdn.example/c5.mpd
#EXTINF:-1,Local Channel
https://cdn.example/local.m3u8
#EXTINF:-1,Website only
https://www.youtube.com/watch?v=test
#EXTINF:-1,Rai 1
https://mediapolis.rai.it/relinker?forceUserAgent=other-player
#EXTINF:-1,Unsafe URL
https://user:secret@cdn.example/private.m3u8
`;
const parsed = parseM3u(fixture, a);
assert.equal(parsed.length, 5);
assert.equal(parsed[0].name, 'Rai 1');
assert.equal(parsed[1].stream.format, 'dash');
assert.equal(parsed[1].stream.requiresHeaders, true);
assert.equal(parsed[1].stream.restriction, null); // Plain browser request allowed; no emulation.
assert.ok(parsed[4].stream.restriction);
assert.throws(() => parseM3u('<html>Error</html>', a));
const metadata = [
  { id: 'Rai1.it', name: 'Rai 1', country: 'IT', categories: [], website: null, closed: null, is_nsfw: false },
  { id: 'Canale5.it', name: 'Canale 5', country: 'IT', categories: [], website: null, closed: null, is_nsfw: false },
  { id: 'NoStream.it', name: 'Without Stream', country: 'IT', categories: [], website: null, closed: null, is_nsfw: false }
];
const duplicate = parseM3u('#EXTM3U\n#EXTINF:-1,Rai 1\nhttps://cdn.example/rai1.m3u8\n', b);
assert.equal(mergeCatalog('IT', [], parseM3u('#EXTM3U\n#EXTINF:-1,Only simulated player\nhttps://rai.example/live?forceUserAgent=other\n', a)).length, 0);
const cycle = { Period: { AdaptationSet: { ContentProtection: [{ schemeIdUri: 'urn:uuid:example' }] } } };
cycle.self = cycle;
assert.equal(hasDashProtection(cycle), true);
assert.equal(hasDashProtection({ ContentProtection: [], self: {} }), false);
const channels = mergeCatalog('IT', metadata, [...parsed, ...duplicate]);
assert.equal(channels.length, 3); // No website-only or missing-stream channels.
const rai = channels.find(c => c.id === 'Rai1.it');
assert.equal(rai.streams.length, 2);
assert.deepEqual(rai.streams[0].sources.map(s => s.id), ['a', 'b']);
assert.equal(channels.find(c => c.name === 'Canale 5').id, 'Canale5.it');
const test = (url, outcome) => ({ channelId: rai.id, country: 'IT', streamUrl: url, outcome });
const failure = test(rai.streams[0].url, 'failed');
assert.equal(channelResult(rai, latestSourceTests(rai, [failure])), 'idle');
assert.equal(channelResult(rai, latestSourceTests(rai, [test(rai.streams[1].url, 'playing'), failure])), 'playing');
assert.equal(channelResult(rai, latestSourceTests(rai, [test(rai.streams[1].url, 'failed'), failure])), 'failed');
const tried = new Set([rai.streams[0].url]);
assert.equal(nextUntriedSource(rai, 0, tried), 1);
tried.add(rai.streams[1].url);
assert.equal(nextUntriedSource(rai, 1, tried), -1); // Never loop endlessly through failed sources.
assert.equal(classifyDashError({ error: { code: 25, message: 'Manifest failed loading', data: { request: { status: 403 } } } }, rai.stream.url).category, 'access_denied');
assert.equal(classifyDashError({ error: { message: 'Manifest failed loading', data: { request: { status: 0 } } } }, rai.stream.url).httpStatus, null);
console.log('Catalog checks passed: M3U/DASH parsing, URL deduplication/provenance, no streamless channels, per-source results, finite fallback, HTTP/status-zero diagnosis and region/feed/city geography.');
if (process.argv[2]) {
  const realMetadata = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const realEntries = process.argv.slice(3).flatMap((file, i) => parseM3u(fs.readFileSync(file, 'utf8'), i ? b : a));
  const merged = mergeCatalog('IT', realMetadata, realEntries);
  console.log(JSON.stringify({ channels: merged.length, urls: merged.reduce((n, c) => n + c.streams.length, 0), sample: merged.filter(c => /^(Rai [123]|Canale 5|Rete 4|Italia 1|LA7|Sky TG24|TV2000)$/.test(c.name)).map(c => ({ id: c.id, name: c.name, sources: c.streams.length, formats: [...new Set(c.streams.map(s => s.format))] })) }, null, 2));
}
