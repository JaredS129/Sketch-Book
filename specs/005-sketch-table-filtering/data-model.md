# Data Model: Sketch Table Filtering & Search

This feature is purely client-side state. No new persistent data structures are introduced. The entities below describe the runtime shapes managed in the browser.

---

## FilterState

The single source of truth for all active filter constraints.

| Field     | Type       | Default | Description                                      |
|-----------|------------|---------|--------------------------------------------------|
| `name`    | `string`   | `""`    | Case-insensitive substring match on sketch name  |
| `types`   | `string[]` | `[]`    | OR-match against `SketchMeta.type`; empty = all  |
| `tags`    | `string[]` | `[]`    | AND-match against `SketchMeta.tags`; empty = all |
| `authors` | `string[]` | `[]`    | OR-match against `SketchMeta.createdBy`; empty = all |

An empty/default `FilterState` means no filtering is applied (all sketches shown). The filter is "active" when at least one field is non-empty / non-empty-array.

---

## FilterOptions

The derived sets of selectable values, computed from live sketch data. These populate the dropdown option lists and the tag autocomplete. They contain only values that appear on at least one sketch.

| Field            | Type       | Source                                             |
|------------------|------------|----------------------------------------------------|
| `availableTypes`  | `string[]` | De-duped `SketchMeta.type` values, sorted          |
| `availableTags`   | `string[]` | De-duped union of all `SketchMeta.tags`, sorted    |
| `availableAuthors`| `string[]` | De-duped `SketchMeta.createdBy` values, sorted     |

These are computed once from the `data` array passed to the filter hook and re-computed only if HMR delivers new sketch data.

---

## SketchMeta (existing, unchanged)

Reproduced here for reference. The filtering feature reads these fields and adds no new fields.

| Field           | Type                              | Filterable by  |
|-----------------|-----------------------------------|----------------|
| `id`            | `string` (kebab-case slug)        | —              |
| `name`          | `string`                          | Name search    |
| `type`          | `"p5" \| "q5" \| "p5play" \| "q5play"` | Type filter   |
| `tags`          | `string[]`                        | Tag filter     |
| `createdBy`     | `string`                          | Author filter  |
| `dateCreated`   | `string` (YYYY-MM-DD)             | —              |
| `dateUpdated`   | `string` (YYYY-MM-DD)             | —              |
| `lastUpdatedBy` | `string`                          | —              |

---

## Filter Combination Rules

```
filteredSketches = allSketches.filter(sketch =>
  matchesName(sketch, filterState.name)      // substring, case-insensitive
  AND matchesTypes(sketch, filterState.types)   // OR: sketch.type ∈ selectedTypes
  AND matchesTags(sketch, filterState.tags)     // AND: every selectedTag ∈ sketch.tags
  AND matchesAuthors(sketch, filterState.authors) // OR: sketch.createdBy ∈ selectedAuthors
)
```

Each predicate short-circuits to `true` when its filter set is empty (no constraint active).

---

## State Transitions

```
Initial state: { name: "", types: [], tags: [], authors: [] }
    │
    ├─ User types in name box     → update name field
    ├─ User checks/unchecks type  → add/remove from types[]
    ├─ User adds tag chip         → add to tags[]
    ├─ User removes tag chip      → remove from tags[]
    ├─ User checks/unchecks author → add/remove from authors[]
    └─ User clicks Clear          → reset to initial state
```
