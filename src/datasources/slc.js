import { readJson } from "../utils/json.js";
import { featureCollection, pointFeature } from "../utils/geojson.js";
import { resolveRawPath } from "../utils/paths.js";
import { toFeatureCoordinates } from "../utils/coordinates.js";

const SOURCE_FILE = resolveRawPath("json", "slc.json");

function removeEmpty(props) {
  return Object.fromEntries(
    Object.entries(props).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

export async function buildSlcGeoJson() {
  const entries = await readJson(SOURCE_FILE);
  const features = [];

  for (const entry of entries) {
    const coordinates = toFeatureCoordinates(entry.latitude, entry.longitude);
    if (!coordinates) {
      continue;
    }

    const properties = removeEmpty({
      name: entry["Facility Name"],
      country: entry.Country,
      region: entry.Region,
      source: "raw/json/slc.json",
    });

    features.push(pointFeature(coordinates, properties));
  }

  return featureCollection(features);
}

export default async function generateSlc(writer) {
  const collection = await buildSlcGeoJson();
  await writer("slc.geojson.json", collection);
}
