import { randomUUID } from "node:crypto";
import { PlaybackObservation } from "./stream-test-utils.mjs";
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function fallbackRecord(item, id, environment) {
  const at = new Date().toISOString();
  return { id, channelId: item.channel.id, channelName: item.channel.name, country: item.channel.country,
    streamUrl: item.stream.url, streamLabel: item.stream.label, requiresHeaders: item.stream.requiresHeaders,
    sources: item.stream.sources, streamFormat: item.stream.format, sourceHost: new URL(item.stream.url).hostname,
    geography: item.stream.geography ?? item.channel.geography, feedId: item.stream.feedId ?? null,
    startedAt: at, endedAt: at, outcome: "interrupted", lastError: null,
    testerLocation: environment.location, userAgent: environment.userAgent, timeZone: environment.timeZone,
    player: "unsupported", events: [], omittedEvents: 0 };
}

// Each worker has its own context: test logs/localStorage never overlap.
export async function openWorker(browser, options, hooks, workerId) {
  const context = await browser.newContext();
  let page, active;
  try {
    page = await context.newPage();
    page.setDefaultTimeout(15_000);
    if (hooks.preparePage) await hooks.preparePage(page, workerId);
    const requests = new WeakMap();
    const add = (target, field, value) => {
      if (!target) return;
      if (target[field].length < 100) target[field].push(value);
      else target.omittedDiagnostics++;
    };
    page.on("request", request => {
      if (active && new URL(request.url()).origin !== options.origin) requests.set(request, active);
    });
    page.on("response", response => {
      const target = requests.get(response.request());
      if (target && (response.status() >= 400 || /m3u8|\.mpd|relinker/i.test(response.url()))) {
        add(target, "network", { at: new Date().toISOString(), kind: "response", method: response.request().method(), url: response.url(), status: response.status() });
      }
    });
    page.on("requestfailed", request => {
      const failure = request.failure()?.errorText ?? "Unknown request failure";
      // Cancellation during cleanup is kept as a diagnostic, never called CORS.
      add(requests.get(request), "network", { at: new Date().toISOString(), kind: "requestfailed", url: request.url(), status: null, error: failure });
    });
    page.on("console", message => {
      if (["error", "warning"].includes(message.type())) add(active, "browserConsole", { at: new Date().toISOString(), type: message.type(), message: message.text(), location: message.location() });
    });
    page.on("pageerror", error => add(active, "browserConsole", { at: new Date().toISOString(), type: "pageerror", message: error.message }));

    try { await page.goto(`${options.origin}/?stream-test=1`, { waitUntil: "domcontentloaded", timeout: 45_000 }); }
    catch (error) { throw new Error(`Sito non raggiungibile su ${options.origin}. Avvia npm run dev. ${error.message}`); }
    await page.waitForFunction(() => !!window.worldTvTester, null, { timeout: 45_000 });
    await page.evaluate(country => window.worldTvTester.setCountry(country), options.country);
    await page.waitForFunction(country => window.worldTvTester?.error || window.worldTvTester?.catalog?.country.code === country, options.country, { timeout: 90_000 });
    const payload = await page.evaluate(() => ({ catalog: window.worldTvTester.catalog, error: window.worldTvTester.error,
      userAgent: navigator.userAgent, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
    if (payload.error || !payload.catalog) throw new Error(payload.error || "Catalogo assente");
    await page.evaluate(location => window.worldTvTester.setLocation(location), options.location);
    return { page, payload, workerId, setActive: value => { active = value; } };
  } catch (error) { await context.close().catch(() => {}); throw error; }
}

export async function testSource(worker, item, options, environment, control) {
  const { page } = worker;
  const id = randomUUID();
  const diagnostics = { network: [], browserConsole: [], omittedDiagnostics: 0 };
  worker.setActive(diagnostics);
  const observation = new PlaybackObservation(options.observe);
  let record = null, startupSeconds = null, verdict = "inconclusive", reason = "", complete = true, lastAt = 0;
  const now = control.now ?? (() => performance.now());
  const wait = control.sleep ?? sleep;
  const start = now();
  let observationStarted = null;
  if (item.stream.restriction || item.stream.format === "external" || item.stream.format === "embed") {
    verdict = "skipped";
    reason = item.stream.restriction || (item.stream.format === "embed" ? "Player ufficiale incorporato: il runner non misura il video dentro l’iframe. Richiede verifica manuale." : "Fonte esterna non incorporabile con questo player.");
    record = fallbackRecord(item, id, environment);
  } else {

    try {
      await page.evaluate(({ channelId, url, id }) => window.worldTvTester.select(channelId, url, id), { channelId: item.channel.id, url: item.stream.url, id });
      while (!control.isStopping()) {
        const sample = await page.evaluate(id => window.worldTvTester.sample(id), id);
        record = sample.record ?? record;
        lastAt = sample.video?.at ?? lastAt;
        observation.add(sample.video, record?.outcome === "playing");
        if (record?.outcome === "failed") { verdict = "failed"; reason = record.lastError?.message ?? "Errore del player"; break; }
        if (observation.startedAt !== null && startupSeconds === null) {
          observationStarted = now();
          startupSeconds = (observationStarted - start) / 1000;
        }
        if (observation.finished(lastAt)) {
          verdict = observation.verified(lastAt) ? "verified" : "inconclusive";
          reason = verdict === "verified" ? "Video decodificato e avanzamento osservati durante la finestra di test; continuità futura non garantita." : "Avvio osservato, ma avanzamento insufficiente o interruzioni durante la finestra di test.";
          break;
        }
        if (observation.startedAt === null && now() - start >= options.startup * 1000) {
          reason = "Nessun avanzamento video decodificato entro il tempo di avvio. Stream offline non confermato; consulta errori e rete.";
          break;
        }
        if (observationStarted !== null && now() - observationStarted > (options.observe + 5) * 1000) {
          reason = "Finestra di test scaduta senza evidenza sufficiente di riproduzione.";
          break;
        }
        await wait(500);
      }
      if (control.isStopping()) { verdict = "interrupted"; reason = "Test interrotto; sarà riprovato alla ripresa."; complete = false; }
    } catch (error) {
      // A broken browser/bridge must stop the run, not mark all TV streams offline.
      verdict = "interrupted"; reason = `Test interrotto da un errore del browser: ${error.message}`; complete = false;
      control.fail(error);
    } finally {
      try {
        await page.evaluate(() => window.worldTvTester.stop());
        await page.waitForFunction(id => window.worldTvTester.sample(id).record?.endedAt, id, { timeout: 3000 });
        record = (await page.evaluate(id => window.worldTvTester.sample(id).record, id)) ?? record;
      } catch { /* Last sampled evidence is still saved if Chrome closed. */ }
    }
  }
  record ??= fallbackRecord(item, id, environment);
  record.endedAt ??= new Date().toISOString();
  // A playing event alone is insufficient for an automatic verified result.
  if (verdict !== "failed") record.outcome = verdict === "verified" ? "playing" : "interrupted";
  record.events.push({ at: record.endedAt, kind: ["verified", "failed"].includes(verdict) ? "ended" : "interrupted", message: reason, issue: null });
  const dropped = Math.max(0, record.events.length - 100);
  record.events = record.events.slice(-100); record.omittedEvents += dropped;
  record.automation = { verdict, complete, reason, startupSeconds, startupLimitSeconds: options.startup,
    observationTargetSeconds: options.observe, evidence: observation.evidence(lastAt), concurrency: control.concurrency, worker: worker.workerId, sessionId: control.sessionId, ...diagnostics };
  worker.setActive(null);
  return record;
}
