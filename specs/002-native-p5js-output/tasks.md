---
description: "Task list for Native p5.js Output"
---

# Tasks: Native p5.js Output

**Input**: Design documents from `/specs/002-native-p5js-output/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md,
contracts/native-conversion.md, contracts/native-output-panel.md, quickstart.md

**Tests**: INCLUDED. The feature's contracts designate a converter unit test and a panel
component test as the authoritative verification of SC-002, SC-003, SC-004, and FR-009/010/
011/012/016, and quickstart.md lists them under "Automated validation". They are therefore
generated below.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing. The converter + raw-source loader are Foundational because all three stories read
from them; the panel's three behaviors (display, copy, scoped select) map to US1/US2/US3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 / US2 / US3 (omitted for Setup, Foundational, Polish)
- All paths are repository-root-relative (single npm package, per plan.md Structure Decision)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the one new dependency and confirm the test runner picks up the new dirs.

- [X] T001 Add `prismjs` (runtime dep) and `@types/prismjs` (dev dep) to `package.json`, then run `npm install`. Per build-toolchain notes: approve the `esbuild` post-install if prompted, and confirm the installed `prismjs`/`@types/prismjs` and existing Vitest/Vite majors stay aligned.
- [X] T002 [P] Confirm Vitest discovers `tests/unit/` and `tests/components/` (check `vitest`/`vite` config `test.include`/`environment`); if the component test needs a DOM, ensure a `jsdom`/`happy-dom` environment is configured for `tests/components/**`. Make the minimal config edit only if discovery/DOM is missing. — Already configured: `vite.config.ts` has `environment: "jsdom"`, `globals: true`, `include: ["tests/**/*.{test,spec}.{ts,tsx}"]`. No change needed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The pure converter and the raw-source loader that every user story depends on.

**⚠️ CRITICAL**: No user-story work can begin until this phase is complete — the panel
(US1/US2/US3) imports both `convertToNative` and `loadSource`.

- [X] T003 Implement the pure converter `convertToNative(source: string): NativeConversion` in `src/lib/native-p5.ts` using the TypeScript compiler API for AST-span text splicing (research D1). Cover transform rules R1–R8 from `contracts/native-conversion.md`: remove imports (R1), unwrap the default-export factory and emit only its body (R2), drop the factory leading comments/signature (R3), convert `p.<hook> = (…) => {…}` to `function <hook>(…) {…}` (R4), strip the instance prefix resolved from the factory's first param — NOT a hard-coded `p` — only on true instance member access, leaving `toMouse.mag()` etc. intact (R5), strip TS-only syntax/type annotations (R6), uniform de-indent (R7), and preserve everything else verbatim (R8). Export the `NativeConversion` discriminated type. Never throw — return `{ ok:false, reason }` for the four failure conditions in the contract.
- [X] T004 [P] In `src/sketches.ts`, add `import.meta.glob("/sketches/*/sketch.ts", { query: "?raw", import: "default" })` alongside the existing code glob and expose a lazy `loadSource: () => Promise<string>` on `SketchEntry` (parallel to `load()`), per research D2 / data-model.md.
- [X] T005 Generate the verified fixture `tests/unit/fixtures/vector-field.native.js` as the converter's transform of `sketches/vector-field/sketch.ts`, then review it against the **structure** of the native block in `p5js server vs native.md` (global functions, no `p.`, no imports/types, preserved logic & comments). Per research D7 the note's trailing-comment alignment is NOT a target; this fixture is the canonical SC-002 expected output. (Depends on T003.)
- [X] T006 Write converter unit tests in `tests/unit/native-p5.test.ts` (Vitest): assert `convertToNative` of `sketches/vector-field/sketch.ts` equals the pinned fixture from T005 character-for-character (SC-002); add rule-level cases (instance-prefix removal skips non-instance member access, hook→global-function conversion, type stripping, import removal, de-indent) and failure cases (no default export, no instance parameter, empty/unparseable source, unsupported top-level construct). (Depends on T003, T005.)

**Checkpoint**: `npm run test` passes for the converter; `loadSource` is available on every `SketchEntry`. User-story UI work can now begin.

---

## Phase 3: User Story 1 - See the native p5.js version of a sketch (Priority: P1) 🎯 MVP

**Goal**: A read-only, syntax-highlighted panel on the sketch page shows the faithful native
global-mode JS equivalent of the sketch, or a clear message if it can't be converted.

**Independent Test**: Open `/sketch/vector-field`; the panel shows global-mode JS
(`function setup()`/`function draw()`, no `p.` prefixes, no imports, no TS types) matching
the verified example, syntax-highlighted and non-editable. (FR-001/007/009/013/015, SC-002)

