import { join } from "node:path";
import { dataSources } from "./datasources/index.js";
import { ensureDirectory } from "./utils/fs.js";
import { distDir } from "./utils/paths.js";
import { writeJson } from "./utils/json.js";

async function main() {
  const outputDir = join(distDir, "geojson");
  await ensureDirectory(outputDir);

  const summaries = [];

  for (const { name, generate } of dataSources) {
    const record = { name };
    const writer = async (fileName, data) => {
      const outputPath = join(outputDir, fileName);
      await writeJson(outputPath, data);
      record.outputPath = outputPath;
      record.featureCount = Array.isArray(data.features)
        ? data.features.length
        : undefined;
    };

    await generate(writer);
    summaries.push(record);
  }

  logSummary(summaries);
}

function logSummary(rows) {
  console.log("Generated GeoJSON data sources:");
  for (const row of rows) {
    console.log(
      `• ${row.name}: ${row.featureCount ?? "?"} features -> ${row.outputPath}`,
    );
  }
}

await main();
