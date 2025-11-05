import { readFile, writeFile } from "node:fs/promises";

export async function readJson(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export async function writeJson(filePath, data) {
  const json = JSON.stringify(data, null, 2);
  await writeFile(filePath, json, "utf8");
}
