export function parseCoordinate(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = String(value)
    .trim()
    .replace(/\u00a0/g, " ")
    .replace(/,/g, ".");

  if (!trimmed) return null;

  const match = trimmed.match(
    /^(-?\d+(?:\.\d+)?)(?:\s*[°º]?)\s*([NSEW])?$/i,
  );
  if (match) {
    const magnitude = Number.parseFloat(match[1]);
    if (!Number.isFinite(magnitude)) return null;
    const direction = match[2]?.toUpperCase();
    if (direction === "S" || direction === "W") {
      return -Math.abs(magnitude);
    }
    return Math.abs(magnitude);
  }

  const numericValue = Number.parseFloat(trimmed);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function toFeatureCoordinates(lat, lon) {
  const latitude = parseCoordinate(lat);
  const longitude = parseCoordinate(lon);

  if (latitude === null || longitude === null) {
    return null;
  }

  return [longitude, latitude];
}
