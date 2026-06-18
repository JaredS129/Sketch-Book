# Quickstart & Validation: Native p5.js Output

**Date**: 2026-06-18 | **Feature**: 002-native-p5js-output

How to run and validate the feature end-to-end. Implementation details live in the
[contracts](./contracts/) and [data-model.md](./data-model.md); this is a run/verify guide.

## Prerequisites

- Repo installed: `npm install` (adds `prismjs` + `@types/prismjs` once the plan is built).
- At least one valid sketch on disk. The example `sketches/vector-field/sketch.ts` is used
  as the reference throughout.

## Run the app

```bash
npm run dev
```

Open the dev URL, then navigate to the example sketch (`/sketch/vector-field`).

## Manual validation (maps to user stories & success criteria)

### US1 — See the native version (P1)

1. On `/sketch/vector-field`, locate the **native p5.js** output panel below the canvas.
2. Confirm it shows global-mode JavaScript: top-level `function setup()` / `function draw()`,
   **no** `p.` prefixes, **no** `import`, **no** TypeScript type annotations.
3. Confirm literal values match the source (e.g. `createCanvas(windowWidth, windowHeight)`
   stays exactly as authored) and in-body comments are preserved. *(SC-002, FR-007)*
4. Confirm the code is **syntax-highlighted** and **cannot be edited**. *(FR-013, FR-009)*

### US2 — Copy with one click (P2)

1. Click the **copy** icon button. Confirm a visible **confirmation** appears within ~1s and
   reverts shortly after. *(FR-010, FR-011, SC-005)*
2. Paste into a plain text editor: the text matches the panel **exactly** (no markup, no
   stray whitespace/artifacts). *(FR-016, SC-003)*
3. Paste into the online p5.js editor (https://editor.p5js.org) and **Run**: the sketch runs
   with **zero manual edits**. *(SC-001)*

### US3 — Scoped select-all (P3)

1. Click into the panel, press **`CTRL + A`** (or `CMD + A`).
2. Confirm **only the panel's code** is selected — no other page content highlights.
   *(FR-012, SC-004)*
3. Copy the selection and paste; it equals the full native code. *(US3 #2)*

### Hot-reload sync (FR-014, SC-006)

1. With the page open, edit `sketches/vector-field/sketch.ts` (e.g. change a literal) and
   save.
2. Confirm the native panel updates to reflect the change within ~3s, **without** a full
   page reload and **without** leaving the sketch page.

### Edge cases (spec Edge Cases, FR-015)

- Temporarily point the panel at a source that violates the instance-mode contract (or use a
  malformed fixture in tests): confirm the panel shows a **clear message** and does not
  crash the page.
- Simulate clipboard denial: confirm the copy button shows a **failed** state and scoped
  select-all still works as the manual fallback.

## Automated validation

```bash
npm run test       # Vitest: converter unit tests + panel smoke test
npm run typecheck  # tsc --noEmit
npm run build      # type-check + production build (verifies prismjs integration)
```

Expected:

- `tests/unit/native-p5.test.ts` — converts `sketches/vector-field/sketch.ts` and asserts it
  equals the pinned fixture `tests/unit/fixtures/vector-field.native.js`; plus rule-level
  cases (instance-prefix removal skips non-instance member access, hook conversion, type
  stripping, import removal) and failure cases (no default export, no instance param). *(SC-002)*
- `tests/components/NativeCodePanel.test.tsx` — renders ready/error states, asserts
  read-only, copy writes the raw string and shows confirmation, and `CTRL + A` selection is
  scoped to the panel. *(FR-009/010/011/012/016)*

## Done when

- All user-story validations above pass for `vector-field`.
- `npm run test`, `npm run typecheck`, and `npm run build` succeed.
- Copied native code runs unmodified in the online p5.js editor.
