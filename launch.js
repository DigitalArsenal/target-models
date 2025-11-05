import { resolveDataPath, distDir } from "./src/utils/paths.js";
import { ensureDirectory } from "./src/utils/fs.js";
import { writeJson } from "./src/utils/json.js";
import { buildLaunchSiteGeoJson } from "./src/datasources/launchSites.js";

async function main() {
  const geoJson = await buildLaunchSiteGeoJson();

  await ensureDirectory(resolveDataPath());
  await writeJson(resolveDataPath("launchsites.geojson.json"), geoJson);

  // Keep dist output in sync so downstream bundles can import directly.
  await ensureDirectory(`${distDir}/geojson`);
  await writeJson(
    `${distDir}/geojson/launchsites.geojson.json`,
    geoJson,
  );

  console.log(
    `Generated launch site GeoJSON (${geoJson.features.length} features).`,
  );
}

await main();

