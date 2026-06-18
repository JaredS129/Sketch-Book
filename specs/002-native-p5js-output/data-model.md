# Phase 1 Data Model: Native p5.js Output

**Date**: 2026-06-18 | **Feature**: 002-native-p5js-output

No database and **no new persisted files**. This feature adds **derived, in-memory values**
produced from an existing Sketch's source at view/build time. The entities below describe
the runtime data shapes the converter and panel exchange — not on-disk records.

---

## Entity: Sketch Source (input)

The raw text of an existing sketch module, loaded via Vite `?raw`.

| Part | Type | Description | Source of truth |
|------|------|-------------|-----------------|
| `id` | string (slug) | Owning sketch id (existing) | `sketches/<id>/` folder name |
| `source` | string | Exact UTF-8 text of `sketches/<id>/sketch.ts` | the file on disk |

Loaded lazily through a new `loadSource(): Promise<string>` on the existing `SketchEntry`
(parallel to `load()`), backed by `import.meta.glob("/sketches/*/sketch.ts", { query: "?raw", import: "default" })`.

**Expected input contract** (authoring contract from feature 001 — see
[`contracts/native-conversion.md`](./contracts/native-conversion.md)): a default-export p5
**instance-mode** factory `(p: p5) => void` with lifecycle hooks attached to the instance
parameter. Sources outside this contract may yield a `NativeConversion` failure (below).

---

## Entity: Native Conversion (derived output)

The result of converting a Sketch Source to native global-mode JavaScript. Produced by the
pure converter `convertToNative(source: string)`; never stored.

Discriminated result:

| Variant | Fields | Meaning |
|---------|--------|---------|
| success | `ok: true`, `code: string` | `code` is the native global-mode JS, ready to display and copy |
| failure | `ok: false`, `reason: string` | Human-readable reason the source could not be faithfully converted |

`code` properties (the transform guarantees):

| Guarantee | Rule | Requirement |
|-----------|------|-------------|
| No imports | All `import` / `import type` statements removed | FR-002 |
| No wrapper | `export default function sketch(p: p5)` enclosure removed; body at top level | FR-003 |
| Global hooks | `p.<hook> = () => {…}` → `function <hook>() {…}` | FR-004 |
| No instance prefix | `p.` removed from all instance member access (calls, props, constants) | FR-005 |
| No TS syntax | Type annotations and type-only constructs stripped | FR-006 |
| Faithful body | Logic, literal values, identifiers, and in-body comments unchanged | FR-007, FR-008 |
| Plain text | `code` is exactly the text shown and copied (no markup) | FR-016 |

### Validation / production rules

- The converter is **pure**: same `source` in → same result out; no I/O, no throws for
  control flow (failures are returned as `{ ok: false }`). (research D1, D6)
- Conversion targets the instance parameter **resolved from the factory signature** (not a
  hard-coded `p`). (research D1)
- Member access on non-instance objects (e.g. `toMouse.mag()`) MUST be left intact. (FR-005)
- Failure (`ok: false`) is returned when there is no default-export factory, the factory has
  no instance parameter, or unrecognized top-level constructs are present. (FR-015, Edge Cases)

---

## Entity: Native Output Panel View State (UI, transient)

Component-local state for `NativeCodePanel.tsx`. Not persisted.

| Field | Type | Description |
|-------|------|-------------|
| `status` | `'loading' \| 'ready' \| 'error'` | Source-load + conversion lifecycle |
| `conversion` | `NativeConversion \| null` | Result once source is loaded/converted |
| `copyState` | `'idle' \| 'copied' \| 'failed'` | Drives the copy-button confirmation (auto-reverts) |

Behavior contract: [`contracts/native-output-panel.md`](./contracts/native-output-panel.md).

---

## Relationships

```text
Sketch (existing, feature 001)
  └── sketch.ts ──(Vite ?raw)──> Sketch Source (string)
                                     │ convertToNative()
                                     ▼
                                Native Conversion (ok | error)
                                     │ rendered by
                                     ▼
                                NativeCodePanel (display • copy • scoped select-all)
```

No change to the **Sketch Metadata** (`meta.json`) entity from feature 001. This feature
reads source only; it writes nothing.
