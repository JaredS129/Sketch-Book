/**
 * Tests for the business logic backing the sketch API endpoints.
 * Each test exercises the operations that the middleware delegates to,
 * verifying filesystem state as the contracts/sketch-management-api.md specifies.
 */
import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "../helpers";
import { parseMeta } from "../../scripts/lib/meta";
import { sketchDir, SKETCH_TEMPLATES, EXTRA_TEMPLATES } from "../../scripts/lib/paths";
import { readMeta, writeMeta } from "../../scripts/lib/meta-io";
import { isValidSlug } from "../../scripts/lib/slug";
import { SKETCH_TYPES, type SketchType } from "../../scripts/lib/meta";
import { editSketch } from "../../scripts/lib/edit-sketch-op";

const TODAY = "2026-01-01";
const BASE_META = {
  dateCreated: TODAY,
  dateUpdated: TODAY,
  createdBy: "tester",
  lastUpdatedBy: "tester",
};

const IDS: string[] = [];

function registerCleanup(id: string) {
  IDS.push(id);
  return id;
}

function makeSketch(id: string, name: string, type: SketchType = "p5") {
  registerCleanup(id);
  const dir = sketchDir(id);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(SKETCH_TEMPLATES[type], path.join(dir, "sketch.ts"));
  for (const { tmpl, dest } of EXTRA_TEMPLATES[type] ?? []) {
    fs.copyFileSync(tmpl, path.join(dir, dest));
  }
  writeMeta(id, parseMeta({ id, name, type, ...BASE_META }));
  return dir;
}

/** Simulate create endpoint logic. Returns { ok, error? }. */
function createOp(body: Record<string, unknown>): { ok: boolean; error?: string } {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const type = body.type as string;

  if (!name) return { ok: false, error: "name is required" };
  if (!id) return { ok: false, error: "id is required" };
  if (!isValidSlug(id)) return { ok: false, error: "invalid id: must be kebab-case slug" };
  if (!(SKETCH_TYPES as readonly string[]).includes(type))
    return { ok: false, error: "invalid type" };

  const dir = sketchDir(id);
  if (fs.existsSync(dir)) return { ok: false, error: `sketch '${id}' already exists` };

  registerCleanup(id);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(SKETCH_TEMPLATES[type as SketchType], path.join(dir, "sketch.ts"));
  for (const { tmpl, dest } of EXTRA_TEMPLATES[type as SketchType] ?? []) {
    fs.copyFileSync(tmpl, path.join(dir, dest));
  }
  writeMeta(id, parseMeta({ id, name, type: type as SketchType, ...BASE_META, createdBy: "api-test", lastUpdatedBy: "api-test" }));
  return { ok: true };
}

/** Simulate duplicate endpoint logic. */
function duplicateOp(
  sourceId: string,
  body: Record<string, unknown>,
): { ok: boolean; error?: string } {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const id = typeof body.id === "string" ? body.id.trim() : "";

  if (!name) return { ok: false, error: "name is required" };
  if (!id) return { ok: false, error: "id is required" };
  if (!isValidSlug(id)) return { ok: false, error: "invalid id: must be kebab-case slug" };

  const sourceDir = sketchDir(sourceId);
  if (!fs.existsSync(sourceDir))
    return { ok: false, error: `source sketch '${sourceId}' not found` };

  const destDir = sketchDir(id);
  if (fs.existsSync(destDir)) return { ok: false, error: `sketch '${id}' already exists` };

  const sourceMeta = readMeta(sourceId);
  registerCleanup(id);
  fs.cpSync(sourceDir, destDir, { recursive: true });
  writeMeta(id, parseMeta({ id, name, type: sourceMeta.type, ...BASE_META, createdBy: "api-test", lastUpdatedBy: "api-test" }));
  return { ok: true };
}

/** Simulate delete endpoint logic. */
function deleteOp(id: string): { ok: boolean; error?: string } {
  const dir = sketchDir(id);
  if (!fs.existsSync(dir)) return { ok: false, error: `sketch '${id}' not found` };
  fs.rmSync(dir, { recursive: true, force: true });
  return { ok: true };
}

afterEach(() => {
  while (IDS.length) {
    const id = IDS.pop()!;
    fs.rmSync(path.join(REPO_ROOT, "sketches", id), { recursive: true, force: true });
  }
});

// ---------- CREATE ----------

describe("create endpoint", () => {
  it("happy path: creates folder, sketch.ts and meta.json", () => {
    const result = createOp({ name: "API Create Test", id: "api-create-test", type: "p5" });
    expect(result.ok).toBe(true);

    const dir = sketchDir("api-create-test");
    expect(fs.existsSync(path.join(dir, "sketch.ts"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "meta.json"))).toBe(true);

    const meta = readMeta("api-create-test");
    expect(meta.id).toBe("api-create-test");
    expect(meta.name).toBe("API Create Test");
    expect(meta.type).toBe("p5");
  });

  it("rejects empty name", () => {
    const result = createOp({ name: "", id: "api-empty-name", type: "p5" });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/name is required/);
  });

  it("rejects empty id", () => {
    const result = createOp({ name: "Test", id: "", type: "p5" });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/id is required/);
  });

  it("rejects invalid slug as id", () => {
    const result = createOp({ name: "Test", id: "INVALID SLUG!", type: "p5" });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/invalid id/);
  });

  it("rejects existing id (conflict)", () => {
    makeSketch("api-conflict-test", "Existing");
    const result = createOp({ name: "Conflict", id: "api-conflict-test", type: "p5" });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/already exists/);
  });

  it("rejects invalid type", () => {
    const result = createOp({ name: "Test", id: "api-bad-type", type: "canvas2d" });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/invalid type/);
  });
});

