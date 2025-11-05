export function pointFeature([longitude, latitude], properties = {}) {
  if (
    typeof longitude !== "number" ||
    Number.isNaN(longitude) ||
    typeof latitude !== "number" ||
    Number.isNaN(latitude)
  ) {
    throw new Error("Invalid coordinates for point feature");
  }

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    properties,
  };
}

export function featureCollection(features) {
  return {
    type: "FeatureCollection",
    features,
  };
}