### Implementation for User Story 1

- [X] T007 [US1] Create `src/components/NativeCodePanel.tsx` with `NativeCodePanelProps { loadSource: () => Promise<string>; sketchId: string }`. Manage `status: 'loading'|'ready'|'error'` and hold the raw converted string in state. On mount/`sketchId` change, await `loadSource()`, run `convertToNative`; on `ok:true` go `ready`, on `ok:false` or load failure go `error`. Render the three states per `contracts/native-output-panel.md` (B1/B2 read-only `<pre><code>`; error shows the `reason`, no crash — FR-015). Re-run the load/convert effect keyed on `sketchId` so Vite HMR re-derives the output without a page reload (B8, FR-014, SC-006).
- [X] T008 [P] [US1] Add JavaScript syntax highlighting (Prism) inside `NativeCodePanel.tsx`: import `prismjs` core + the bundled `javascript` grammar, render highlighted tokens into the read-only `<pre><code>` while keeping the separately-held raw string as the source of truth for later copy/select (research D3, B2/B4). (Depends on T007.)
- [X] T009 [P] [US1] Provide a dark Prism token theme mapped to the app's existing Tailwind v4 dark tokens (a small CSS/`@layer` addition or imported theme) so the panel is visually consistent with the rest of the UI (native-output-panel.md "Accessibility & theming"). (Depends on T007.)
- [X] T010 [US1] Mount `<NativeCodePanel sketchId={…} loadSource={entry.loadSource} />` on `src/pages/SketchPage.tsx`, below/alongside the existing `<SketchCanvas>` + `<MetaPanel>`, passing the active sketch's `loadSource` from its `SketchEntry`. (Depends on T007.)
- [X] T011 [US1] Component test in `tests/components/NativeCodePanel.test.tsx` (React Testing Library): renders the `ready` state with highlighted, non-editable code for a valid source; renders the `error` state (clear message, no crash) when conversion returns `ok:false`. (FR-009/013/015) (Depends on T007.)

**Checkpoint**: US1 is fully functional — the native code is visible, highlighted, read-only, and degrades gracefully. This is a shippable MVP.

---

## Phase 4: User Story 2 - Copy the native code with one click (Priority: P2)

**Goal**: A copy icon button puts the exact native code (plain text) on the clipboard in one
click, with visible confirmation and a clear failure fallback.

**Independent Test**: Click the copy button → confirmation appears within ~1s; paste into a
plain text editor → text matches the panel exactly (no markup/artifacts) and runs unedited in
the online p5.js editor. (FR-010/011/016, SC-001/003/005)

### Implementation for User Story 2

- [X] T012 [US2] Add a copy icon button to `src/components/NativeCodePanel.tsx`: `copyState: 'idle'|'copied'|'failed'`; on click call `navigator.clipboard.writeText(rawString)` using the raw converted string (NOT the highlighted DOM) so the clipboard text exactly matches the display (FR-016, B4). On resolve → `copied` (icon→check + label) auto-reverting after ~1.5s (FR-011, SC-005, B5); on reject/throw → `failed` state with a clear message, leaving manual select-all as fallback (B6). Use inline SVG copy/check icons (research D5) and an `aria-label="Copy native p5.js code"` with a perceivable (text, not color-only) confirmation. (Depends on T007.)
- [X] T013 [US2] Extend `tests/components/NativeCodePanel.test.tsx`: assert the copy button calls `clipboard.writeText` with the exact raw native string (no markup), shows confirmation on success, and shows the failed state when `writeText` rejects. (FR-010/011/016) (Depends on T011, T012.)

**Checkpoint**: US1 + US2 both work — native code is visible and one-click copyable as clean plain text.

---

## Phase 5: User Story 3 - Select all within the panel only (Priority: P3)

**Goal**: `CTRL + A` / `CMD + A` while focused in the panel selects only the panel's code,
never the rest of the page.

**Independent Test**: Focus the panel, press `CTRL + A` → only the panel's code is selected,
no other page content highlights; copying the selection yields the full native code.
(FR-012, SC-004)

### Implementation for User Story 3

- [X] T014 [US3] In `src/components/NativeCodePanel.tsx`, make the code container focusable (`tabIndex={0}`) and add a `keydown` handler: when `(e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a'` and focus/selection is within the container, `e.preventDefault()` and select only the code element's contents via the Selection API (`getSelection().selectAllChildren(codeEl)`), per research D4 / B7. Ensure long code scrolls within the panel and scoped selection still applies only to panel content (B9). (Depends on T007.)
- [X] T015 [US3] Extend `tests/components/NativeCodePanel.test.tsx`: simulate `CTRL + A` with focus inside the panel and assert `preventDefault` is called and the selection is scoped to the code element (panel contents only). (FR-012, SC-004) (Depends on T011, T014.)

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify end-to-end, lock in quality gates, finish accessibility/theming.

