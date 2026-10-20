import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { COUNTRIES } from "@/lib/countries";
import { mergeSourceAttempts, summarizeAutomaticReport, type AutomaticReport } from "@/lib/automatic-results";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("country")?.toUpperCase();
  const country = COUNTRIES.find(item => item.code === code);
  const headers = { "Cache-Control": "no-store" };
  if (!country) return Response.json({ error: "Paese non supportato." }, { status: 400, headers });
  try {
    // The country allowlist fixes the filename; no arbitrary path or stream fetching.
    async function readReport(name: string): Promise<AutomaticReport | null> {
      try {
        const filename = path.join(process.cwd(), "reports", name);
        return summarizeAutomaticReport(JSON.parse(await readFile(filename, "utf8")), country!.code);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
      }
    }
    const [baseline, recheck] = await Promise.allSettled([readReport(`streams-${country.code}.json`), readReport(`streams-${country.code}-recheck.json`)]);
    // Later targeted retests (scripts/probe-channels.mjs): reports/retest-<date>-<country>.json
    const retestNames = (await readdir(path.join(process.cwd(), "reports")).catch(() => [] as string[]))
      .filter(name => new RegExp(`^retest-[\\w-]+-${country.code}\\.json$`).test(name));
    const retests = await Promise.allSettled(retestNames.map(readReport));
    if (baseline.status === "rejected") throw baseline.reason;
    const primary = baseline.value;
    const retry = recheck.status === "fulfilled" ? recheck.value : null;
    const report: AutomaticReport = primary ?? retry ?? { country: country.code, status: "missing", exportedAt: null,
      testerLocation: "", total: 0, completed: 0, results: [] };
    if (retry) {
      report.results = mergeSourceAttempts(primary?.results ?? [], retry.results);
      report.recheck = { status: retry.status, exportedAt: retry.exportedAt, total: retry.total, completed: retry.completed, testerLocation: retry.testerLocation };
    }
    const retestResults = retests.flatMap(result => result.status === "fulfilled" && result.value ? result.value.results : []);
    if (retestResults.length) report.results = mergeSourceAttempts(report.results, retestResults);
    if (retests.some(result => result.status === "rejected")) report.warnings = [...report.warnings ?? [], "Un report di ritest non è leggibile ed è stato ignorato."];
    if (recheck.status === "rejected") report.warnings = [...report.warnings ?? [], "Report del ripasso non leggibile: sono mostrati gli esiti del primo test."];
    return Response.json(report, { headers });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      const empty: AutomaticReport = { country: country.code, status: "missing", exportedAt: null,
        testerLocation: "", total: 0, completed: 0, results: [] };
      return Response.json(empty, { headers });
    }
    return Response.json({ error: "Impossibile leggere il report automatico. I test manuali restano disponibili." }, { status: 500, headers });
  }
}
