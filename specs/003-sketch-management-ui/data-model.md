# Data Model: Sketch Management UI

## Existing entities (unchanged)

### SketchMeta (source of truth: `scripts/lib/meta.ts`)

| Field           | Type                              | Constraints                        | Owned by             |
|-----------------|-----------------------------------|------------------------------------|----------------------|
| `id`            | `string`                          | kebab-case slug, unique, non-empty | create / edit        |
| `name`          | `string`                          | non-empty after trim               | create / edit        |
| `dateCreated`   | `string` (YYYY-MM-DD)             | ISO date                           | create only          |
| `dateUpdated`   | `string` (YYYY-MM-DD)             | ISO date                           | CI only (FR-022)     |
| `createdBy`     | `string`                          | non-empty, from git config         | create only          |
| `lastUpdatedBy` | `string`                          | non-empty, from git config         | CI only (FR-022)     |
| `type`          | `"p5" \| "q5" \| "p5play" \| "q5play"` | enum                          | create / edit        |

**Validation rules** (shared between CLI scripts, middleware, and browser forms):
- `id` MUST match `/^[a-z0-9]+(-[a-z0-9]+)*$/` (kebab-case)
- `id` MUST be unique across all sketch folders on disk
- `name` MUST be non-empty after trimming whitespace
- `type` MUST be one of the four values in `SKETCH_TYPES`

**Slug derivation** (from `scripts/lib/slug.ts`, importable in browser):
- NFKD-normalize → strip diacritics → lowercase → spaces/underscores → `-` → strip non-`[a-z0-9-]` → collapse `-` runs → trim leading/trailing `-`

### Sketch folder (on-disk layout, unchanged)

```
sketches/<id>/
├── meta.json          # Serialized SketchMeta (canonical form: 2-space JSON + newline)
├── sketch.ts          # Sketch source (TypeScript, instance mode)
└── globals.ts         # Optional; present for p5play type only
```

---

## New entities introduced by this feature

### SketchFormValues (UI only — browser state)

Transient form state for the create, duplicate, and edit dialogs.

| Field      | Type        | Notes                                                    |
|------------|-------------|----------------------------------------------------------|
| `name`     | `string`    | Controlled input; drives slug auto-derivation            |
| `id`       | `string`    | Derived from name unless user has manually edited it     |
| `type`     | `SketchType`| Defaults to `"p5"` for create; inherited for duplicate/edit |
| `slugDirty`| `boolean`   | True once user manually edits the id field               |

`slugDirty` controls the auto-derivation behaviour:
- `false` → on every `name` change, recompute `id = slugify(name)`
- `true` → `id` is independently controlled; name changes do not affect it

### CreateSketchRequest (middleware input)

```ts
{ name: string; id: string; type: SketchType }
```

### DuplicateSketchRequest (middleware input)

```ts
{ sourceId: string; name: string; id: string }
// type is inherited from sourceMeta.type server-side; not passed by the client
```

### EditSketchRequest (middleware input)

```ts
{ name: string; newId?: string; type: SketchType }
// newId is optional: omit to keep the current id (name-only or type-only edit)
```

### ApiResponse (middleware output — all endpoints)

```ts
{ ok: true } | { ok: false; error: string }
```

HTTP status codes: 200 (ok), 400 (user/validation error), 500 (unexpected server error).

---

## State transitions

### Create

```
[no folder]
  → POST /api/sketches { name, id, type }
  → [sketches/<id>/ created with meta.json + sketch.ts (+ globals.ts if p5play)]
  → Vite HMR detects new files → page reload → gallery includes new row
```

### Duplicate

```
[sketches/<sourceId>/ exists]
  → POST /api/sketches/<sourceId>/duplicate { name, id }
  → [sketches/<id>/ created as fs.cpSync of source, meta.json overwritten with fresh identity]
  → Vite HMR → page reload → gallery includes duplicate row
```

### Edit (name/type only — no slug change)

```
[sketches/<id>/ exists]
  → PATCH /api/sketches/<id> { name, type }
  → [meta.json rewritten with new name/type; folder and id unchanged]
  → Vite HMR → page reload → gallery row reflects new name/type
```

### Edit (with slug change)

```
[sketches/<oldId>/ exists]
  → PATCH /api/sketches/<oldId> { name, newId, type }
  → [conflict check: sketches/<newId>/ must not exist]
  → [fs.renameSync(oldDir, newDir)]
  → [writeMeta(newId, { ...meta, id: newId, name, type })]
  → Vite HMR → page reload → gallery row has new id/name/type
  → browser navigates to / (old /sketch/<oldId> URL is now stale)
```

### Delete

```
[sketches/<id>/ exists]
  → DELETE /api/sketches/<id>
  → [fs.rmSync(dir, { recursive: true, force: true })]
  → Vite HMR → page reload → gallery row removed
  → (if triggered from sketch page) browser navigates to /
```
