import fs from "node:fs";
import path from "node:path";
import { SKETCHES_DIR } from "./paths";

export const REGISTRY_PATH = path.join(SKETCHES_DIR, "tags.json");

export function readTagRegistry(): string[] {
  try {
    const raw = fs.readFileSync(REGISTRY_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as string[];
    return [];
  } catch {
    return [];
  }
}

export function writeTagRegistry(tags: string[]): void {
  const sorted = [...new Set(tags)].sort();
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(sorted, null, 2) + "\n", "utf8");
}

export function mergeTags(registry: string[], newTags: string[]): string[] {
  const merged = new Set([...registry, ...newTags].map((t) => t.toLowerCase()));
  return [...merged].sort();
}

export function normaliseTags(input: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of input) {
    const tag = raw.trim().toLowerCase();
    if (!tag) continue;
    if (/\s/.test(tag)) continue;
    if (seen.has(tag)) continue;
    seen.add(tag);
    result.push(tag);
  }
  return result;
}