// ---------- DUPLICATE ----------

describe("duplicate endpoint", () => {
  it("happy path: copies all files and writes fresh meta.json", () => {
    makeSketch("api-dup-source", "Source Sketch");

    const result = duplicateOp("api-dup-source", {
      name: "Source Sketch - Copy",
      id: "api-dup-copy",
    });
    expect(result.ok).toBe(true);

    expect(fs.existsSync(path.join(sketchDir("api-dup-copy"), "sketch.ts"))).toBe(true);
    const meta = readMeta("api-dup-copy");
    expect(meta.id).toBe("api-dup-copy");
    expect(meta.name).toBe("Source Sketch - Copy");
    expect(meta.type).toBe("p5"); // inherited from source
  });

  it("new sketch inherits source type", () => {
    makeSketch("api-dup-q5-source", "Q5 Source", "q5");
    duplicateOp("api-dup-q5-source", { name: "Q5 Copy", id: "api-dup-q5-copy" });

    const meta = readMeta("api-dup-q5-copy");
    expect(meta.type).toBe("q5");
  });

  it("rejects missing source", () => {
    const result = duplicateOp("api-dup-nonexistent", { name: "Copy", id: "api-dup-copy-ne" });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not found/);
  });

  it("rejects conflicting destination id", () => {
    makeSketch("api-dup-conflict-src", "Conflict Src");
    makeSketch("api-dup-conflict-dst", "Conflict Dst");

    const result = duplicateOp("api-dup-conflict-src", {
      name: "Conflict Copy",
      id: "api-dup-conflict-dst",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/already exists/);
    // Source unchanged
    expect(fs.existsSync(sketchDir("api-dup-conflict-src"))).toBe(true);
  });
});

// ---------- EDIT ----------

describe("edit endpoint", () => {
  it("name-only change (no folder rename)", () => {
    makeSketch("api-edit-name", "Old Name");
    editSketch({ id: "api-edit-name", name: "New Name", type: "p5" });
    expect(readMeta("api-edit-name").name).toBe("New Name");
    expect(fs.existsSync(sketchDir("api-edit-name"))).toBe(true);
  });

  it("type-only change", () => {
    makeSketch("api-edit-type", "Same Name");
    editSketch({ id: "api-edit-type", name: "Same Name", type: "q5" });
    expect(readMeta("api-edit-type").type).toBe("q5");
  });

  it("slug rename: old folder gone, new folder present with correct meta id", () => {
    makeSketch("api-edit-old-id", "Rename Test");
    registerCleanup("api-edit-new-id");

    editSketch({ id: "api-edit-old-id", name: "Renamed", newId: "api-edit-new-id", type: "p5" });

    expect(fs.existsSync(sketchDir("api-edit-old-id"))).toBe(false);
    expect(fs.existsSync(sketchDir("api-edit-new-id"))).toBe(true);
    expect(readMeta("api-edit-new-id").id).toBe("api-edit-new-id");
  });

  it("rejects conflict on newId that already exists", () => {
    makeSketch("api-edit-c-src", "Source");
    makeSketch("api-edit-c-dst", "Destination");

    expect(() =>
      editSketch({ id: "api-edit-c-src", name: "Source", newId: "api-edit-c-dst", type: "p5" }),
    ).toThrow(/already exists/);
    expect(fs.existsSync(sketchDir("api-edit-c-src"))).toBe(true);
  });

  it("rejects source-not-found", () => {
    expect(() =>
      editSketch({ id: "api-edit-missing", name: "X", type: "p5" }),
    ).toThrow(/not found/);
  });

  it("rejects invalid newId slug pattern", () => {
    makeSketch("api-edit-bad-slug", "Bad Slug Src");
    expect(() =>
      editSketch({ id: "api-edit-bad-slug", name: "X", newId: "INVALID SLUG!", type: "p5" }),
    ).toThrow(/invalid newId/);
  });
});

// ---------- DELETE ----------

describe("delete endpoint", () => {
  it("happy path: removes folder and contents", () => {
    makeSketch("api-delete-target", "Delete Me");
    const result = deleteOp("api-delete-target");
    expect(result.ok).toBe(true);
    expect(fs.existsSync(sketchDir("api-delete-target"))).toBe(false);
  });

  it("returns error when sketch not found", () => {
    const result = deleteOp("api-delete-nonexistent");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not found/);
  });
});
