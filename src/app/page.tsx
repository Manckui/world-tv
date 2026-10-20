import { OrbitaExplorer } from "@/components/orbita/OrbitaExplorer";
import { StreamTestHarness } from "@/components/StreamTestHarness";
import { loadMapCountries } from "@/lib/load-map-countries";

export default async function Home({ searchParams }: PageProps<"/">) {
  // Preserve the existing stream runner's URL and browser bridge.
  if (process.env.NODE_ENV === "development" && (await searchParams)["stream-test"] === "1") return <StreamTestHarness />;
  return <OrbitaExplorer countries={await loadMapCountries()} />;
}
