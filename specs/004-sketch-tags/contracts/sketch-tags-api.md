# Contract: Sketch Tags API

**Availability**: Dev server only (`npm run dev`). Absent in production static builds.

**Content-Type**: `application/json` for all responses.

This document covers only the additions made by the Sketch Tags feature. For the full existing endpoint set (create, duplicate, edit, delete) see `specs/003-sketch-management-ui/contracts/sketch-management-api.md`.

---

## New endpoint

### GET /api/tags — Fetch tag registry

Returns the full deduplicated list of all tags that have ever been applied to any sketch. Used by the tag input autocomplete.

**Request body**: none

**Success** (HTTP 200):
```json
["animation", "audio", "generative", "physics"]
```

The response is a JSON array of lowercase strings, sorted alphabetically. An empty registry returns `[]`.

**Errors**: None expected. If `sketches/tags.json` does not exist, returns `[]`.

---

## Modified endpoints

The following existing endpoints (from `003-sketch-management-ui`) accept an optional `tags` field in their request body. When omitted, `tags` defaults to `[]` for create/edit; for duplicate it inherits the source sketch's tags.

### POST /api/sketches — Create sketch (modified)

**Added field**:

| Field  | Required | Constraints                                                  |
|--------|----------|--------------------------------------------------------------|
| `tags` | no       | Array of strings. Each entry: non-empty, single-word, will be lowercased. Defaults to `[]`. |

**Example request body**:
```json
{
  "name": "My New Sketch",
  "id": "my-new-sketch",
  "type": "p5",
  "tags": ["animation", "generative"]
}
```

**Side effect**: On success, any tags not already in `sketches/tags.json` are merged into the registry.

---

### POST /api/sketches/:sourceId/duplicate — Duplicate sketch (modified)

**Added field**:

| Field  | Required | Constraints                                                  |
|--------|----------|--------------------------------------------------------------|
| `tags` | no       | Array of strings. If omitted, inherits the source sketch's tags. |

**Example request body**:
```json
{
  "name": "My New Sketch - Copy",
  "id": "my-new-sketch-copy",
  "tags": ["animation"]
}
```

**Side effect**: On success, any tags not already in the registry are merged.

---

### PATCH /api/sketches/:id — Edit sketch (modified)

**Added field**:

| Field  | Required | Constraints                                                  |
|--------|----------|--------------------------------------------------------------|
| `tags` | no       | Array of strings. Replaces the sketch's current tag list. Defaults to `[]` when omitted. |

**Example request body**:
```json
{
  "name": "My Sketch",
  "type": "p5",
  "tags": ["audio", "interactive"]
}
```

**Side effect**: On success, any tags not already in the registry are merged. Tags removed from the sketch remain in the registry.

---

## Tag validation rules (server-side, all endpoints)

- Each tag MUST be a non-empty string.
- Tags are trimmed and lowercased before storage.
- Tags containing whitespace are rejected with HTTP 400: `"tag '<value>' must be a single word (no spaces)"`.
- Duplicate tags within a single request array are deduplicated silently.
