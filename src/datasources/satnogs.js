import { featureCollection, pointFeature } from "../utils/geojson.js";
import { resolveDataPath } from "../utils/paths.js";
import { readJson } from "../utils/json.js";

const SOURCE_FILE = resolveDataPath("satnogs", "stations.json");

function removeEmpty(props) {
  return Object.fromEntries(
    Object.entries(props).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

export async function buildSatnogsGeoJson() {
  const stations = await readJson(SOURCE_FILE);
  const features = [];

  for (const station of stations) {
    const latitude = Number.parseFloat(station.lat);
    const longitude = Number.parseFloat(station.lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue;
    }

    const properties = removeEmpty({
      id: station.id,
      name: station.name,
      status: station.status,
      network: "SatNOGS",
      altitude: station.altitude,
      url: station.url,
      source: "data/satnogs/stations.json",
    });

    features.push(pointFeature([longitude, latitude], properties));
  }

  return featureCollection(features);
}

export default async function generateSatnogs(writer) {
  const collection = await buildSatnogsGeoJson();
  await writer("satnogs.geojson.json", collection);
}
