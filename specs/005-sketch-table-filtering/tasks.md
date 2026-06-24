# Tasks: Sketch Table Filtering & Search

**Input**: Design documents from `specs/005-sketch-table-filtering/`

**Branch**: `Sketch-table-filtering`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/filter-ui-contract.md ✓

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and verification.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared state)
- **[Story]**: Maps to user story from spec.md (US1–US5)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the directory structure needed for new files

- [x] T001 Create `src/hooks/` directory

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core hook and component shell that every user story builds on

**⚠️ CRITICAL**: All user story work is blocked until this phase is complete

- [x] T002 [P] Implement `useSketchFilter` hook with `FilterState` type, `EMPTY_FILTER` constant, all four filter predicates (name substring, types OR, tags AND, authors OR), derived `availableTypes`/`availableTags`/`availableAuthors`, `isFiltering` flag, and `clearFilters` action in `src/hooks/useSketchFilter.ts`
- [x] T003 [P] Create `SketchFilterBar` component skeleton (accepts all props from `contracts/filter-ui-contract.md`, renders a flex-wrap container with a placeholder comment for controls) in `src/components/SketchFilterBar.tsx`
- [x] T004 Integrate `useSketchFilter` into `src/pages/HomePage.tsx`: call `useSketchFilter(data)`, pass `filteredData` to `<SketchTable>` instead of `data`, and render `<SketchFilterBar>` between the header and table (depends on T002, T003)

**Checkpoint**: App runs, table still shows all sketches, filter bar renders as empty container

---

## Phase 3: User Story 1 — Search by Name (Priority: P1) 🎯 MVP

**Goal**: User types in a search box and the table immediately filters to sketches whose names match (case-insensitive substring).

**Independent Test**: Visit gallery, type partial sketch name into search input, confirm table updates with each keystroke. Clear input and confirm all rows return.

- [x] T005 [US1] Add name search `<input type="search">` to `src/components/SketchFilterBar.tsx`: bind to `filter.name`, call `onFilterChange` on every `onChange` event (controlled input, no debounce needed)

**Checkpoint**: Name search works end-to-end; remaining filter controls not yet present

---

## Phase 4: User Story 2 — Filter by Sketch Type (Priority: P2)

**Goal**: User opens a multi-select dropdown, checks one or more sketch types, and the table immediately shows only sketches of those types (OR logic).

**Independent Test**: Select "p5" in type dropdown — only p5 sketches appear. Check "q5" too — p5 OR q5 sketches appear. Uncheck all — all sketches return. Dropdown only lists types that exist in the gallery.

- [x] T006 [US2] Create `MultiSelectDropdown` component in `src/components/MultiSelectDropdown.tsx`: Radix Popover trigger + checkbox list; trigger label shows `label` when nothing selected or `label · N` when N items checked; toggling a checkbox calls `onChange` with updated array; uses `border-edge bg-surface` Tailwind tokens to match dark-mode theme
- [x] T007 [US2] Add type filter `<MultiSelectDropdown label="Type" options={availableTypes} selected={filter.types}>` to `src/components/SketchFilterBar.tsx` (depends on T006)

**Checkpoint**: Type filter works independently; name search from US1 still works alongside it

---

## Phase 5: User Story 3 — Filter by Tags (Priority: P3)

**Goal**: User selects tags from an autocomplete input (restricted to existing tags only); table shows only sketches that have ALL selected tags (AND logic).

**Independent Test**: Select one tag — only tagged sketches appear. Select a second tag — only sketches with both tags appear (fewer results). Remove a tag chip — table expands again. Type a non-existent tag name — autocomplete does not offer it; pressing Enter/Tab does nothing.

- [x] T008 [P] [US3] Extend `src/components/TagInput.tsx` with two optional props: `restrictToExisting?: boolean` (guards `addTag` to return early if tag not in `allTags`) and `showAllWhenFocused?: boolean` (computes suggestions from all unselected `allTags` regardless of `inputValue`, opens popover on input focus when unselected tags exist); existing callers pass neither prop so behaviour is unchanged
- [x] T009 [US3] Add tag filter `<TagInput value={filter.tags} allTags={availableTags} restrictToExisting showAllWhenFocused placeholder="Filter by tag…">` to `src/components/SketchFilterBar.tsx` (depends on T008)

**Checkpoint**: Tag filter works independently; US1 + US2 controls still work alongside it

---

## Phase 6: User Story 4 — Filter by Author (Priority: P4)

**Goal**: User selects one or more authors from a multi-select dropdown; table shows only sketches by those authors (OR logic). Dropdown only lists authors present in the gallery.

**Independent Test**: Select one author — only their sketches appear. Select a second author — either author's sketches appear. Dropdown contains no phantom/hardcoded authors.

- [x] T010 [US4] Add author filter `<MultiSelectDropdown label="Author" options={availableAuthors} selected={filter.authors}>` to `src/components/SketchFilterBar.tsx` (reuses component from T006)

