import { ensureDirectory } from "./src/utils/fs.js";
import { writeJson } from "./src/utils/json.js";
import { resolveDataPath } from "./src/utils/paths.js";

const LAUNCH_TSV_URL = "http://nssdc.planet4589.com/space/gcat/tsv/launch/launch.tsv";

async function fetchLaunchTsv() {
  const response = await fetch(LAUNCH_TSV_URL, {
    headers: {
      "User-Agent": "target-models-data-repo/2.0 (+https://digitalarsenal.io)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download GCAT launch TSV (${response.status})`);
  }

  return response.text();
}

function parseLaunchTsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { lastUpdated: null, records: [] };
  }

  const headerLine = lines[0];
  const headers = headerLine.slice(1).split("\t");

  const metaLine = lines[1];
  const lastUpdatedMatch = metaLine.match(/Updated\s+(.*)$/);
  const lastUpdated = lastUpdatedMatch ? lastUpdatedMatch[1].trim() : null;

  const records = lines.slice(2).map((line) => {
    const values = line.split("\t");
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = values[index] ?? null;
    });
    return entry;
  });

  return { lastUpdated, records };
}

async function main() {
  const tsv = await fetchLaunchTsv();
  const parsed = parseLaunchTsv(tsv);

  await ensureDirectory(resolveDataPath("gcat"));
  await writeJson(resolveDataPath("gcat", "launch.tsv.json"), parsed);

  console.log(
    `Fetched GCAT launch catalog (${parsed.records.length} rows, updated ${parsed.lastUpdated ?? "unknown"}).`,
  );
}

await main();
