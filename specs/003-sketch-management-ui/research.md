# Research: Sketch Management UI

## D1 — Dev-server middleware approach

**Decision**: Use Vite's `configureServer` plugin hook to attach Connect-compatible middleware directly to the existing dev server.

**Rationale**: A single `npm run dev` process serves both the SPA and all mutation API routes. Middleware imports the existing `scripts/lib/` utilities (slug, paths, meta-io, git, date) directly — zero code duplication. The plugin is gated with `apply: 'serve'` so it is completely absent from production builds, satisfying FR-019. No second server process, no port management.

**Alternatives considered**:
- Separate Express server on a second port — rejected: requires two processes, CORS setup, and parallel start orchestration.
- `vite-plugin-api-routes` — rejected: heavyweight for four endpoints, adds an opaque abstraction layer.

---

## D2 — Gallery refresh after mutations

**Decision**: Rely on Vite's built-in file watcher (chokidar) triggering HMR / full-page reload after filesystem changes made by middleware.

**Rationale**: `src/sketches.ts` uses `import.meta.glob` evaluated at module load time. Because it has no custom `import.meta.hot.accept` handler, any change to a tracked file causes Vite to perform a full-page reload. When the middleware creates, renames, or deletes sketch folders, chokidar detects the new/changed/missing `meta.json` and `sketch.ts` files within ~500ms and triggers the reload automatically. No explicit `window.location.reload()` call is needed from the frontend. This satisfies SC-005 (≤ 3 seconds).

**Alternatives considered**:
- SSE / WebSocket push from middleware + React state update — rejected: overengineered for a local dev tool. Vite already does this for free.
- Polling — rejected: wasteful, adds latency, and Vite's watcher is more reliable.

---

## D3 — Slug derivation in the browser

**Decision**: Import `slugify` and `isValidSlug` directly from `scripts/lib/slug.ts` in browser form components.

**Rationale**: `slug.ts` contains no Node-only imports — it is pure TypeScript with no `fs`, `path`, or `child_process` usage. Vite bundles it into the browser bundle without modification. The form can derive and validate the slug live as the user types (satisfying FR-003), using the same logic as the CLI scripts and the server middleware, ensuring consistency.

**Alternatives considered**:
- Duplicate the slug logic into `src/lib/` — rejected: creates a divergence risk.
- Call an API endpoint to derive the slug — rejected: adds unnecessary latency to every keystroke.

---

## D4 — Edit sketch: slug rename atomicity

**Decision**: A slug change (via the gallery edit form) performs the following sequence server-side: (1) verify new slug does not exist; (2) `fs.renameSync(oldDir, newDir)`; (3) `writeMeta(newId, updatedMeta)`. If step 1 fails, return error with no filesystem changes. Steps 2 and 3 are not independently reversible but the window of inconsistency is sub-millisecond on a local filesystem.

**Rationale**: Full transactional rollback (copy-rename-delete) is unnecessary for a local single-user dev tool. The conflict check in step 1 covers the common error case. If step 2 succeeds but step 3 fails, the folder has the new name but the old `meta.json` id — a known recoverable state the developer can fix manually (and a vanishingly rare scenario on local disk).

**Alternatives considered**:
- Copy → write-new-meta → delete-old: fully reversible but unnecessarily slow for large sketch assets.
- A lock file during rename: overkill for single-user local use.

---

## D5 — Dialog/modal component

**Decision**: Install `@radix-ui/react-dialog` for the create/duplicate/edit modals and the delete confirmation prompt.

**Rationale**: The project already uses `@radix-ui/react-slot`. Radix Dialog is the idiomatic companion; it handles focus trapping, keyboard dismissal (Escape), and accessibility automatically. The four forms (create, duplicate, edit, delete-confirm) are identical in behaviour requirements — a single shared `SketchFormDialog` component can render different field sets based on the operation mode.

**Alternatives considered**:
- Custom portal + modal: works but requires reimplementing focus trap, keyboard events, and ARIA attributes.
- `@headlessui/react`: viable but inconsistent with the Radix ecosystem already in use.

---

## D6 — New `edit-sketch` server capability

**Decision**: Add a new `scripts/edit-sketch.ts` CLI script and a shared internal module (`scripts/lib/edit-sketch-op.ts`) containing the pure operation logic. The Vite middleware calls the shared module directly; the CLI script wraps it with argument parsing.

**Rationale**: Keeps the pattern consistent with existing scripts (each has a thin CLI wrapper + shared `scripts/lib/` utilities). The middleware never shells out to Node subprocesses — it imports the module directly for synchronous, in-process execution.

**Alternatives considered**:
- Inline the edit logic in the middleware only: would leave the CLI without an edit capability.
- Shell out to the CLI script from middleware: slower, error handling is harder, creates a circular dependency.

---

## D7 — API response shape

**Decision**: All four API endpoints return `{ ok: true }` on success (HTTP 200) and `{ ok: false, error: string }` on failure (HTTP 400 for user errors, HTTP 500 for unexpected errors). The frontend checks `ok` and surfaces `error` in the form.

**Rationale**: Minimal, consistent, easy to type with a single discriminated union. No need for full REST resource bodies — the SPA re-reads state from the refreshed glob after every mutation.

---

## D8 — `update-sketch-meta` fields

**Decision**: The `dateUpdated` and `lastUpdatedBy` fields in `meta.json` are NOT updated by any middleware endpoint. They remain the exclusive domain of the CI `update-sketch-meta` script.

**Rationale**: Explicitly stated in the spec (FR-022 / Assumption 7). The edit operation only writes `id`, `name`, `type`, `dateCreated`, and `createdBy` (inherited unchanged from the source). This keeps CI's ownership of those fields clean.
