# Tasks: Sketch Tags

**Input**: Design documents from `specs/004-sketch-tags/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/sketch-tags-api.md ✓, quickstart.md ✓

**Tests**: Unit tests included for tag utilities and API validation logic.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths are included in every task description

---

## Phase 1: Setup

**Purpose**: Install missing dependency identified in research.

- [X] T001 Install `@radix-ui/react-popover` via `npm install @radix-ui/react-popover` (not yet in node_modules; needed by TagInput in Phase 5)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the core data model so every user story can build on a stable `SketchMeta.tags` field. No user story work can begin until this phase is complete.

- [X] T002 Add `tags: z.array(z.string().min(1)).default([])` to `SketchMetaSchema` in `scripts/lib/meta.ts`; update `serializeMeta` to write the `tags` key only when the array is non-empty (mirrors the existing `type !== "p5"` conditional pattern)

**Checkpoint**: `SketchMeta` type now includes `tags?: string[]`; existing sketches parse without error; `serializeMeta` omits `tags` key for empty arrays.

---

## Phase 3: User Stories 1 & 2 — Display (Priority: P1) 🎯 MVP

**Goal**: Tags stored in `meta.json` are visible in the gallery table and on the sketch page. No form changes yet.

**Independent Test**: Manually add `"tags": ["animation", "demo"]` to any `sketches/<id>/meta.json`, open the gallery, confirm a Tags column appears with "animation, demo", truncated with ellipsis if long. Open the sketch page and confirm tags appear in the metadata panel.

### Implementation for User Story 1 — Tags column in gallery

- [X] T003 [P] [US1] Add a Tags column to `src/components/SketchTable.tsx`: use `columnHelper.accessor('tags', {...})`, join tags with `", "` in the cell renderer, apply `className="max-w-[160px] truncate"` for ellipsis overflow, set `title={row.original.tags?.join(', ')}` for hover tooltip; position column after Type, before Actions

### Implementation for User Story 2 — Tags in sketch page metadata panel

- [X] T004 [P] [US2] Update `src/components/MetaPanel.tsx`: add `{ key: 'tags', label: 'Tags' }` to `META_FIELDS`; in the render block, handle `key === 'tags'` by rendering `meta.tags?.join(', ')` and skipping the row when the array is empty or absent

**Checkpoint**: Gallery shows Tags column; sketch page shows tags. Both handle missing/empty tags gracefully. US1 and US2 are independently testable at this point.

---

## Phase 4: User Story 4 — Centralised Tag Registry (Priority: P2)

**Goal**: A `GET /api/tags` endpoint returns the full tag registry. Create, duplicate, and edit endpoints accept a `tags` param and merge new tags into `sketches/tags.json` on every save.

**Independent Test**: `curl http://localhost:5173/api/tags` returns `[]` on a fresh install. Create a sketch with `"tags": ["generative"]` via `curl`, then re-run `GET /api/tags` and confirm `["generative"]` is returned.

### Implementation for User Story 4

- [X] T005 [US4] Create `scripts/lib/tags.ts` with four exports: `REGISTRY_PATH` (absolute path to `sketches/tags.json`), `readTagRegistry(): string[]` (returns `[]` if file absent/invalid), `writeTagRegistry(tags: string[]): void` (sorted, deduplicated write), `mergeTags(registry: string[], newTags: string[]): string[]` (Set union, lowercased, sorted), and `normaliseTags(input: string[]): string[]` (trim + lowercase + dedup + filter empty and multi-word entries)

- [X] T006 [US4] Add `GET /api/tags` route to `src/plugins/sketch-api.ts` (insert before the existing `POST /api/sketches` check): read registry via `readTagRegistry()` and return it as a JSON array with HTTP 200

- [X] T007 [US4] Update `scripts/lib/edit-sketch-op.ts`: add optional `tags?: string[]` to the `EditSketchOptions` type; include normalised tags in the `writeMeta` call

