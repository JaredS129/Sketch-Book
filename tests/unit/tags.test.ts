import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import { normaliseTags, mergeTags, readTagRegistry, writeTagRegistry } from "../../scripts/lib/tags";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("normaliseTags", () => {
  it("lowercases and trims tags", () => {
    expect(normaliseTags(["Animation", "  AUDIO  "])).toEqual(["animation", "audio"]);
  });

  it("deduplicates", () => {
    expect(normaliseTags(["demo", "Demo", "demo"])).toEqual(["demo"]);
  });

  it("filters empty and whitespace-only entries", () => {
    expect(normaliseTags(["", "   ", "valid"])).toEqual(["valid"]);
  });

  it("filters multi-word entries (contains whitespace)", () => {
    expect(normaliseTags(["two words", "single", "also bad"])).toEqual(["single"]);
  });

  it("returns empty array for all-invalid input", () => {
    expect(normaliseTags(["", "two words", "  "])).toEqual([]);
  });

  it("preserves single-character tags", () => {
    expect(normaliseTags(["a", "b", "c"])).toEqual(["a", "b", "c"]);
  });
});

describe("mergeTags", () => {
  it("returns union of both arrays, sorted", () => {
    expect(mergeTags(["animation"], ["physics"])).toEqual(["animation", "physics"]);
  });

  it("deduplicates across registry and new tags", () => {
    expect(mergeTags(["animation", "audio"], ["animation", "demo"])).toEqual([
      "animation",
      "audio",
      "demo",
    ]);
  });

  it("is case-insensitive (lowercases all)", () => {
    expect(mergeTags(["Animation"], ["ANIMATION", "physics"])).toEqual([
      "animation",
      "physics",
    ]);
  });

  it("returns sorted result", () => {
    expect(mergeTags(["z-tag", "a-tag"], ["m-tag"])).toEqual(["a-tag", "m-tag", "z-tag"]);
  });

  it("handles empty arrays", () => {
    expect(mergeTags([], [])).toEqual([]);
    expect(mergeTags(["animation"], [])).toEqual(["animation"]);
    expect(mergeTags([], ["physics"])).toEqual(["physics"]);
  });
});

describe("readTagRegistry", () => {
  it("returns [] when registry file is absent", () => {
    vi.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });
    expect(readTagRegistry()).toEqual([]);
  });

  it("returns [] when registry file contains invalid JSON", () => {
    vi.spyOn(fs, "readFileSync").mockImplementation(() => "not json");
    expect(readTagRegistry()).toEqual([]);
  });

  it("returns [] when registry file contains non-array JSON", () => {
    vi.spyOn(fs, "readFileSync").mockImplementation(() => JSON.stringify({ tags: [] }));
    expect(readTagRegistry()).toEqual([]);
  });
});

describe("writeTagRegistry", () => {
  it("writes sorted, deduplicated JSON array ending with newline", () => {
    const spy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    writeTagRegistry(["physics", "animation", "animation", "demo"]);
    expect(spy).toHaveBeenCalledOnce();
    const written = spy.mock.calls[0]![1] as string;
    expect(JSON.parse(written)).toEqual(["animation", "demo", "physics"]);
    expect(written.endsWith("\n")).toBe(true);
  });
});
