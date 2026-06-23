# Data Model: Sketch Tags

Extends the data model established in `specs/003-sketch-management-ui/data-model.md`. Read that document first for the full entity definitions. Only additions and modifications are documented here.

---

## Modified entities

### SketchMeta — `tags` field added

`scripts/lib/meta.ts` gains one new field:

| Field  | Type       | Constraints                                            | Owned by      |
|--------|------------|--------------------------------------------------------|---------------|
| `tags` | `string[]` | Array of lowercase, single-word strings; may be empty  | create / edit |

**Validation rules**:
- Each tag MUST be a non-empty string with no whitespace characters.
- Tags are normalised to **lowercase** before storage.
- Tags are deduplicated within a single sketch's `tags` array (no repeated values per sketch).
- Maximum tag length is not enforced by the schema (practical limit: human-readable words).

**Schema change** (`SketchMetaSchema`):
```
tags: z.array(z.string().min(1)).default([])
```
The existing `.strict()` on the schema is preserved — `tags` is added as a named field, not bypassed.

**`serializeMeta` change**: When `tags` is empty, omit the key entirely from the serialized JSON (consistent with the existing pattern for `type` when it equals `"p5"`). When non-empty, write it as a standard JSON array.

---

## New entities

### TagRegistry (on-disk, `sketches/tags.json`)

A centralised, deduplicated, sorted list of every tag that has ever been applied to any sketch.

| Attribute    | Value                                                       |
|--------------|-------------------------------------------------------------|
| Location     | `sketches/tags.json`                                        |
| Format       | JSON array of lowercase strings: `["animation", "audio"]`  |
| Written by   | Vite plugin (`sketch-api.ts`) on create / edit / duplicate  |
| Read by      | Vite plugin (`GET /api/tags` endpoint)                      |
| Browser use  | Fetched once at form mount; filtered client-side for autocomplete suggestions |

**Invariants**:
- All entries are lowercase and non-empty.
- No duplicate entries.
- Entries are never removed (append-only from the system's perspective).
- If the file does not exist, the system treats the registry as `[]` and creates the file on first write.

### TagInput form state (UI only — browser state)

Transient state managed by the `TagInput` component.

| Field          | Type       | Notes                                                          |
|----------------|------------|----------------------------------------------------------------|
| `chips`        | `string[]` | Tags added so far (lowercased, deduplicated)                   |
| `inputValue`   | `string`   | Current text in the text input                                 |
| `suggestions`  | `string[]` | Registry tags matching `inputValue` (case-insensitive filter)  |
| `open`         | `boolean`  | Whether the autocomplete popover is open                       |

---

## Updated form state

### SketchFormValues — `tags` field added

The existing `SketchFormValues` type (in `SketchFormDialog.tsx`) gains:

| Field  | Type       | Notes                           |
|--------|------------|---------------------------------|
| `tags` | `string[]` | Controlled by the `TagInput` component; defaults to `[]` |

---

## Updated API request shapes

### CreateSketchRequest

```ts
{ name: string; id: string; type: SketchType; tags?: string[] }
```
`tags` defaults to `[]` server-side when absent.

### DuplicateSketchRequest

```ts
{ sourceId: string; name: string; id: string; tags?: string[] }
```
If omitted, the server inherits the source sketch's tags.

### EditSketchRequest

```ts
{ name: string; newId?: string; type: SketchType; tags?: string[] }
```
`tags` replaces the sketch's existing tag list on save.

---

## State transitions — tags

### On create / duplicate / edit (sketch save)

```
[form submitted with tags: ["animation", "audio"]]
  → server normalises tags to lowercase, deduplicates
  → writes tags to sketches/<id>/meta.json
  → reads sketches/tags.json (or treats as [] if absent)
  → merges new tags into registry (Set union, re-sorted)
  → writes updated registry to sketches/tags.json
  → Vite HMR → gallery / sketch page reflect updated tags
```

### Autocomplete lookup

```
[TagInput mounted]
  → GET /api/tags
  → receives full registry array
  → on input keystroke: filter registry case-insensitively against inputValue
  → render matching entries as Popover dropdown items
```

### Tag registry after sketch delete

No change — deleting a sketch does not modify `tags.json`. Tags from deleted sketches remain in the registry (they may still be semantically valid for future sketches).
