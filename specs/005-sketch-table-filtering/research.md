# Research: Sketch Table Filtering & Search

## Decision 1: Filtering Architecture (Client-Side Pre-Filter vs. TanStack Built-in)

**Decision**: Pre-filter the `data` array with `useMemo` before passing to `useReactTable`, rather than using TanStack Table's `getFilteredRowModel`.

**Rationale**: All sketch metadata is already loaded eagerly in the browser via `import.meta.glob` (see `src/sketches.ts`). The data set is small (tens to low hundreds of sketches). Pure JS array `.filter()` on every render is synchronous and imperceptible at this scale. TanStack's built-in filter API adds complexity (custom `filterFn` registrations, column filter state management) with no performance benefit here. Pre-filtering also makes the "count display" in `HomePage` trivial — just `filteredData.length`.

**Alternatives considered**:
- `getFilteredRowModel` + `columnFilters` state: rejected because the multi-column, multi-value, mixed-logic filter rules (OR for type/author, AND for tags, substring for name) are awkward to express as TanStack column filters and require global filter function registration.
- Server-side `/api/sketches?type=p5&tag=foo` endpoint: rejected — spec explicitly says client-side only, no network requests needed.

---

## Decision 2: Filter State Location

**Decision**: Lift filter state to `HomePage` via a `useSketchFilter` custom hook.

**Rationale**: `HomePage` already owns the `data` array and renders the sketch count line. Lifting filter state there lets the count reflect filtered results ("3 of 12 sketches") and keeps `SketchTable` as a pure display component that just receives data. The custom hook (`useSketchFilter`) encapsulates state, derived options, filtered data, and the clear action — keeping `HomePage` clean.

**Alternatives considered**:
- Filter state inside `SketchTable`: rejected because the count line in `HomePage` would show unfiltered totals, creating a confusing UX mismatch.
- Zustand / global state: rejected — overkill for a single-page filter; no cross-route state needed.

---

## Decision 3: Type & Author Dropdown Control

**Decision**: New `MultiSelectDropdown` component using `@radix-ui/react-popover` (already installed) with a checkbox list inside the popover content.

**Rationale**: Radix Popover is already installed and used in `TagInput`. Using it for the type/author dropdowns maintains visual consistency and avoids adding any new package. The trigger button shows a count badge when items are selected (e.g., "Type · 2"). An empty selection means "no filter applied" (all pass).

**Alternatives considered**:
- Native `<select multiple>`: poor UX — no inline checkboxes, no clear badge, inconsistent dark-mode styling.
- Radix Select (single) with custom multi-select logic: more complex than simply using a Popover with managed checkboxes.

---

## Decision 4: Tag Filter Component

**Decision**: Extend the existing `TagInput` component with two optional props — `restrictToExisting` and `showAllWhenFocused` — rather than creating a separate `TagFilterInput`.

**Rationale**: The tag filter behavior is nearly identical to `TagInput` except: (a) free-form entry is disallowed (only registered tags are accepted) and (b) suggestions should appear even with no text typed (to show available tags on focus). Adding two optional boolean props to `TagInput` with safe defaults preserves backward compatibility and keeps a single tag component.

**Alternatives considered**:
- Duplicate component `TagFilterInput.tsx`: more code to maintain for minimal behavioral difference.
- Fully separate component: rejected for same reason.

---

## Decision 5: Available Tags Source

**Decision**: Derive `availableTags` from the live sketch data (`data.flatMap(s => s.tags ?? [])` de-duped and sorted), not from `sketches/tags.json`.

**Rationale**: `tags.json` is append-only and may contain tags that no sketch currently uses. The spec requires the filter to "not accept tags that don't exist on any sketch". Using sketch data as the source guarantees this invariant. The `tags.json` registry remains the source for the form `TagInput` (which suggests tags for assigning to sketches, including "future" tags not yet used widely).

**Alternatives considered**:
- Importing `tags.json` directly: rejected — the file is a superset of tags-in-use; stale or unused tags would appear in the filter.

---

## Decision 6: Filter Combination Logic

**Decision**: AND across filter types; OR within type-filter and author-filter; AND within tag-filter.

**Rationale**: Matches the spec requirements (FR-004, FR-006, FR-008, FR-009). A sketch must satisfy all active filter types simultaneously (name AND types AND tags AND author). Within each type/author selection, any match is sufficient (OR). Within tag selection, all tags must be present (AND — user is drilling down to sketches with all chosen topics).

---

## Decision 7: Clear Button Visibility

**Decision**: The Clear button is rendered at all times but is disabled + visually muted when no filters are active (rather than hidden).

**Rationale**: Hiding the Clear button causes layout shift when filters activate. Keeping it visible but disabled is common convention (Google, GitHub filters), prevents CLS, and allows users to discover its purpose even before filters are active. A disabled state is communicated via reduced opacity and `disabled` attribute.

---

## No NEEDS CLARIFICATION Remaining

All open questions from the spec have been resolved through codebase analysis and the decisions above. No additional research is needed.
