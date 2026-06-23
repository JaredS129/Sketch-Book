import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "../helpers";
import { parseMeta } from "../../scripts/lib/meta";
import { sketchDir, SKETCH_TEMPLATES } from "../../scripts/lib/paths";
import { writeMeta } from "../../scripts/lib/meta-io";
import { editSketch } from "../../scripts/lib/edit-sketch-op";

const TODAY = "2026-01-01";
const BASE_META = {
  dateCreated: TODAY,
  dateUpdated: TODAY,
  createdBy: "ci-bot",
  lastUpdatedBy: "ci-bot",
};

function makeSketch(id: string, name: string, type: "p5" | "q5" = "p5") {
  const dir = sketchDir(id);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(SKETCH_TEMPLATES[type], path.join(dir, "sketch.ts"));
  writeMeta(id, parseMeta({ id, name, type, ...BASE_META }));
  return dir;
}

const IDS: string[] = [];
function fixture(id: string, name: string, type: "p5" | "q5" = "p5") {
  IDS.push(id);
  return makeSketch(id, name, type);
}

afterEach(() => {
  while (IDS.length) {
    const id = IDS.pop()!;
    fs.rmSync(path.join(REPO_ROOT, "sketches", id), { recursive: true, force: true });
  }
});

describe("editSketch", () => {
  it("updates name only (no folder rename)", () => {
    fixture("edit-op-name-only", "Original");
    editSketch({ id: "edit-op-name-only", name: "Updated", type: "p5" });

    const meta = parseMeta(
      JSON.parse(fs.readFileSync(path.join(sketchDir("edit-op-name-only"), "meta.json"), "utf8")),
    );
    expect(meta.name).toBe("Updated");
    expect(meta.id).toBe("edit-op-name-only");
    expect(meta.type).toBe("p5");
  });

  it("updates type only", () => {
    fixture("edit-op-type-only", "Type Test");
    editSketch({ id: "edit-op-type-only", name: "Type Test", type: "q5" });

    const meta = parseMeta(
      JSON.parse(fs.readFileSync(path.join(sketchDir("edit-op-type-only"), "meta.json"), "utf8")),
    );
    expect(meta.type).toBe("q5");
    expect(meta.name).toBe("Type Test");
  });

  it("renames folder when newId differs from id", () => {
    fixture("edit-op-old-slug", "Rename Me");
    IDS.push("edit-op-new-slug");

    editSketch({ id: "edit-op-old-slug", name: "Renamed", newId: "edit-op-new-slug", type: "p5" });

    expect(fs.existsSync(sketchDir("edit-op-old-slug"))).toBe(false);
    expect(fs.existsSync(sketchDir("edit-op-new-slug"))).toBe(true);

    const meta = parseMeta(
      JSON.parse(fs.readFileSync(path.join(sketchDir("edit-op-new-slug"), "meta.json"), "utf8")),
    );
    expect(meta.id).toBe("edit-op-new-slug");
    expect(meta.name).toBe("Renamed");
  });

  it("preserves dateCreated, createdBy, dateUpdated, lastUpdatedBy after edit", () => {
    fixture("edit-op-preserve-ci", "CI Fields");
    editSketch({ id: "edit-op-preserve-ci", name: "Changed Name", type: "p5" });

    const meta = parseMeta(
      JSON.parse(fs.readFileSync(path.join(sketchDir("edit-op-preserve-ci"), "meta.json"), "utf8")),
    );
    expect(meta.dateCreated).toBe(TODAY);
    expect(meta.createdBy).toBe("ci-bot");
    expect(meta.dateUpdated).toBe(TODAY);
    expect(meta.lastUpdatedBy).toBe("ci-bot");
  });

  it("throws when source sketch does not exist", () => {
    expect(() =>
      editSketch({ id: "edit-op-nonexistent", name: "X", type: "p5" }),
    ).toThrow(/not found/);
  });

  it("throws on conflict when newId already exists", () => {
    fixture("edit-op-conflict-src", "Source");
    fixture("edit-op-conflict-dst", "Destination");

    expect(() =>
      editSketch({
        id: "edit-op-conflict-src",
        name: "Source",
        newId: "edit-op-conflict-dst",
        type: "p5",
      }),
    ).toThrow(/already exists/);

    // Source folder must remain intact
    expect(fs.existsSync(sketchDir("edit-op-conflict-src"))).toBe(true);
  });

  it("throws on invalid newId slug pattern", () => {
    fixture("edit-op-bad-slug-src", "Bad Slug");
    expect(() =>
      editSketch({ id: "edit-op-bad-slug-src", name: "Bad Slug", newId: "INVALID SLUG!", type: "p5" }),
    ).toThrow(/invalid newId/);
    // Source folder must remain intact
    expect(fs.existsSync(sketchDir("edit-op-bad-slug-src"))).toBe(true);
  });

  it("throws on empty name", () => {
    fixture("edit-op-empty-name", "Has Name");
    expect(() =>
      editSketch({ id: "edit-op-empty-name", name: "  ", type: "p5" }),
    ).toThrow(/name is required/);
  });

  it("throws on invalid type", () => {
    fixture("edit-op-bad-type", "Has Type");
    expect(() =>
      // @ts-expect-error intentional invalid type
      editSketch({ id: "edit-op-bad-type", name: "Has Type", type: "invalid" }),
    ).toThrow(/invalid type/);
  });
});
