import { mkdir } from "node:fs/promises";

export async function ensureDirectory(path) {
  await mkdir(path, { recursive: true });
}