- [X] T008 [US4] Update `POST /api/sketches` handler in `src/plugins/sketch-api.ts`: read optional `tags` from request body, call `normaliseTags`, reject multi-word entries with HTTP 400 (`"tag '<value>' must be a single word (no spaces)"`), write tags to meta, then call `writeTagRegistry(mergeTags(readTagRegistry(), tags))`

- [X] T009 [US4] Update `POST /api/sketches/:sourceId/duplicate` handler in `src/plugins/sketch-api.ts`: read optional `tags` from body (fall back to `sourceMeta.tags ?? []` when absent), normalise and validate, write to new sketch meta, merge into registry

- [X] T010 [US4] Update `PATCH /api/sketches/:id` handler in `src/plugins/sketch-api.ts`: read optional `tags` from body (default `[]`), normalise and validate, pass to `editSketch` (updated in T007), merge into registry after successful edit

**Checkpoint**: `GET /api/tags` endpoint works. Create/duplicate/edit via `curl` persists tags and updates `sketches/tags.json`. Tags submitted with spaces return 400. Registry is deduplicated and append-only.

---

## Phase 5: User Story 3 — Tag Input in Forms (Priority: P2)

**Goal**: All three sketch forms (create, duplicate, edit) include a chip-based tag input with case-insensitive autocomplete sourced from the registry.

**Independent Test**: Open New Sketch form, type "anim", confirm autocomplete suggests "animation" (from registry), click it, confirm chip appears, press Space after typing "audio" to add it, remove a chip, submit — verify tags persisted in meta.json and visible in gallery.

**Depends on**: Phase 4 complete (`GET /api/tags` endpoint must be available)

### Implementation for User Story 3

- [X] T011 [US3] Create `src/components/TagInput.tsx`: controlled component with props `value: string[]`, `onChange(tags: string[]): void`, `allTags: string[]`, `placeholder?: string`; renders existing chips as styled `<span>` pills each with an `×` remove button; appends an inline `<input>` after chips; on input change filters `allTags` case-insensitively and opens a `@radix-ui/react-popover` dropdown when ≥1 match; confirms a tag (adds chip, clears input) on Enter, Tab, Space, or comma keydown, or on suggestion click; lowercases and deduplicates before adding; silently ignores empty/whitespace entries; excludes already-added tags from suggestions; matches existing dark-theme Tailwind classes (`border border-edge bg-surface-2 rounded-md text-fg`); chips use `bg-accent/20 text-accent text-xs rounded px-2 py-0.5`

- [X] T012 [US3] Update `src/components/SketchFormDialog.tsx`: add `tags: string[]` to `SketchFormValues` interface; add `const [tags, setTags] = useState<string[]>(initialValues?.tags ?? [])` state; add `const [allTags, setAllTags] = useState<string[]>([])` state; add a `useEffect` on mount that calls `fetch('/api/tags').then(r => r.json()).then(setAllTags).catch(() => {})` (silent fail if endpoint unavailable); render `<TagInput value={tags} onChange={setTags} allTags={allTags} placeholder="Add tag…" />` in the form body (after the Type field, or after Name when Type is hidden); include `tags` in the `onSubmit(values)` payload

**Checkpoint**: Tag input appears in all three form modes (create, duplicate, edit). Autocomplete works. Chips add/remove correctly. Tags persist on save and appear immediately in gallery and sketch page.

---

## Phase 6: Unit Tests

**Purpose**: Verify tag utility logic and API validation behaviour.

- [X] T013 [P] Create `tests/unit/tags.test.ts`: test `normaliseTags` (lowercase, dedup, empty rejection, multi-word rejection), `mergeTags` (union, dedup, sort, case-insensitive), `readTagRegistry` (returns `[]` when file absent), `writeTagRegistry` (sorted output)

- [X] T014 [P] Add tag-related cases to `tests/unit/sketch-api.test.ts`: `GET /api/tags` returns `[]` on empty registry; `POST /api/sketches` with multi-word tag returns 400; `POST /api/sketches` with valid tags updates registry; `PATCH /api/sketches/:id` with tags merges into registry

