# Phase 0 Research: Native p5.js Output

**Date**: 2026-06-18 | **Feature**: 002-native-p5js-output

All Technical Context items are resolved below. No `NEEDS CLARIFICATION` markers remain
(the two scope decisions — auto-convert from `sketch.ts` with no new files, and faithful
1:1 conversion — were confirmed with the requester during `/speckit-specify`).

---

## D1. Conversion strategy: AST-located span splicing (not pretty-printing)

**Decision**: Parse `sketch.ts` with the **TypeScript compiler API** (`typescript`, already
a dependency) to get an AST with node positions, then produce the native output by
**splicing the original source text** at those positions — never by re-printing the AST.

Concretely, the converter:

1. Parses the source into a `SourceFile`.
2. Finds the **default-export factory** `export default function sketch(p: p5) {…}` (or an
   exported default arrow/function expression) and reads the **identifier of its first
   parameter** (the p5 instance — usually `p`, but resolved by symbol, not assumed).
3. Emits **only the inner text of the factory body** (between its `{` and `}`), which
   naturally excludes the import statement and the wrapper's own leading JSDoc/signature.
4. Within that body span, applies these text edits, all derived from AST node ranges:
   - **Instance-prefix removal**: for every `PropertyAccessExpression` whose `.expression`
     is an identifier bound to the instance parameter, delete the `p.` text (object +
     dot). This precisely skips unrelated member access like `toMouse.mag()` / `toMouse.x`.
   - **Hook conversion**: for top-level `ExpressionStatement`s of the form
     `p.<name> = <arrow|function-expression>`, rewrite to
     `function <name>(<params>) <body>`, splicing the original params and body text.
   - **Type-annotation stripping**: delete `TypeNode` spans for variable declarations,
     parameters, and return types (e.g. `: number`, `: void`), and any `import type` /
     `as`/`satisfies` type-only constructs found in the body.
5. **De-indents** the resulting body by the wrapper's indentation unit so top-level
   declarations sit at column 0.

**Rationale**: The spec demands faithfulness (FR-007/FR-008) — exact logic, literal values,
and in-body comments preserved. A full AST re-print (e.g. `ts.transpileModule` or a printer)
reformats whitespace and can drop or relocate comments, breaking fidelity. Splicing the
original text edits only what must change and leaves everything else byte-for-byte intact.
TypeScript is already installed, so this adds **no new parser dependency** and gives a
robust, symbol-aware transform (far safer than regex for `p.` removal and type stripping).

**Alternatives considered**:
- *Regex / string transforms*: brittle — `p.` removal can hit strings/comments and can't
  reliably strip TS types; rejected.
- *`ts.transpileModule` (full type-strip + emit)*: strips types for free but re-prints the
  code, losing comment placement and exact formatting; also doesn't unwrap instance mode or
  remove `p.`; rejected.
- *Babel*: capable, but a new heavyweight dependency for what the bundled TS compiler
  already does; rejected.

---

## D2. Loading raw sketch source: Vite `?raw` glob, HMR-tracked

**Decision**: In `src/sketches.ts`, add a second glob next to the existing code glob:

```ts
const rawCodeModules = import.meta.glob("/sketches/*/sketch.ts", {
  query: "?raw",
  import: "default",
}); // () => Promise<string>
```

Expose a lazy `loadSource: () => Promise<string>` on `SketchEntry` (parallel to the existing
`load`). The panel awaits it, runs the converter, and renders.

**Rationale**: `?raw` yields the file's exact text — the converter's required input. Vite
hot-updates `?raw` modules, so editing a sketch re-runs the import and re-derives the native
output within the existing HMR budget (FR-014, SC-006), with no page reload and the route
unchanged. Lazy (non-eager) keeps parity with the existing lazy code glob — only the viewed
sketch's source loads.

**Alternatives considered**: eager raw glob (loads every sketch's text upfront — unnecessary
for tens-to-hundreds of sketches); a dev-only HTTP fetch of the file (bypasses Vite's
module graph and HMR); both rejected.

---

## D3. Syntax highlighting: Prism, with copy sourced from the raw string

**Decision**: Use **`prismjs`** (core + the bundled `javascript` grammar) to highlight the
converted code, rendered into a `<pre><code>`. A dark token theme is provided via CSS tokens
consistent with the app's Tailwind v4 dark palette. The **copy and select-all operations use
the raw converted string**, never the highlighted DOM, guaranteeing plain text with no
markup (FR-016).

**Rationale**: Prism is small, synchronous, and dependency-light — no async/WASM bootstrap,
so the component stays simple with no loading state. JavaScript highlighting quality is more
than sufficient for sketch code. Keeping the raw string as the copy/selection source
decouples "what is displayed" (tokenized spans) from "what is copied" (exact text),
satisfying FR-016 and SC-003 cleanly.

