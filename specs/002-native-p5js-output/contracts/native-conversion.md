# Contract: Native Conversion (instance-mode TS → native global JS)

**Date**: 2026-06-18 | **Feature**: 002-native-p5js-output

Defines the contract for `convertToNative` (`src/lib/native-p5.ts`): the input it accepts,
the exact transformation rules, and the output it guarantees. This is the authoritative
reference for the converter's unit tests.

---

## Interface

```ts
export type NativeConversion =
  | { ok: true; code: string }
  | { ok: false; reason: string };

/** Pure: converts instance-mode p5 TypeScript source to native global-mode JS. */
export function convertToNative(source: string): NativeConversion;
```

- **Pure**: no I/O, no global state, deterministic. Never throws for expected/unsupported
  input — returns `{ ok: false, reason }` instead. (research D1, D6)

---

## Input contract (accepted source)

The source MUST follow the feature-001 sketch-module contract:

```ts
import type p5 from "p5";

export default function sketch(p: p5): void {
  p.setup = () => { /* … */ };
  p.draw = () => { /* … */ };
  // optional: p.preload, p.windowResized, p.mousePressed, helper fns, consts…
}
```

- A single **default-export factory**: `function sketch(p: p5)` or an exported default
  arrow/function expression. Its **first parameter** is the p5 instance (name resolved from
  the signature — not assumed to be `p`).
- p5 lifecycle hooks are assigned to the instance: `p.<name> = (…) => {…}` (arrow or
  function expression).
- Helper functions / constants / variables may be declared inside the factory body.

If these do not hold, conversion returns `{ ok: false }` (see Failure below).

---

## Transformation rules (faithful 1:1)

Applied by splicing the **original source text** at AST-derived spans (preserving exact
formatting and comments). In order:

| # | Rule | Example (in → out) | Req |
|---|------|--------------------|-----|
| R1 | Remove all `import` / `import type` statements | `import type p5 from "p5";` → *(removed)* | FR-002 |
| R2 | Unwrap the default-export factory; emit only its body | `export default function sketch(p:p5){ BODY }` → `BODY` | FR-003 |
| R3 | Drop the factory's leading comments/JSDoc and signature | the instance-mode JSDoc above `sketch` → *(removed)* | FR-003, FR-008 |
| R4 | Convert instance hook assignments to global functions | `p.setup = () => { … };` → `function setup() { … }` | FR-004 |
| R5 | Remove the instance prefix from instance member access | `p.createCanvas(…)`, `p.windowWidth`, `p.ROUND` → `createCanvas(…)`, `windowWidth`, `ROUND` | FR-005 |
| R6 | Strip TypeScript-only syntax (type annotations, `import type`, `as`/`satisfies`, return types) | `let cols: number, rows: number;` → `let cols, rows;` | FR-006 |
| R7 | De-indent the emitted body by the wrapper's indentation unit | 2-space-indented body → column-0 top level | FR-003, FR-007 |
| R8 | Preserve everything else verbatim — logic, literals, identifiers, in-body comments, blank lines | `p.map(dist, RADIUS, 0, 0, 1)` → `map(dist, RADIUS, 0, 0, 1)` | FR-007, FR-008 |

**Must NOT do** (faithfulness guards):

- MUST NOT strip `.` member access on **non-instance** objects: `toMouse.mag()`,
  `toMouse.x`, `toMouse.setMag(len)` stay unchanged. (FR-005)
- MUST NOT alter literal values or add behavior — e.g. `createCanvas(1200, 1200)` stays
  `createCanvas(1200, 1200)`; no responsive-canvas rewrite, no `windowResized` is invented.
  (FR-007)
- MUST NOT reformat or realign code beyond the uniform de-indent (R7). Trailing-comment
  spacing from the source is preserved as-is. (research D7)

---

## Output contract (guaranteed result)

On `ok: true`, `code`:

- Is valid global-mode JavaScript with top-level `function setup()`/`function draw()` (and
  any other converted hooks), helper declarations preserved.
- Contains no `import`, no `export`, no `p.` instance access, no TypeScript type syntax.
- Is **plain text** identical to what the panel displays and copies (no markup). (FR-016)
- Preserves the source's in-body comments and logic exactly. (FR-007, FR-008)

---

## Failure contract

Returns `{ ok: false, reason }` (panel shows a clear message, never crashes — FR-015) when:

| Condition | `reason` (indicative) |
|-----------|------------------------|
| No default-export factory found | `"No default-export sketch function found"` |
| Factory has no instance parameter | `"Sketch function has no p5 instance parameter"` |
| Empty / unparseable source | `"Sketch source is empty or could not be parsed"` |
| Unsupported top-level construct outside the factory | `"Unsupported module structure for native conversion"` |

---

## Reference fixture (verification)

The canonical expected output for the example sketch is the converter's transform of the
actual `sketches/vector-field/sketch.ts`, pinned at
`tests/unit/fixtures/vector-field.native.js` and reviewed against the **structure** of the
native block in `p5js server vs native.md`. Per research **D7**, the note's trailing-comment
alignment is incidental hand-formatting and is **not** part of this contract; SC-002 is
verified against the pinned fixture.

### Worked example (abridged, from `vector-field`)

Input (instance mode):

```ts
import type p5 from "p5";
export default function sketch(p: p5): void {
  const SPACING = 30; // grid spacing between vectors
  let cols: number, rows: number;
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    cols = p.floor(p.width / SPACING);
    p.strokeCap(p.ROUND);
  };
}
```

Output (native global mode):

```js
const SPACING = 30; // grid spacing between vectors
let cols, rows;
function setup() {
  createCanvas(windowWidth, windowHeight);
  cols = floor(width / SPACING);
  strokeCap(ROUND);
}
```
