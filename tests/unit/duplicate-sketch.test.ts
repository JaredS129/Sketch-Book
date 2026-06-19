import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { runScript, REPO_ROOT } from "../helpers";
import { parseMeta } from "../../scripts/lib/meta";

const SOURCE_NAME = "Vitest Dup Source";
const SOURCE_ID = "vitest-dup-source";
const sourceDir = path.join(REPO_ROOT, "sketches", SOURCE_ID);

// ids that the various cases produce, all cleaned up after each test
const DEFAULT_COPY_ID = "vitest-dup-source-copy"; // "<name> - Copy"
const NAMED_COPY_ID = "vitest-dup-target";

const dirFor = (id: string) => path.join(REPO_ROOT, "sketches", id);

function cleanup() {
  for (const id of [SOURCE_ID, DEFAULT_COPY_ID, NAMED_COPY_ID]) {
    fs.rmSync(dirFor(id), { recursive: true, force: true });
  }
}

afterEach(cleanup);

/** Create the source sketch and give its sketch.ts a marker we can assert copied. */
function seedSource(): void {
  expect(runScript("create-sketch.ts", [SOURCE_NAME]).code).toBe(0);
  fs.writeFileSync(path.join(sourceDir, "sketch.ts"), "// MARKER\n", "utf8");
}

describe("duplicate-sketch", () => {
  it('defaults the new name to "<source name> - Copy" and copies the code', () => {
    seedSource();
    const res = runScript("duplicate-sketch.ts", [SOURCE_NAME]);
    expect(res.code).toBe(0);

    const copyDir = dirFor(DEFAULT_COPY_ID);
    expect(fs.readFileSync(path.join(copyDir, "sketch.ts"), "utf8")).toBe("// MARKER\n");

    const meta = parseMeta(
      JSON.parse(fs.readFileSync(path.join(copyDir, "meta.json"), "utf8")),
    );
    expect(meta.id).toBe(DEFAULT_COPY_ID);
    expect(meta.name).toBe(`${SOURCE_NAME} - Copy`);
    expect(meta.dateUpdated).toBe(meta.dateCreated);
    expect(meta.lastUpdatedBy).toBe(meta.createdBy);
  });

  it("uses the provided new name when given", () => {
    seedSource();
    const res = runScript("duplicate-sketch.ts", [SOURCE_NAME, "Vitest Dup Target"]);
    expect(res.code).toBe(0);

    const meta = parseMeta(
      JSON.parse(fs.readFileSync(path.join(dirFor(NAMED_COPY_ID), "meta.json"), "utf8")),
    );
    expect(meta.id).toBe(NAMED_COPY_ID);
    expect(meta.name).toBe("Vitest Dup Target");
  });

  it("accepts the source by id as well as display name", () => {
    seedSource();
    const res = runScript("duplicate-sketch.ts", [SOURCE_ID, "Vitest Dup Target"]);
    expect(res.code).toBe(0);
    expect(fs.existsSync(dirFor(NAMED_COPY_ID))).toBe(true);
  });

  it("fails with usage when no source is given (no mutation)", () => {
    const res = runScript("duplicate-sketch.ts", []);
    expect(res.code).not.toBe(0);
    expect(res.output).toMatch(/Usage/);
  });

  it("fails when the source does not exist", () => {
    const res = runScript("duplicate-sketch.ts", ["no-such-sketch"]);
    expect(res.code).not.toBe(0);
    expect(res.output).toMatch(/not found/);
  });

  it("refuses to overwrite an existing target", () => {
    seedSource();
    expect(runScript("duplicate-sketch.ts", [SOURCE_NAME, "Vitest Dup Target"]).code).toBe(0);
    const res = runScript("duplicate-sketch.ts", [SOURCE_NAME, "Vitest Dup Target"]);
    expect(res.code).not.toBe(0);
    expect(res.output).toMatch(/already exists/);
  });
});
