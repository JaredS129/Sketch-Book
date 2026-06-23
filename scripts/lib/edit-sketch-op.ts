import fs from "node:fs";
import { isValidSlug } from "./slug";
import { sketchDir } from "./paths";
import { readMeta, writeMeta } from "./meta-io";
import { SKETCH_TYPES, type SketchType } from "./meta";

export interface EditSketchOptions {
  id: string;
  name: string;
  newId?: string;
  type: SketchType;
  tags?: string[];
}

/**
 * Edit a sketch's metadata in place. If newId differs from id, the sketch
 * folder is renamed atomically on the local filesystem before writing meta.
 * Preserves dateCreated, createdBy, dateUpdated, lastUpdatedBy.
 */
export function editSketch({ id, name, newId, type, tags }: EditSketchOptions): void {
  // Validate inputs
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("name is required");
  if (!(SKETCH_TYPES as readonly string[]).includes(type))
    throw new Error("invalid type");
  if (newId !== undefined) {
    if (!newId) throw new Error("newId must not be empty if provided");
    if (!isValidSlug(newId))
      throw new Error("invalid newId: must be kebab-case slug");
  }

  // Check source exists
  const sourceDir = sketchDir(id);
  if (!fs.existsSync(sourceDir))
    throw new Error(`sketch '${id}' not found`);

  const finalId = newId && newId !== id ? newId : id;

  // Conflict-check when renaming
  if (finalId !== id) {
    const targetDir = sketchDir(finalId);
    if (fs.existsSync(targetDir))
      throw new Error(`sketch '${finalId}' already exists`);
    fs.renameSync(sourceDir, targetDir);
  }

  // Preserve CI-only fields, update editable ones
  const existingMeta = readMeta(finalId);
  writeMeta(finalId, {
    ...existingMeta,
    id: finalId,
    name: trimmedName,
    type,
    ...(tags !== undefined ? { tags } : {}),
  });
}
