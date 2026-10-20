// Independent embed review using the real local player. No proxy or header changes.
import { chromium } from 'playwright-core';
import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
const input = JSON.parse(await readFile(process.argv[2], 'utf8'));
const output = process.argv[3];
if (!output) throw new Error('Provide input and report JSON paths');
const origin = 'http://localhost:3000';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { version: 1, run: { id: randomUUID(), startedAt: new Date().toISOString(), status: 'running',
  config: { country: 'FR', location: 'ambiente locale, posizione non verificata', kind: 'embed-probe', criteria: 'same-dom-video-series', observe: 20, origin }, queue: input }, tests: [] };
try {
  for (const item of input) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const startedAt = new Date().toISOString();
    const attemptId = randomUUID();
    let samples = [], verdict = 'inconclusive', reason = '', diagnostics = [];
    const frames = new WeakMap(); let frameId = 0;
    const sample = async () => {
      const found = [];
      for (const frame of page.frames()) {
        if (!frames.has(frame)) frames.set(frame, ++frameId);
        const videos = await frame.evaluate(() => {
          // A WeakMap follows actual DOM nodes: replacing an ad/player video
          // cannot accidentally inherit a sample identity by reusing its index.
          window.__frReviewVideos ??= { ids: new WeakMap(), next: 0 };
          const state = window.__frReviewVideos;
          return [...document.querySelectorAll('video')].map(video => {
            if (!state.ids.has(video)) state.ids.set(video, ++state.next);
            return { id: state.ids.get(video), time: video.currentTime, frames: video.getVideoPlaybackQuality?.().totalVideoFrames ?? null,
              width: video.videoWidth, height: video.videoHeight, paused: video.paused, source: video.currentSrc };
          });
        }).catch(() => []);
        found.push(...videos.map(video => ({ ...video, key: `${frames.get(frame)}:${video.id}`, at: Date.now() })));
      }
      return found;
    };
    try {
      const stream = { url: item.url, format: 'embed', sources: [{id: 'official', name: 'Official player', url: item.page ?? item.url}], requiresHeaders: false };
      const channel = { id: item.channelId, name: item.name, country: 'FR', stream, streams: [stream], geography: {scope: 'unknown', regions: []}, categories: [], website: item.page ?? null };
      await page.route('**/api/channels?country=IT', route => route.fulfill({ json: {country: { code: 'IT' }, channels: [channel]} }));
      await page.goto(`${origin}/?stream-test=1`);
      await page.waitForFunction(() => window.worldTvTester?.catalog?.channels.length > 0);
      await page.evaluate(({id, url, attemptId}) => window.worldTvTester.select(id, url, attemptId), {id: item.channelId, url: item.url, attemptId});
      const deadline = Date.now() + 30000;
      let first;
      while (Date.now() < deadline && !first) {
        first = (await sample()).find(video => video.width > 0 && video.time > 0 && !video.paused);
        if (first) break;
        for (const frame of page.frames().slice(1)) {
          await frame.evaluate(() => { for (const video of document.querySelectorAll('video')) { video.muted = true; if (video.paused) video.play().catch(() => {}); } }).catch(() => {});
          const play = frame.getByRole('button', {name: /^(play|lecture|lire|regarder|start watching)/i}).first();
          if (await play.isVisible().catch(() => false)) await play.click({timeout: 500}).catch(() => {});
        }
        await page.waitForTimeout(1500);
      }
      if (!first) reason = 'Nessun video avviato e misurabile entro 30 secondi.';
      else {
        samples = [first];
        for (let index = 0; index < 10; index++) {
          await page.waitForTimeout(2000);
          samples.push((await sample()).find(video => video.key === first.key && video.source === first.source) ?? null);
        }
        let stalled = 0, longestStall = 0;
        for (let i = 1; i < samples.length; i++) {
          stalled = samples[i] && samples[i-1] && samples[i].time > samples[i-1].time ? 0 : stalled + 2;
          longestStall = Math.max(longestStall, stalled);
        }
        const last = samples.at(-1);
        const intact = samples.every(video => video && video.width > 0 && video.height > 0 && video.frames !== null && !video.paused);
        if (intact && last.frames > first.frames && last.time - first.time >= 12 && longestStall <= 5) {
          verdict = 'verified'; reason = `Stesso elemento video osservato per 20 s, +${last.frames-first.frames} frame, +${(last.time-first.time).toFixed(1)} s.`;
        } else reason = 'Continuità, identità del video o fotogrammi insufficienti nella finestra osservata.';
      }
      for (const frame of page.frames().slice(1)) diagnostics.push({url: frame.url(), text: (await frame.locator('body').innerText({timeout:1000}).catch(() => '')).slice(0,1000)});
    } catch (error) { reason = error.message; }
    report.tests.push({id: attemptId, channelId: item.channelId, channelName: item.name, country: 'FR', streamUrl: item.url, streamFormat: 'embed',
      startedAt, endedAt: new Date().toISOString(), outcome: verdict === 'verified' ? 'playing' : 'ready', player: 'official-embed', testerLocation: report.run.config.location,
      automation: {verdict, complete:true, reason, samples}, diagnostics});
    console.log(`${verdict} ${item.name}: ${reason}`);
    await writeFile(output, JSON.stringify(report,null,2));
    await context.close();
  }
  report.run.status = 'complete'; report.exportedAt = new Date().toISOString();
  await writeFile(output, JSON.stringify(report,null,2));
} finally { await browser.close(); }