**Alternatives considered**:
- *Shiki*: VS Code-grade themes but async/larger with a load step; unnecessary complexity for
  a local tool; rejected (noted as a drop-in upgrade if richer theming is later wanted).
- *highlight.js*: comparable to Prism; Prism chosen for its minimal core + per-language
  import. Either is acceptable.
- *No highlighting*: violates FR-013.

---

## D4. Scoped `CTRL + A` select-all: Selection API on a focusable container

**Decision**: Make the panel's code container focusable (`tabIndex={0}`). On `keydown`, when
`(e.ctrlKey || e.metaKey) && e.key === "a"` **and** focus/selection is within the container,
`e.preventDefault()` and select only the container's contents via the Selection API
(`getSelection().selectAllChildren(codeEl)` / a `Range` over the code element).

**Rationale**: The browser default `CTRL + A` selects the whole document; preventing it and
substituting a Range bounded to the code element keeps selection inside the panel (FR-012,
SC-004) while still allowing the user to copy the selection manually (US3). Using a real text
selection (not a textarea) coexists with Prism's token spans and the read-only requirement.

**Alternatives considered**:
- *Read-only `<textarea>`*: native `CTRL + A` is already scoped and copy is trivial, **but**
  it cannot show syntax highlighting (FR-013); rejected as the display element. (Its scoping
  behavior is the model we replicate over the highlighted element.)
- *`contentEditable`*: would make the field editable, violating FR-009; rejected.

---

## D5. Copy interaction: Clipboard API with transient confirmation

**Decision**: An icon button calls `navigator.clipboard.writeText(nativeString)`. On success,
swap the copy icon for a check icon and "Copied" affordance for ~1.5s, then revert. On
failure (API unavailable / permission denied), show a clear failed state and rely on the
scoped select-all (US3) as the manual fallback. Icons are inline SVG (copy / check) — no new
icon dependency.

**Rationale**: `writeText` is the standard one-shot copy with a promise to drive feedback
(FR-010, FR-011, SC-005). Inline SVGs avoid adding an icon package for two glyphs. The
graceful-failure path covers the clipboard edge case in the spec.

**Alternatives considered**: legacy `document.execCommand('copy')` (deprecated); adding
`lucide-react` for two icons (unnecessary dependency); both rejected.

---

## D6. Handling unsupported / unconvertible sources

**Decision**: The converter returns a discriminated result — `{ ok: true, code }` or
`{ ok: false, reason }`. It reports `ok: false` when it cannot confidently convert: no
default-export factory, the factory has no instance parameter, or top-level constructs it
does not recognize. The panel renders a clear, non-crashing message for `ok: false` (FR-015,
spec Edge Cases) and otherwise shows the code.

**Rationale**: Faithfulness means never emitting partial/incorrect code silently. An explicit
failure result keeps the converter pure (no throws for control flow) and lets the UI degrade
gracefully, mirroring how feature 001 surfaces invalid sketches rather than crashing.

**Alternatives considered**: best-effort partial output (risks shipping broken native code —
violates the faithfulness intent); throwing exceptions (forces try/catch in the UI and is
less ergonomic than a result type); both rejected.

---

## D7. Defining "faithful" vs. the reference note (whitespace nuance)

**Decision**: "Faithful 1:1" means the output preserves **the source's own** formatting and
comments, changing only what the mechanical rules require (imports, wrapper, hook syntax,
`p.` prefix, type annotations, and a uniform de-indent). The **canonical expected output** is
therefore the converter's transform of the actual on-disk
`sketches/vector-field/sketch.ts`, captured as a review-pinned fixture
(`tests/unit/fixtures/vector-field.native.js`).

**Note on the reference example**: The native block in the requester's note
(`p5js server vs native.md`) aligns trailing comments with extra padding
(`const SPACING = 30;        // …`) where the TS source uses a single space. No standard
formatter (including Prettier) produces that alignment — it is **incidental hand-formatting**
in the note and is **not** a conversion target. Accordingly, success criterion **SC-002**
("matches the verified native example character-for-character") is satisfied against the
**generated-and-reviewed fixture**, not the hand-aligned note. The note remains the
authoritative reference for *structure* (global functions, no `p.`, no types/imports,
preserved logic and comments).

**Rationale**: Reproducing arbitrary manual comment alignment would require an opinionated
reformat that contradicts "faithful 1:1" (FR-007). Pinning the fixture to the real transform
output keeps the success criterion objective and testable without injecting a formatter.

**Alternatives considered**: running Prettier on the output (would normalize but still not
reproduce the note's alignment, and would reformat the source's own style — rejected as a
fidelity violation); treating the note as byte-exact truth (not achievable by any faithful
mechanical transform — rejected).
