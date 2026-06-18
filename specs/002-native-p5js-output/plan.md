# Implementation Plan: Native p5.js Output

**Branch**: `002-native-p5js-output` | **Date**: 2026-06-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-native-p5js-output/spec.md`

## Summary

Add a read-only panel to the per-sketch page that shows the **native, global-mode
JavaScript** equivalent of a sketch's TypeScript instance-mode source — the form that
pastes directly into the official online p5.js editor. The native code is **derived on the
fly** from the existing `sketch.ts` (no new per-sketch files), via a **faithful 1:1
mechanical conversion**: remove imports, unwrap the `export default function sketch(p: p5)`
enclosure, turn `p.<hook> = () => {…}` assignments into top-level `function <hook>() {…}`
declarations, strip the `p.` instance prefix from all p5 calls/properties/constants, and
remove TypeScript-only syntax — preserving all logic, literal values, and in-body comments
unchanged. The panel offers a copy icon button (with confirmation), `CTRL + A` selection
scoped to the panel only, and JavaScript syntax highlighting.

**Technical approach**: A pure, framework-agnostic converter module
(`src/lib/native-p5.ts`) does the transform using the **TypeScript compiler API** (already
a dependency) to locate AST node spans, then splices the **original source text** to
preserve exact formatting and comments (rather than pretty-printing, which would lose
fidelity). The sketch's raw source is loaded with a Vite `?raw` glob added alongside the
existing code glob in `src/sketches.ts`, so the panel hot-reloads in lock-step with the
sketch. A new `NativeCodePanel.tsx` component renders the converted string with Prism
syntax highlighting, copies the **raw string** (not DOM markup) via the Clipboard API, and
implements scoped select-all with the Selection API. The panel is mounted on
`SketchPage.tsx`. Unit tests (Vitest) pin the converter against the `vector-field` example;
a component smoke test covers copy/scoped-select/read-only.

## Technical Context

**Language/Version**: TypeScript 5.7 on Node.js 22+ (browser runtime is the Vite SPA)

**Primary Dependencies**: Existing — Vite 6, React 19, React Router 7, Tailwind v4, p5,
TypeScript 5.7 (reused as the conversion parser via its compiler API), zod. **New** —
`prismjs` + `@types/prismjs` for JavaScript syntax highlighting (lightweight, synchronous,
renders to spans while leaving a separate raw string for plain-text copy).

**Storage**: File system only; **no new files** — native code is derived from the existing
`sketches/<id>/sketch.ts` at view/build time (Vite `?raw` import). No `meta.json` change.

**Testing**: Vitest unit tests for the pure converter (`vector-field` fixture +
edge/unsupported cases); React Testing Library smoke test for the panel (read-only, copy
confirmation, scoped `CTRL + A`).

**Target Platform**: Local developer machine, modern evergreen browser (Clipboard API +
Selection API available).

**Project Type**: Web application (frontend SPA) + Node CLI tooling, single npm package
(unchanged from feature 001). This feature is frontend-only.

**Performance Goals**: Native output appears effectively instantly on sketch-page load and
re-derives within the existing 3s HMR budget on source edit (SC-006); copy completes in one
click with confirmation < 1s (SC-005). Conversion of a typical sketch (≤ a few hundred
lines) is sub-millisecond and runs once per source change.

**Constraints**: View-only UI (no mutation, no new authored files) — preserved. Faithful
1:1 conversion: no semantic adaptations (canvas sizing, added handlers) (FR-007). Copied
text MUST be plain text identical to the displayed code (FR-016). `CTRL + A` selection MUST
not escape the panel (FR-012).

**Scale/Scope**: One converter module, one panel component, one raw-source glob addition,
one wire-up into the existing sketch page. Tens to low-hundreds of sketches, single-user
local usage (unchanged).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution (`.specify/memory/constitution.md`) is an **unpopulated template**
(all placeholder tokens, no ratified principles). There are therefore no enforceable
governance gates to evaluate.

- **Initial gate (pre-Phase 0)**: PASS — no principles defined; no violations possible.
- **Post-design gate (post-Phase 1)**: PASS — design adds one pure module, one component,
  and one Vite glob; introduces a single small dependency (`prismjs`); creates no new
  per-sketch files; and keeps the UI view-only. No complexity requiring justification.

If the constitution is later populated, re-run this gate against the new principles.

## Project Structure

### Documentation (this feature)

```text
specs/002-native-p5js-output/
├── plan.md              # This file (/speckit-plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (/speckit-plan)
├── data-model.md        # Phase 1 output (/speckit-plan)
├── quickstart.md        # Phase 1 output (/speckit-plan)
├── contracts/           # Phase 1 output (/speckit-plan)
│   ├── native-conversion.md     # Input contract + transform rules (faithful 1:1)
│   └── native-output-panel.md   # UI behavior contract (read-only/copy/select/highlight)
├── checklists/
│   └── requirements.md  # Spec quality checklist (/speckit-specify)
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created here)
```

### Source Code (repository root)

```text
src/
├── lib/
│   └── native-p5.ts            # NEW — pure converter: instance-mode TS → native global JS
├── components/
│   └── NativeCodePanel.tsx     # NEW — read-only panel: Prism highlight, copy, scoped CTRL+A
├── sketches.ts                 # EDIT — add `?raw` glob; expose loadSource() on SketchEntry
└── pages/
    └── SketchPage.tsx          # EDIT — mount <NativeCodePanel> for the active sketch

tests/
├── unit/
│   ├── native-p5.test.ts       # NEW — converter vs vector-field fixture + edge cases
│   └── fixtures/
│       └── vector-field.native.js  # NEW — verified expected native output (review-pinned)
└── components/
    └── NativeCodePanel.test.tsx    # NEW — RTL smoke: read-only, copy feedback, scoped select

package.json                    # EDIT — add prismjs + @types/prismjs
```

**Structure Decision**: Extends the existing single npm package (feature 001) with one pure
library module and one React component, plus a minimal edit to the existing discovery layer
and sketch page. The converter is deliberately framework-agnostic and side-effect-free so it
is unit-testable in isolation (Vitest) and reusable (e.g. by a future CLI). No backend, no
new authored files, UI remains view-only — consistent with the project's constraints.

## Complexity Tracking

> No constitution principles are defined, so there are no violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | —          | —                                   |
