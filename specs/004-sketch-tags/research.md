# Research: Sketch Tags

## Tag Input UI Component

**Decision**: Custom tag-chip input built on `@radix-ui/react-popover` for the autocomplete dropdown, with no additional npm package.

**Rationale**: Radix Popover is already in the dependency tree (via `@radix-ui/react-dialog`'s peer closure), and a bespoke `TagInput` component keeps the same Tailwind/dark-theme styling already established in `SketchFormDialog`. Third-party tag-input libraries (e.g. `react-tag-input-component`, `react-tagsinput`) would ship their own CSS and conflict with Tailwind v4. The tag chip UI is straightforward: an unordered list of `<span>` chips with an inline `<input>` and a Popover-anchored dropdown. Total complexity is low.

**Alternatives considered**:
- `@radix-ui/react-combobox` — does not exist as a first-party Radix primitive; this pattern is implemented manually on top of Popover everywhere in the Radix ecosystem.
- Third-party tag-input package — adds CSS conflict risk, bundle weight, and a new peer for a ~50-line custom component.

---

## Tag Registry Storage

**Decision**: Store the registry as a JSON array of lowercase tag strings at `sketches/tags.json`.

**Rationale**: All sketch data already lives under `sketches/`. Placing `tags.json` there co-locates it with the data it describes and avoids polluting the project root. JSON array is the simplest format that zod can validate and the Vite plugin can read/write with a single `fs.readFileSync` / `fs.writeFileSync` call. No database, no additional tooling.

**Alternatives considered**:
- Root-level `tags.json` — works but clutters the project root alongside `package.json`, `vite.config.ts`, etc.
- `data/tags.json` in a new `data/` directory — adds a directory with a single file; unnecessary overhead.
- Derive tags on every request by scanning all `meta.json` files — correct but O(n) on every keystroke; defeats the purpose of a registry.

---

## Tag Normalisation

**Decision**: Store tags in the registry **lowercased**. In sketch `meta.json`, also store tags lowercased. Comparison is inherently case-insensitive because all values are lowercase.

**Rationale**: Consistent lowercase avoids "Animation" and "animation" appearing as two distinct registry entries. It aligns with the existing slug convention (kebab-case, lowercase). The spec is ambiguous about stored case; lowercase is the simpler and more predictable choice.

**Alternatives considered**:
- Preserve original case in `meta.json`, compare case-insensitively in the registry — adds a normalisation step on every lookup and risks "Animation" vs "animation" divergence in sketch metadata files.

---

## Delimiter Keys for Tag Confirmation

**Decision**: The tag input confirms a typed word (converting it to a chip) on **Enter**, **Tab**, and **Space**. Comma is also a common delimiter and will be supported.

**Rationale**: Standard tag-input UX — the user should not need to reach for a non-obvious key. Space is natural for word-based input. Enter is expected for any form confirmation. Tab allows tab-through workflows. Comma is common in tag fields.

**Alternatives considered**:
- Enter only — too restrictive; space is expected.
- Enter + Space only — Tab omitted, but Tab is useful for keyboard-only navigation and widely expected.

---

## Autocomplete Trigger Threshold

**Decision**: Show suggestions after **1 or more characters** typed (FR-010).

**Rationale**: The total number of tags in a local dev registry is expected to remain small (tens to low hundreds). Showing all tags on focus-with-no-input would be noise; showing after 1 character is responsive and consistent with the spec requirement.

**Alternatives considered**:
- 0 characters (show all on focus) — useful for large datasets but noisy for small ones; out of scope per spec.
- 2 characters — more filtering but slightly less responsive; spec says 1.

---

## API Endpoint for Tag Registry

**Decision**: Add `GET /api/tags` to the existing `sketch-api.ts` Vite plugin to return the full registry array. The frontend fetches this once when the form is mounted and filters client-side.

**Rationale**: Client-side filtering on a fetched array is instantaneous and eliminates repeated server round-trips per keystroke. The registry is small and changes infrequently (only on sketch save). This matches the existing pattern where the plugin returns simple JSON.

**Alternatives considered**:
- `GET /api/tags?q=<partial>` server-side search — unnecessary for a small local dataset; adds server complexity.
- Embed the registry in the Vite virtual module (like `import.meta.glob`) — would require a full dev-server reload to surface new tags; defeats the purpose.

---

## Existing Schema Strictness

**Decision**: Add `tags` to `SketchMetaSchema` in `scripts/lib/meta.ts` before any other changes. Use `z.array(z.string().min(1)).default([])`. Remove `.strict()` from the schema **is not needed** — adding the field to the schema is sufficient.

**Rationale**: `SketchMetaSchema` uses `.strict()`, which rejects extra keys. Adding `tags` to the schema makes it a known key. All existing `meta.json` files that omit `tags` will receive the default `[]` from zod's `.default([])`. No migration needed.

**Alternatives considered**:
- `.passthrough()` to ignore extra keys — too permissive; defeats zod's validation.
- Migration script to add `tags: []` to all existing `meta.json` files — unnecessary since zod's `.default()` handles the missing-field case at parse time.

---

## `serializeMeta` Behaviour for Tags

**Decision**: Omit the `tags` key from the serialized JSON when the array is empty (consistent with how `type` is omitted when it equals `"p5"`). When tags are present, write them as a JSON array.

**Rationale**: Keeps existing `meta.json` files unchanged for sketches without tags. Minimises diff noise in git history. Consistent with the existing pattern of omitting default-value fields.