---

## Phase 7: Polish & Validation

- [X] T015 Run through all scenarios in `specs/004-sketch-tags/quickstart.md` to confirm end-to-end behaviour; fix any visual or behavioural regressions found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user story phases
- **Phase 3 (US1 + US2)**: Depends on Phase 2 only — can start as soon as `SketchMeta.tags` is typed
- **Phase 4 (US4)**: Depends on Phase 2 only — independent of Phase 3
- **Phase 5 (US3)**: Depends on Phase 4 (`GET /api/tags` must exist)
- **Phase 6 (Tests)**: Depends on Phases 4 and 5 (tests cover both)
- **Phase 7 (Polish)**: Depends on all phases complete

### User Story Dependencies

- **US1 (gallery column)**: Unblocked after Phase 2
- **US2 (sketch page panel)**: Unblocked after Phase 2 — parallel with US1
- **US4 (registry + API)**: Unblocked after Phase 2 — parallel with US1/US2
- **US3 (form + autocomplete)**: Unblocked after US4 (GET /api/tags needed)

### Within Each Phase

- T003 and T004 (Phase 3) are fully parallel — different files
- T005 (tags.ts) must complete before T006–T010 (all use `readTagRegistry` / `writeTagRegistry` / `normaliseTags`)
- T006–T010 can be done in any order (all modify different handlers in the same file, but each is a self-contained change)
- T007 (edit-sketch-op.ts) must complete before T010 (PATCH handler calls `editSketch`)
- T011 (TagInput) must complete before T012 (SketchFormDialog renders it)
- T013 and T014 (tests) are parallel — different test files

---

## Parallel Execution Examples

### Phase 3 (US1 + US2) — run in parallel

```
Task: T003 — Add Tags column to src/components/SketchTable.tsx
Task: T004 — Add tags row to src/components/MetaPanel.tsx
```

### Phase 4 (US4) — sequential within the server file

```
# T005 first (utility foundation):
Task: T005 — Create scripts/lib/tags.ts

# Then T006, T007, T008, T009, T010 (T007 before T010; others any order):
Task: T006 — GET /api/tags endpoint in src/plugins/sketch-api.ts
Task: T007 — tags param in scripts/lib/edit-sketch-op.ts
Task: T008 — POST /api/sketches with tags in src/plugins/sketch-api.ts
Task: T009 — POST duplicate with tags in src/plugins/sketch-api.ts
Task: T010 — PATCH /api/sketches/:id with tags (after T007)
```

### Phase 6 (tests) — run in parallel

```
Task: T013 — tests/unit/tags.test.ts
Task: T014 — tests/unit/sketch-api.test.ts (tag cases)
```

---

## Implementation Strategy

### MVP First (US1 + US2 only — display)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (schema change)
3. Manually add `"tags": ["demo"]` to one `meta.json`
4. Complete Phase 3: T003 + T004
5. **STOP and validate**: Tags column in gallery, tags in sketch page — no form changes needed

### Incremental Delivery

1. Setup + Foundational → schema ready
2. Phase 3 (US1 + US2) → display live — MVP deliverable
3. Phase 4 (US4) → registry + API endpoints working (verify with `curl`)
4. Phase 5 (US3) → forms include tag input with autocomplete — full feature
5. Phase 6 → unit tests pass
6. Phase 7 → quickstart validation complete

---

## Notes

- `[P]` tasks = different files, no data dependencies between them
- `[Story]` label maps each task to a specific user story for traceability
- Tags stored lowercase throughout (registry and `meta.json`)
- Registry is append-only — no delete from registry on sketch edit/delete
- `TagInput` must gracefully degrade if `GET /api/tags` fails (empty `allTags` → no suggestions, chips still work)
- `serializeMeta` must omit `tags` key for empty arrays to avoid diffs on existing sketches
