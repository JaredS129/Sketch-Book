# UI Component Contracts: Sketch Table Filtering

This feature introduces no new HTTP API endpoints. All filtering is client-side. The contracts below describe the component interface boundaries (props) and the custom hook API.

---

## useSketchFilter Hook

Encapsulates all filter state, derived options, filtered data, and the clear action.

```typescript
function useSketchFilter(data: SketchMeta[]): {
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  filteredData: SketchMeta[];
  availableTypes: string[];
  availableTags: string[];
  availableAuthors: string[];
  isFiltering: boolean;  // true when any filter is active
  clearFilters: () => void;
}
```

**Input**: The full, unfiltered `SketchMeta[]` array.

**Returns**:
- `filter` — current `FilterState`
- `setFilter` — updater (used internally by `SketchFilterBar`)
- `filteredData` — memoised subset of `data` matching all active constraints
- `availableTypes` — de-duped, sorted type values from `data`
- `availableTags` — de-duped, sorted tags from all sketches in `data`
- `availableAuthors` — de-duped, sorted `createdBy` values from `data`
- `isFiltering` — convenience flag; `true` when any filter field is non-empty
- `clearFilters` — resets `filter` to initial empty state

---

## SketchFilterBar Component

```typescript
interface SketchFilterBarProps {
  filter: FilterState;
  onFilterChange: React.Dispatch<React.SetStateAction<FilterState>>;
  availableTypes: string[];
  availableTags: string[];
  availableAuthors: string[];
  isFiltering: boolean;
  onClear: () => void;
}

function SketchFilterBar(props: SketchFilterBarProps): JSX.Element
```

Renders the four filter controls and the Clear button in a single horizontal (wrapping) bar. Stateless — all state flows from the parent via `filter` / `onFilterChange`.

---

## MultiSelectDropdown Component

```typescript
interface MultiSelectDropdownProps {
  label: string;           // e.g. "Type", "Author"
  options: string[];       // full list of selectable values
  selected: string[];      // currently checked values
  onChange: (selected: string[]) => void;
  placeholder?: string;    // shown in trigger when nothing selected
}

function MultiSelectDropdown(props: MultiSelectDropdownProps): JSX.Element
```

Renders a Radix Popover trigger button and a checkbox list inside the popover content. The trigger label shows `"{label}"` when nothing is selected and `"{label} · N"` when N items are selected.

---

## TagInput Component (updated props)

New optional props added for the filter use-case; existing behaviour unchanged when props are omitted:

```typescript
interface TagInputProps {
  value: string[];
  onChange(tags: string[]): void;
  allTags: string[];
  placeholder?: string;
  restrictToExisting?: boolean;   // NEW: prevent free-form tags not in allTags
  showAllWhenFocused?: boolean;   // NEW: show all unselected allTags on focus (no text needed)
}
```

When `restrictToExisting` is `true`:
- The `addTag` function returns early if the tag is not in `allTags`.
- Keyboard confirmations (Enter, Tab, comma, space) are no-ops for non-existent tags.

When `showAllWhenFocused` is `true`:
- Suggestions are computed from all unselected `allTags` (not just those matching `inputValue`), filtered by `inputValue` substring when non-empty.
- Popover opens on focus even if the input is empty (as long as unselected tags remain).

---

## FilterState Type

```typescript
interface FilterState {
  name: string;       // "" means inactive
  types: string[];    // [] means inactive
  tags: string[];     // [] means inactive
  authors: string[];  // [] means inactive
}

const EMPTY_FILTER: FilterState = { name: "", types: [], tags: [], authors: [] };
```

Exported from `src/hooks/useSketchFilter.ts` for use by both hook and bar component.
