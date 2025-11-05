import { sensors } from "../../raw/sensors.js";
import { readJson } from "../utils/json.js";
import { featureCollection, pointFeature } from "../utils/geojson.js";
import { resolveRawPath } from "../utils/paths.js";
import { toFeatureCoordinates } from "../utils/coordinates.js";

const HOBBY_FILE = resolveRawPath("json", "hobby_sosi.json");
const PRC_FILE = resolveRawPath("json", "prc_sosi.json");

function removeEmpty(props) {
  return Object.fromEntries(
    Object.entries(props).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

function deviceToFeature(id, device) {
  const coordinates = toFeatureCoordinates(device.lat, device.lon);
  if (!coordinates) {
    return null;
  }

  const properties = removeEmpty({
    id,
    name: device.name,
    abbrev: device.objName,
    type: device.type,
    country: device.country,
    operator: device.operator,
    system: device.system,
    altitude: device.alt,
    source: "raw/sensors.js",
  });

  return pointFeature(coordinates, properties);
}

function hobbyistToFeature(entry) {
  const coordinates = toFeatureCoordinates(entry.Lat, entry.Lon);
  if (!coordinates) {
    return null;
  }

  const properties = removeEmpty({
    id: entry.SensorID ?? entry.Name,
    name: entry.Name,
    type: "HOBBYIST",
    altitude: entry["Alt (m)"],
    source: "raw/json/hobby_sosi.json",
  });

  return pointFeature(coordinates, properties);
}

function prcToFeature(entry) {
  const coordinates = toFeatureCoordinates(
    entry["Lat (degrees)"],
    entry["Long (degrees)"],
  );
  if (!coordinates) {
    return null;
  }

  const properties = removeEmpty({
    id: entry["Site Name"],
    name: entry["Site Name"],
    type: entry["Facility Type"],
    country: entry.Country ?? "China",
    source: "raw/json/prc_sosi.json",
  });

  return pointFeature(coordinates, properties);
}

export async function buildSosiGeoJson() {
  const features = [];

  for (const [id, device] of Object.entries(sensors)) {
    const feature = deviceToFeature(id, device);
    if (feature) features.push(feature);
  }

  const hobbyists = await readJson(HOBBY_FILE);
  for (const entry of hobbyists) {
    const feature = hobbyistToFeature(entry);
    if (feature) features.push(feature);
  }

  const prcSites = await readJson(PRC_FILE);
  for (const entry of prcSites) {
    const feature = prcToFeature(entry);
    if (feature) features.push(feature);
  }

  return featureCollection(features);
}

export default async function generateSosi(writer) {
  const collection = await buildSosiGeoJson();
  await writer("sosi.geojson.json", collection);
}
