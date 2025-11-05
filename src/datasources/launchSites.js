import { readFile } from "node:fs/promises";
import { featureCollection, pointFeature } from "../utils/geojson.js";
import { resolveRawPath } from "../utils/paths.js";
import { parseCoordinate } from "../utils/coordinates.js";

const SOURCE_FILE = resolveRawPath("launchsites.csv");

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function removeEmpty(props) {
  return Object.fromEntries(
    Object.entries(props).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

export async function buildLaunchSiteGeoJson() {
  const file = await readFile(SOURCE_FILE, "utf8");
  const lines = file.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);

  const features = [];
  for (let i = 1; i < lines.length; i += 1) {
    const row = parseCsvLine(lines[i]);
    if (row.length === 0) continue;

    const record = Object.create(null);
    headers.forEach((header, index) => {
      record[header.trim()] = row[index]?.trim?.() ?? row[index];
    });

    const latitude = parseCoordinate(record.Latitude);
    const longitude = parseCoordinate(record.Longitude);
    if (latitude === null || longitude === null) {
      continue;
    }

    const properties = removeEmpty({
      name: record.Name,
      country: record.Country,
      notes: record.Notes,
      source: "raw/launchsites.csv",
    });

    features.push(pointFeature([longitude, latitude], properties));
  }

  return featureCollection(features);
}

export default async function generateLaunchSites(writer) {
  const collection = await buildLaunchSiteGeoJson();
  await writer("launchsites.geojson.json", collection);
}
