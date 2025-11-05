import { ensureDirectory } from "./src/utils/fs.js";
import { writeJson } from "./src/utils/json.js";
import { resolveDataPath, distDir } from "./src/utils/paths.js";
import { buildSatnogsGeoJson } from "./src/datasources/satnogs.js";

const STATIONS_URL = "https://network.satnogs.org/stations_all/";

async function fetchStations() {
  const response = await fetch(STATIONS_URL, {
    headers: {
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": "target-models-data-repo/2.0 (+https://digitalarsenal.io)",
      Referer: "https://network.satnogs.org/",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch SatNOGS stations (${response.status})`);
  }

  return response.json();
}

async function main() {
  const stations = await fetchStations();

  await ensureDirectory(resolveDataPath("satnogs"));
  await writeJson(resolveDataPath("satnogs", "stations.json"), stations);

  const geoJson = await buildSatnogsGeoJson();
  await writeJson(resolveDataPath("satnogs.geojson.json"), geoJson);

  await ensureDirectory(`${distDir}/geojson`);
  await writeJson(
    `${distDir}/geojson/satnogs.geojson.json`,
    geoJson,
  );

  console.log(
    `Fetched SatNOGS stations (${geoJson.features.length} features).`,
  );
}

await main();
