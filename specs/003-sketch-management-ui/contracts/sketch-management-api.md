# Contract: Sketch Management API

**Availability**: Dev server only (`npm run dev`). All endpoints return 404 or are absent in a production static build.

**Base path**: `/api/sketches`

**Content-Type**: `application/json` for all request bodies and responses.

---

## Shared response type

```
{ "ok": true }                          // success (HTTP 200)
{ "ok": false, "error": "<message>" }  // failure (HTTP 400 or 500)
```

---

## POST /api/sketches — Create sketch

Creates a new sketch from a template.

**Request body**:
```json
{
  "name": "My New Sketch",
  "id": "my-new-sketch",
  "type": "p5"
}
```

| Field  | Required | Constraints                                        |
|--------|----------|----------------------------------------------------|
| `name` | yes      | Non-empty string (after trim)                      |
| `id`   | yes      | Kebab-case slug; MUST NOT match an existing folder |
| `type` | yes      | One of: `"p5"`, `"q5"`, `"p5play"`, `"q5play"`   |

**Success** (HTTP 200): `{ "ok": true }`

**Errors** (HTTP 400):
- `"name is required"` — empty or whitespace-only name
- `"id is required"` — empty id
- `"invalid id: must be kebab-case slug"` — id fails slug pattern
- `"sketch '<id>' already exists"` — folder collision
- `"invalid type"` — type not in enum

---

## POST /api/sketches/:sourceId/duplicate — Duplicate sketch

Copies all files from an existing sketch to a new folder with fresh identity metadata.

**Request body**:
```json
{
  "name": "My New Sketch - Copy",
  "id": "my-new-sketch-copy"
}
```

| Field      | Required | Constraints                                        |
|------------|----------|----------------------------------------------------|
| `name`     | yes      | Non-empty string (after trim)                      |
| `id`       | yes      | Kebab-case slug; MUST NOT match an existing folder |

**Path parameter**: `:sourceId` — the id of the sketch to copy from.

**Success** (HTTP 200): `{ "ok": true }`

**Errors** (HTTP 400):
- `"source sketch '<sourceId>' not found"` — source folder does not exist
- `"name is required"` / `"id is required"` / `"invalid id: ..."` — see Create
- `"sketch '<id>' already exists"` — destination folder collision

---

## PATCH /api/sketches/:id — Edit sketch

Updates a sketch's display name, type, and optionally its slug/id. If `newId` differs from `:id`, the sketch folder is renamed.

**Request body**:
```json
{
  "name": "Updated Name",
  "type": "q5",
  "newId": "updated-name"
}
```

| Field   | Required | Constraints                                              |
|---------|----------|----------------------------------------------------------|
| `name`  | yes      | Non-empty string (after trim)                            |
| `type`  | yes      | One of: `"p5"`, `"q5"`, `"p5play"`, `"q5play"`         |
| `newId` | no       | Kebab-case slug; if provided and different from `:id`, triggers rename; MUST NOT match an existing folder |

**Path parameter**: `:id` — the current id of the sketch to edit.

**Success** (HTTP 200): `{ "ok": true }`

**Errors** (HTTP 400):
- `"sketch '<id>' not found"` — target folder does not exist
- `"name is required"` / `"invalid type"` — see Create
- `"invalid newId: must be kebab-case slug"` — newId fails slug pattern
- `"sketch '<newId>' already exists"` — rename target collision

---

## DELETE /api/sketches/:id — Delete sketch

Permanently removes a sketch folder and all its contents.

**Request body**: none

**Path parameter**: `:id` — the id of the sketch to delete.

**Success** (HTTP 200): `{ "ok": true }`

**Errors** (HTTP 400):
- `"sketch '<id>' not found"` — folder does not exist

---

## Client-side contract

The browser SPA never reads back a sketch from the API. After any successful mutation, Vite HMR detects the filesystem change and triggers a full-page reload, at which point `src/sketches.ts` re-discovers the current state from disk via `import.meta.glob`. The SPA only calls these endpoints to trigger mutations; the source of truth remains the filesystem.
