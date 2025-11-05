import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const projectRoot = join(__dirname, "..", "..");
export const dataDir = join(projectRoot, "data");
export const rawDir = join(projectRoot, "raw");
export const distDir = join(projectRoot, "dist");

export function resolveDataPath(...segments) {
  return join(dataDir, ...segments);
}

export function resolveRawPath(...segments) {
  return join(rawDir, ...segments);
}
