import { chromium } from "playwright-core";
import { mkdir, readFile, writeFile, rename, open, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { optionsFrom, sourceKey, isCompleted, assertResume, reportCsv, needsRecheck, validateInputTests } from "./stream-test-utils.mjs";

import { openWorker, testSource } from "./stream-test-worker.mjs";

const HELP = `Test automatico delle fonti con il player del sito e Google Chrome installato.

Avvia prima npm run dev in un altro terminale.
npm run test:streams -- --country IT --location "Italia"

Opzioni:
  --concurrency 3         Fonti contemporanee (1–4; predefinito 3)
  --limit 5               Prova al massimo 5 nuove fonti (non 5 canali)
  --channel Rai1.it       Limita a un ID canale esatto
  --recheck uncertain    Riprova solo i canali Da verificare del report principale
  --manual-results file.json  Considera anche i test manuali esportati dal browser
  --output reports/it.json  Percorso JSON; viene scritto anche il CSV
  --startup 20            Tempo massimo di avvio, in secondi
  --observe 20            Finestra di osservazione del video, in secondi
  --base-url http://localhost:3000
  --headless              Chrome senza finestra; registrato nel report
  --fresh                 Nuovo report con data nel nome, conserva il precedente

Riprende automaticamente il report esistente con la stessa configurazione.
Ctrl+C interrompe e salva; il tentativo interrotto verrà riprovato.
Il luogo è dichiarato da te: non cambia IP o geolocalizzazione.
`;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function atomicWrite(filename, content) {
  const temporary = `${filename}.${process.pid}.tmp`;
  await writeFile(temporary, content);
  await rename(temporary, filename);
}

async function acquireLock(filename) {
  try {
    const handle = await open(filename, "wx");
    await handle.writeFile(String(process.pid));
    await handle.close();
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const pid = Number(await readFile(filename, "utf8"));
    if (!Number.isInteger(pid) || pid <= 0) throw new Error(`Lock non valido: ${filename}. Controlla che nessun test sia in esecuzione.`);
    try { process.kill(pid, 0); }
    catch (caught) {
      if (caught.code !== "ESRCH") throw caught;
      await unlink(filename);
      return acquireLock(filename);
    }
    throw new Error(`Un test sta già scrivendo questo report (PID ${pid}).`);
  }
  return () => unlink(filename);
}

export async function run(options, hooks = {}) {
  const concurrency = options.concurrency ?? 3;
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new Error("--concurrency deve essere un intero tra 1 e 4.");
  const baselinePath = path.resolve(hooks.baselineReport ?? `reports/streams-${options.country}.json`);
  const outputBase = path.resolve(options.output ?? `reports/streams-${options.country}${options.recheck ? "-recheck" : ""}.json`);
  if (options.recheck && outputBase === baselinePath) throw new Error("Il ripasso deve salvare un report distinto dal primo test.");
  if (!outputBase.endsWith(".json")) throw new Error("--output deve terminare con .json.");
  const output = options.fresh ? outputBase.replace(/\.json$/, `-${new Date().toISOString().replaceAll(":", "-")}.json`) : outputBase;
  if (options.manualResults && path.resolve(options.manualResults) === output) throw new Error("Il report del ripasso deve essere distinto dal JSON manuale di partenza.");
  const csv = output.replace(/\.json$/, ".csv");
  await mkdir(path.dirname(output), { recursive: true });
  const release = await acquireLock(`${output}.lock`);
  let browser, report, session;
  let stopping = false;
  let writeChain = Promise.resolve();
  const stop = () => {
    if (!stopping) console.log("\nInterruzione richiesta: salvo tutte le prove in corso…");
    stopping = true;
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  // Serialize writes: multiple workers must never race on the same temporary file.
  const checkpoint = () => {
    const pendingWrite = writeChain.then(async () => {
      report.exportedAt = new Date().toISOString();
      report.run.counts = report.tests.reduce((counts, test) => {
        const verdict = test.automation?.verdict ?? "unknown";
        counts[verdict] = (counts[verdict] ?? 0) + 1;
        return counts;
      }, {});
      const jsonContent = JSON.stringify(report, null, 2);
      const csvContent = reportCsv(report.tests);
      await atomicWrite(output, jsonContent);
      await atomicWrite(csv, csvContent);
    });
    writeChain = pendingWrite.catch(() => {});
    return pendingWrite;
  };
  try {
    let existing;
    try { existing = JSON.parse(await readFile(output, "utf8")); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    browser = await chromium.launch({ channel: "chrome", headless: options.headless,
      handleSIGINT: false, handleSIGTERM: false,
      ignoreDefaultArgs: ["--autoplay-policy=no-user-gesture-required"] });
    const first = await openWorker(browser, options, hooks, 1);
    const { payload } = first;
    const environment = { ...options, userAgent: payload.userAgent, timeZone: payload.timeZone };
    // Concurrency is saved per session/test, not in the resume fingerprint: old
    // sequential results keep their original evidence and can be resumed unchanged.
    const config = { country: options.country, location: options.location, origin: options.origin,
      startup: options.startup, observe: options.observe, channel: options.channel,
      headless: options.headless, browser: browser.version(), userAgent: payload.userAgent, timeZone: payload.timeZone };
    if (options.recheck) { config.recheck = options.recheck; config.manualResults = options.manualResults ? path.resolve(options.manualResults) : null; }
    if (existing) assertResume(existing, config);
    let recheckChannels = null;
    if (options.recheck) {
      if (existing) {
        if (!Array.isArray(existing.run.queue)) throw new Error("Coda di ripasso non valida.");
        // Freeze the original selection on resume: completed successes must remain in its totals.
        recheckChannels = new Set(existing.run.queue.map(item => item.channelId));
      } else {
        const baseline = validateInputTests(JSON.parse(await readFile(baselinePath, "utf8")), options.country, true);
        const manualReport = options.manualResults ? JSON.parse(await readFile(options.manualResults, "utf8")) : null;
        const manual = manualReport ? validateInputTests(manualReport, options.country) : [];
        const excludedIds = manualReport?.excludedChannelIds ?? [];
        if (!Array.isArray(excludedIds) || !excludedIds.every(id => typeof id === "string")) throw new Error("Esclusioni locali non valide nel JSON manuale.");
        const excluded = new Set(excludedIds);
        const input = [...manual, ...baseline];
        recheckChannels = new Set(payload.catalog.channels.filter(channel => !excluded.has(channel.id) && needsRecheck(channel, input)).map(channel => channel.id));
        // A new official source may have no previous attempt; needsVerification includes it.
        console.log(`${recheckChannels.size} emittenti Da verificare selezionate${manual.length ? ", considerando anche i test manuali" : "; test manuali locali non inclusi"}.`);
      }
    }
    const queue = payload.catalog.channels.filter(channel => (!options.channel || channel.id === options.channel) && (!recheckChannels || recheckChannels.has(channel.id)))
      .flatMap(channel => [...new Map(channel.streams.map(stream => [stream.url, stream])).values()].map(stream => ({ channel, stream })));
    if (!queue.length) throw new Error(options.recheck ? "Nessun canale Da verificare selezionato per il ripasso." : "Nessuna fonte trovata. --channel richiede un ID esatto presente nell'API.");
    report = existing ?? { version: 1, exportedAt: null, run: { id: randomUUID(), runnerVersion: 1, startedAt: new Date().toISOString(), config }, tests: [] };
    report.run.catalog = { fetchedAt: payload.catalog.fetchedAt, sources: payload.catalog.sources, geographyWarnings: payload.catalog.geographyWarnings };
    report.run.locationBasis = "user-declared";
    report.run.queue = queue.map(item => ({ channelId: item.channel.id, channelName: item.channel.name, country: options.country, streamUrl: item.stream.url, sources: item.stream.sources }));
    report.run.status = "running";
    delete report.run.error;
    const completed = new Set(report.tests.filter(isCompleted).map(sourceKey));
    const pending = queue.filter(item => !completed.has(sourceKey({ country: options.country, channelId: item.channel.id, streamUrl: item.stream.url })));
    const targets = pending.slice(0, options.limit);
    const workerCount = Math.min(concurrency, targets.length);
    session = { id: randomUUID(), startedAt: new Date().toISOString(), requestedConcurrency: concurrency, concurrency: workerCount };
    report.run.sessions ??= [];
    report.run.sessions.push(session);
    report.run.concurrency = workerCount;
    console.log(`${queue.length} fonti; ${queue.length - pending.length} già concluse; ${pending.length} da provare; ${workerCount} prove contemporanee.`);
    console.log(`Report: ${output}\nChrome ${browser.version()}; luogo dichiarato: ${options.location}. Ctrl+C per salvare e fermare.`);
    await checkpoint();
    const created = await Promise.allSettled(Array.from({ length: Math.max(0, workerCount - 1) }, (_, index) => openWorker(browser, options, hooks, index + 2)));
    const failedCreation = created.find(result => result.status === "rejected");
    if (failedCreation) throw failedCreation.reason;
    const workers = workerCount ? [first, ...created.map(result => result.value)] : [];
    let next = 0;
    const control = { isStopping: () => stopping, fail: error => {
      stopping = true;
      process.exitCode = 1;
      report.run.error = error.message;
    }, concurrency: workerCount, sessionId: session.id };
    const results = await Promise.allSettled(workers.map(async worker => {
      try {
        while (!stopping && next < targets.length) {
          // Claim synchronously before any await; each source goes to exactly one worker.
          const index = next++;
          const item = targets[index];
          console.log(`[W${worker.workerId} ${index + 1}/${targets.length}] ${item.channel.name} · ${new URL(item.stream.url).hostname}`);
          const record = await testSource(worker, item, options, environment, control);
          const key = sourceKey(record);
          report.tests = report.tests.filter(test => sourceKey(test) !== key || isCompleted(test));
          report.tests.push(record);
          await checkpoint();
          console.log(`  W${worker.workerId} · ${record.channelName} · ${record.automation.verdict}: ${record.automation.reason}`);
          if (!stopping) await worker.page.evaluate(() => window.worldTvTester.discardRecords());
          await sleep(200);
        }
      } catch (error) { stopping = true; throw error; }
    }));
    const failure = results.find(result => result.status === "rejected");
    if (failure) throw failure.reason;
    const done = new Set(report.tests.filter(isCompleted).map(sourceKey));
    report.run.status = report.run.error ? "error" : stopping ? "paused" : queue.every(item => done.has(sourceKey({ country: options.country, channelId: item.channel.id, streamUrl: item.stream.url }))) ? "complete" : "limited";
    report.run.updatedAt = new Date().toISOString();
    session.endedAt = report.run.updatedAt;
    session.status = report.run.status;
    await checkpoint();
    console.log(`\n${report.run.status}: ${JSON.stringify(report.run.counts)}\nJSON: ${output}\nCSV: ${csv}`);
    return report;
  } catch (error) {
    if (report) {
      report.run.status = "error"; report.run.error = error.message;
      if (session) { session.endedAt = new Date().toISOString(); session.status = "error"; }
      await checkpoint();
    }
    throw error;
  } finally {
    await writeChain;
    if (browser) await browser.close().catch(() => {});
    process.off("SIGINT", stop); process.off("SIGTERM", stop);
    await release();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = optionsFrom(process.argv.slice(2));
    if (options.help) console.log(HELP);
    else await run(options);
  } catch (error) {
    console.error(`Test non completato: ${error.message}`);
    process.exitCode = 1;
  }
}