**Checkpoint**: All four filter controls present; each works independently; combinations work naturally (AND across filter types is already in the hook from T002)

---

## Phase 7: User Story 5 — Combined Filters + Clear (Priority: P1)

**Goal**: All active filters AND the name search combine simultaneously (AND logic across filter types); a single "Clear" button resets all filters; count line reflects filtered results.

**Independent Test**: Activate name search + type + tag + author simultaneously — table shows only sketches matching all constraints. Click Clear — all reset, full list returns. With no filters active, Clear is disabled. Count line shows "3 of 12 sketches" when filtering, "12 sketches" when not.

- [x] T011 [P] [US5] Add Clear button to `src/components/SketchFilterBar.tsx`: render `<button disabled={!isFiltering} onClick={onClear}>Clear</button>` with `opacity-40 cursor-not-allowed` when disabled; always visible (no layout shift)
- [x] T012 [P] [US5] Update count display in `src/pages/HomePage.tsx`: show `"{filteredData.length} of {data.length} sketches · click a row to run"` when `isFiltering`, else `"{data.length} sketches · click a row to run"`
- [x] T013 [P] [US5] Add zero-results state in `src/pages/HomePage.tsx` (or inline in `src/components/SketchTable.tsx`): when `filteredData.length === 0` but `data.length > 0`, show "No sketches match your filters" message with a suggestion to clear filters (instead of `<EmptyState>` which implies no sketches exist at all)

**Checkpoint**: Full feature complete — all five user stories satisfied. Run quickstart.md scenarios manually.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, styling consistency, and final validation

- [x] T014 [P] Add `aria-label` attributes and associated `<label>` elements (or `aria-labelledby`) to all filter controls in `src/components/SketchFilterBar.tsx` for screen-reader accessibility
- [x] T015 Run all scenarios from `specs/005-sketch-table-filtering/quickstart.md` manually in the browser to confirm the feature works end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — T002 and T003 can run in parallel; T004 depends on both
- **User Stories (Phase 3–7)**: All depend on Phase 2 (T004) completion
  - US phases are ordered by spec priority but can be worked in order due to single developer
- **Polish (Phase 8)**: Depends on all user story phases being complete

### User Story Dependencies

- **US1 (P1)**: Depends on Foundation only — no other story dependency
- **US2 (P2)**: Depends on Foundation only — no US1 dependency
- **US3 (P3)**: Depends on Foundation only — no US1/US2 dependency; T008 (TagInput) can run in parallel with T006 (MultiSelectDropdown)
- **US4 (P4)**: Depends on US2 (reuses MultiSelectDropdown from T006)
- **US5 (P1)**: Depends on US1–US4 all being wired into SketchFilterBar (Clear button needs all controls present to be meaningful)

### Within Each User Story

- SketchFilterBar modifications (T005, T007, T009, T010, T011) must be sequential — they all edit the same file
- T006 (MultiSelectDropdown) and T008 (TagInput) can run in parallel — different files

### Parallel Opportunities

```text
T002 (useSketchFilter hook)    ─┬─→ T004 (HomePage integration) → T005 (US1) → T007 (US2) → T009 (US3) → T010 (US4) → T011 (US5 Clear)
T003 (SketchFilterBar shell)   ─┘

T006 (MultiSelectDropdown)     ─── [P] with T008 ──────────────────────────────────────────────────────────────────────────────────────────

T008 (TagInput extension)      ─── [P] with T006

T011 (Clear button)            ─┬─→ US5 Checkpoint
T012 (Count display)           ─┤  (all parallel, different files/concerns)
T013 (Zero-results state)      ─┘

T014 (a11y)                    ─── [P] with T015
```

---

## Implementation Strategy

### MVP First (US1: Name Search Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundation (T002–T004)
3. Complete Phase 3: US1 — Name Search (T005)
4. **VALIDATE**: Search works live in browser
5. Proceed to US2, US3, US4 in order

### Incremental Delivery

1. Foundation → table still shows everything (no regression)
2. + US1 (name search) → instant search working
3. + US2 (type filter) → type filter working
4. + US3 (tag filter) → tag filter working
5. + US4 (author filter) → author filter working
6. + US5 (combined + clear) → all four filters combine, Clear works
7. + Polish → a11y and final validation

---

## Notes

- [P] tasks edit different files — safe to run in parallel
- [Story] label maps each task to the spec user story for traceability
- No new npm packages — `@radix-ui/react-popover` already installed
- No API endpoints — pure client-side filtering via `useMemo`
- `SketchTable.tsx` needs no changes — it already accepts a `data` prop
- The `useSketchFilter` hook (T002) should be complete with all four predicates before any UI is wired — this keeps the hook as a single stable module
- After T004, the app should still work identically to before (filteredData === data when no filters active)