- [X] T016 [P] Run `npm run typecheck` and `npm run build` and resolve any type or build errors (verifies the `prismjs` integration and that no TS-only constructs leak into shipped code).
- [X] T017 [P] Final accessibility/theming pass on `src/components/NativeCodePanel.tsx`: confirm the copy button's `aria-label` and text-based confirmation are perceivable, and the Prism dark theme matches the app palette (native-output-panel.md).
- [ ] T018 Execute the `quickstart.md` manual validation for `vector-field`: US1/US2/US3 flows, hot-reload sync (edit a literal in `sketches/vector-field/sketch.ts`, confirm the panel updates within ~3s without reload — SC-006), and the edge cases (unsupported source message, clipboard-denial fallback). Confirm pasted output runs unmodified in the online p5.js editor (SC-001). — **Automated coverage complete** (converter SC-002 fixture test; panel ready/error/copy/scoped-select tests; lint/typecheck/build all green). **Remaining (requires a human + browser):** live-browser HMR check (SC-006) and pasting the copied code into https://editor.p5js.org to confirm it runs unedited (SC-001). Left unchecked pending that manual pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories** (panel imports `convertToNative` + `loadSource`).
- **User Stories (Phase 3–5)**: All depend on Foundational. US1 establishes the panel component that US2 and US3 extend, so within this feature US2/US3 build on US1's `NativeCodePanel.tsx` (they edit the same file) — implement US1 first, then US2 and US3.
- **Polish (Phase 6)**: Depends on all targeted stories being complete.

### User Story Dependencies

- **US1 (P1)**: Only depends on Foundational. Independently testable (MVP).
- **US2 (P2)**: Builds on the US1 panel (same component file). Independently testable once US1 exists.
- **US3 (P3)**: Builds on the US1 panel (same component file). Independently testable once US1 exists.

### Within Each Story

- T008/T009 (highlighting, theme) layer onto the T007 panel scaffold.
- Component tests (T011/T013/T015) follow the behavior they cover (same test file, so they accrete rather than run in parallel with each other).

### Parallel Opportunities

- T002 can run in parallel with T001 prep.
- **Foundational**: T004 (`src/sketches.ts`) is independent of T003 (`src/lib/native-p5.ts`) → `[P]`. T005/T006 depend on T003.
- **US1**: T008 and T009 are different concerns and can proceed in parallel after T007.
- **Polish**: T016 and T017 are independent → `[P]`.
- US2 and US3 both edit `NativeCodePanel.tsx`, so they are **not** mutually parallel; sequence them (US2 then US3) to avoid same-file conflicts.

---

## Parallel Example: Foundational Phase

```bash
# After T001/T002 setup, the converter and the raw-source loader touch different files:
Task: "T003 Implement convertToNative in src/lib/native-p5.ts"
Task: "T004 Add ?raw glob + loadSource() in src/sketches.ts"
# Then T005 (fixture) → T006 (converter tests), which depend on T003.
```

## Parallel Example: User Story 1

```bash
# After T007 creates the panel scaffold:
Task: "T008 Add Prism JS highlighting in src/components/NativeCodePanel.tsx"
Task: "T009 Add dark Prism theme mapped to Tailwind tokens"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1: Setup (T001–T002).
2. Phase 2: Foundational (T003–T006) — converter + loader, with passing converter tests.
3. Phase 3: User Story 1 (T007–T011) — visible, highlighted, read-only native panel.
4. **STOP and VALIDATE**: open `/sketch/vector-field`, confirm the native code is correct and non-editable.
5. Ship/demo the MVP.

### Incremental Delivery

1. Setup + Foundational → converter verified against the `vector-field` fixture.
2. US1 → read-only highlighted panel (MVP) → validate → demo.
3. US2 → one-click clean-text copy → validate → demo.
4. US3 → scoped `CTRL + A` → validate → demo.
5. Polish → typecheck/build, a11y/theming, full quickstart pass.

---

## Notes

- `[P]` = different files, no dependency on an incomplete task.
- `[Story]` labels (US1/US2/US3) map tasks to spec user stories for traceability.
- Tests are included because the contracts make them the authoritative verification of the success criteria; write/extend them alongside the behavior they cover.
- US2 and US3 extend the single `NativeCodePanel.tsx`; keep them sequential to avoid same-file conflicts.
- The converter must never throw — failures are the `{ ok:false, reason }` result the panel renders (FR-015).
- Commit after each task or logical group; stop at any checkpoint to validate a story independently.
