# Tasks: Sketch Management UI

**Input**: Design documents from `specs/003-sketch-management-ui/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Organization**: Tasks grouped by user story — each story independently testable once foundational phase is complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on in-progress tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Each task includes exact file path

---

## Phase 1: Setup

**Purpose**: Install new dependency and register new npm script before any implementation begins.

- [x] T001 Install `@radix-ui/react-dialog` — run `npm install @radix-ui/react-dialog`
- [x] T002 Add `edit-sketch` script entry to `package.json` scripts: `"edit-sketch": "tsx scripts/edit-sketch.ts"`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Server middleware plugin and shared UI dialog components that every user story depends on. No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: All four user stories share the Vite plugin (API endpoints) and the two dialog components. Complete this phase before any story phase.

- [x] T003 Create `scripts/lib/edit-sketch-op.ts` — pure `editSketch({ id, name, newId?, type })` function: validate inputs, check source exists, conflict-check newId, `fs.renameSync` if slug changes, `writeMeta` with updated fields; preserves `dateCreated`, `createdBy`, `dateUpdated`, `lastUpdatedBy`
- [x] T004 [P] Create `src/plugins/sketch-api.ts` — Vite plugin (`name: 'sketch-api'`, `apply: 'serve'`): attach four Connect middleware routes in `configureServer`: `POST /api/sketches` (create), `POST /api/sketches/:sourceId/duplicate` (duplicate), `PATCH /api/sketches/:id` (edit, delegates to `editSketch`), `DELETE /api/sketches/:id` (delete); all import from `scripts/lib/*`; parse JSON bodies manually; return `{ ok: true }` / `{ ok: false, error }` as per `contracts/sketch-management-api.md`
- [x] T005 Register `sketchApi()` plugin in `vite.config.ts` — import from `./src/plugins/sketch-api` and add to the `plugins` array alongside existing plugins
- [x] T006 [P] Create `src/components/SketchFormDialog.tsx` — Radix Dialog wrapping a controlled form; props: `mode: 'create' | 'duplicate' | 'edit-full' | 'edit-name-only'`, `initialValues?: { name, id, type }`, `title: string`, `submitLabel: string`, `onSubmit(values: { name, id, type }): Promise<void>`, `onClose(): void`; fields: name (always), id/slug (absent in `edit-name-only`), type selector (always, using `SKETCH_TYPES` from `scripts/lib/meta.ts`); slug auto-derives from name via `slugify` from `scripts/lib/slug.ts` until user manually edits slug field (`slugDirty` flag); client-side validation: non-empty name, valid slug pattern, non-empty type; server error displayed inline; Escape and Cancel dismiss without mutation
- [x] T007 [P] Create `src/components/DeleteConfirmDialog.tsx` — Radix Dialog; props: `sketchName: string`, `onConfirm(): Promise<void>`, `onClose(): void`; displays sketch name in confirmation text; Delete (destructive style) and Cancel buttons; Escape dismisses

**Checkpoint**: API endpoints reachable via `curl`, dialogs render and validate client-side — user story implementation can begin.

---

## Phase 3: User Story 1 — Create a New Sketch (Priority: P1) 🎯 MVP

**Goal**: Developer can create a new sketch from the browser gallery without touching the CLI.

**Independent Test**: Open gallery → click "New Sketch" → fill name/type → submit → new sketch row appears in gallery. Verify with `ls sketches/<new-id>/` showing `meta.json` and `sketch.ts`.

### Implementation

- [x] T008 [US1] Update `src/pages/HomePage.tsx` — add header row with "New Sketch" button (top-right, alongside existing title); manage `createOpen` state; render `<SketchFormDialog mode="create" title="New Sketch" submitLabel="Create" ...>` when open; on submit call `POST /api/sketches` with `{ name, id, type }`, close on `{ ok: true }`, display error inline on `{ ok: false }`

### Tests

- [x] T009 [US1] Add Vitest unit tests for the create endpoint handler in `tests/unit/sketch-api.test.ts`: happy path creates folder + meta.json + sketch.ts; rejects empty name; rejects invalid slug; rejects existing slug (conflict); rejects invalid type — use a temp directory (`fs.mkdtempSync`) per test

**Checkpoint**: US1 fully functional — gallery "New Sketch" creates a sketch and gallery reloads via HMR.

---

## Phase 4: User Story 2 — Duplicate an Existing Sketch (Priority: P2)

**Goal**: Developer can clone an existing sketch with a new name from the gallery actions column.

**Independent Test**: Click duplicate icon on any row → form opens pre-filled with "Name - Copy" and derived slug → edit name → submit → new row appears. Source sketch unchanged.

### Implementation

- [x] T010 [US2] Add Actions column to `src/components/SketchTable.tsx` — rightmost display column (non-sortable); renders three icon buttons per row (duplicate, edit, delete); clicking any button calls `e.stopPropagation()` to prevent row-navigation; manage per-row dialog state (`duplicateOpen`, `editOpen`, `deleteOpen` keyed by sketch id); render `<SketchFormDialog mode="duplicate" ...>` when `duplicateOpen`; pre-fill name as `"${meta.name} - Copy"`, id as `slugify("${meta.name} - Copy")`, type from `meta.type`; on submit call `POST /api/sketches/${meta.id}/duplicate` with `{ name, id }`; edit and delete buttons present but not yet wired (stubs calling `TODO` in console)

### Tests

- [x] T011 [US2] Add duplicate endpoint tests to `tests/unit/sketch-api.test.ts`: happy path copies all files + writes fresh meta.json; rejects missing source; rejects conflicting destination id; new sketch has same type as source but independent `createdBy`/`dateCreated`

**Checkpoint**: US1 + US2 both functional. Duplicate icon works; edit and delete icons visible but not yet wired.

---

## Phase 5: User Story 3 — Edit a Sketch's Metadata (Priority: P3)

**Goal**: Developer can rename a sketch, change its type, or change its slug/id — from the gallery (all fields) or the sketch page (name + type only).

**Independent Test (gallery)**: Click edit icon → form shows current name/slug/type, all editable → change name + slug → save → gallery row updated, old folder gone, new folder present. Test (sketch page): Click Edit → form shows name + type only (no slug field) → save → page title updates.

### Implementation

- [x] T012 [US3] Create `scripts/edit-sketch.ts` — CLI wrapper: parse `--id`, `--name`, `--new-id`, `--type` flags from `process.argv`; call `editSketch()` from `scripts/lib/edit-sketch-op.ts`; print success or error and exit
- [x] T013 [US3] Wire edit icon in `src/components/SketchTable.tsx` — replace the edit stub: set `editOpen` for the row; render `<SketchFormDialog mode="edit-full" initialValues={{ name: meta.name, id: meta.id, type: meta.type }} ...>`; on submit call `PATCH /api/sketches/${meta.id}` with `{ name, newId: id !== meta.id ? id : undefined, type }`; on `{ ok: true }` close dialog (HMR reload follows)
- [x] T014 [US3] Add Edit button to `src/pages/SketchPage.tsx` — alongside "← All sketches" link in the top-right action area; manage `editOpen` state; render `<SketchFormDialog mode="edit-name-only" initialValues={{ name: meta.name, type: meta.type }} ...>`; on submit call `PATCH /api/sketches/${sketch.meta.id}` with `{ name, type }`; close on success

### Tests

- [x] T015 [P] [US3] Add edit endpoint tests to `tests/unit/sketch-api.test.ts`: name-only change (no folder rename); type-only change; slug rename (folder renamed, old folder absent, new folder present + correct meta.json id); conflict on newId that already exists; source-not-found; invalid newId slug pattern
- [x] T016 [P] [US3] Add unit tests for `scripts/lib/edit-sketch-op.ts` in `tests/unit/edit-sketch-op.test.ts`: same scenarios as above but exercising the shared module directly; verify `dateUpdated`/`lastUpdatedBy` are NOT modified

**Checkpoint**: US1 + US2 + US3 functional. Edit works from gallery (full form) and sketch page (name+type only, no slug field visible).

---

## Phase 6: User Story 4 — Delete a Sketch (Priority: P4)

**Goal**: Developer can permanently remove a sketch from the gallery actions column or the sketch page, after confirming.

**Independent Test (gallery)**: Click delete icon → confirmation dialog shows sketch name → confirm → row gone, folder removed from disk. Test (sketch page): Click Delete → confirm → redirected to `/`, folder gone.

### Implementation

- [x] T017 [US4] Wire delete icon in `src/components/SketchTable.tsx` — replace delete stub: set `deleteOpen` for the row; render `<DeleteConfirmDialog sketchName={meta.name} ...>`; on confirm call `DELETE /api/sketches/${meta.id}`; close on success (HMR handles gallery refresh)
- [x] T018 [US4] Add Delete button to `src/pages/SketchPage.tsx` — in the top-right action area alongside Edit; manage `deleteOpen` state; render `<DeleteConfirmDialog sketchName={sketch.meta.name} ...>`; on confirm call `DELETE /api/sketches/${sketch.meta.id}`, then `navigate('/')` on success

### Tests

- [x] T019 [US4] Add delete endpoint tests to `tests/unit/sketch-api.test.ts`: happy path removes folder recursively; returns 400 when sketch not found

**Checkpoint**: All four user stories functional. Full sketch lifecycle (create → duplicate → edit → delete) works entirely from the browser.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Component-level tests, production build guard verification, and end-to-end validation.

- [ ] T020 [P] Add component tests for `src/components/SketchFormDialog.tsx` in `tests/components/SketchFormDialog.test.tsx`: slug auto-derives from name in `create` mode; slug stops auto-updating after user edits it (`slugDirty`); slug field absent in `edit-name-only` mode; invalid slug shows error; empty name blocks submit; server error displayed inline; Escape closes dialog
- [ ] T021 [P] Add component tests for `src/components/SketchTable.tsx` actions column in `tests/components/SketchTable.test.tsx`: all three icon buttons render per row; clicking an icon button does NOT trigger row navigation; duplicate button opens SketchFormDialog; delete button opens DeleteConfirmDialog
- [ ] T022 Verify production build guard: run `npm run build && npm run preview`; confirm mutation endpoints return 404 or buttons are absent/inoperable in the static build (satisfies FR-019 / SC-006)
- [ ] T023 Run all `quickstart.md` validation scenarios manually against `npm run dev`: create, duplicate, edit (gallery + sketch page), delete (gallery + sketch page), slug conflict, production guard

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (dependency install) — **blocks all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 — no inter-story dependencies
- **US2 (Phase 4)**: Depends on Phase 2 — no dependency on US1
- **US3 (Phase 5)**: Depends on Phase 2 — no dependency on US1/US2
- **US4 (Phase 6)**: Depends on Phase 2 — no dependency on US1/US2/US3
- **Polish (Phase 7)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2 — only needs `POST /api/sketches` + `SketchFormDialog(create)`
- **US2 (P2)**: Independent after Phase 2 — only needs `POST /api/sketches/:id/duplicate` + `SketchFormDialog(duplicate)`
- **US3 (P3)**: Independent after Phase 2 — needs `PATCH` endpoint + `editSketch-op` + both `SketchFormDialog` modes
- **US4 (P4)**: Independent after Phase 2 — only needs `DELETE` endpoint + `DeleteConfirmDialog`

### Within Each Story

- Shared dialog components (T006, T007) must be complete before wiring any action button
- Vite plugin (T004 + T005) must be complete before any API call can be tested
- Tests and implementation tasks within a story can be written in parallel

### Parallel Opportunities

- T004, T006, T007 can all run in parallel within Phase 2 (separate files)
- T003 and T004 are independent (T004 does not import T003 directly — both import from `scripts/lib/`)
- T015 and T016 (Phase 5 tests) are parallel
- T020 and T021 (Phase 7 tests) are parallel
- US1 through US4 story phases can run in parallel by different developers after Phase 2

---

## Parallel Example: Phase 2 Foundational

```
Launch simultaneously:
  Task T003: scripts/lib/edit-sketch-op.ts
  Task T004: src/plugins/sketch-api.ts
  Task T006: src/components/SketchFormDialog.tsx
  Task T007: src/components/DeleteConfirmDialog.tsx
Then sequentially:
  Task T005: Register plugin in vite.config.ts (needs T004 complete)
```

## Parallel Example: US3 Edit Sketch

```
Launch simultaneously after T013 + T014:
  Task T015: edit endpoint tests (tests/unit/sketch-api.test.ts)
  Task T016: edit-sketch-op unit tests (tests/unit/edit-sketch-op.test.ts)
```

---

## Implementation Strategy

### MVP First (US1 Only — Phases 1–3)

1. Phase 1: Install dependency, add npm script
2. Phase 2: Build plugin + shared dialogs (foundational)
3. Phase 3: Wire "New Sketch" button in gallery header
4. **STOP and VALIDATE**: `curl POST /api/sketches` → row appears in gallery
5. Demonstrate: full sketch creation from browser

### Incremental Delivery

1. Phases 1–3 → **MVP**: Create sketch from browser
2. Phase 4 → **US2**: Duplicate via actions column
3. Phase 5 → **US3**: Edit metadata (gallery full + sketch page)
4. Phase 6 → **US4**: Delete with confirmation
5. Phase 7 → Polish: component tests + build guard

### Solo Strategy (Single Developer)

Complete phases in order (1 → 2 → 3 → 4 → 5 → 6 → 7). Within Phase 2, parallelise T003/T004/T006/T007 as separate files with no cross-dependencies.

---

## Notes

- `[P]` = safe to run in parallel (separate files, no dependency on another in-flight task)
- `[Story]` label maps task to spec.md user story for traceability
- `slugify` is imported from `scripts/lib/slug.ts` in browser components — no duplication needed
- Vite HMR handles gallery refresh after all mutations — no explicit `window.location.reload()` needed
- `dateUpdated` / `lastUpdatedBy` are never written by any UI-triggered mutation (FR-022)
- Slug field is intentionally absent from `edit-name-only` mode to prevent broken routes from the sketch page (FR-012)
- Delete is irreversible — no soft-delete, no undo (FR-018)
