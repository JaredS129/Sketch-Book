# Feature Specification: Sketch Management UI

**Feature Branch**: `003-sketch-management-ui`

**Created**: 2026-06-23

**Status**: Draft

**Input**: User description: "Please spec the feature we've outlined above with the following additions and considerations: 1. functions like creating a new sketch need to implement a form that holds inputs for the name, slug/id, and type. The slug/id should be auto-filled but editable. 2. Include a duplicate sketch function that utilises the duplicate-sketch script accessible via a new 'actions' column in the sketches table that will hold both the duplicate icon button and delete button. The duplicate function should also use a form that offers the same editing options as the create sketch function. 3. Add a new function/script for editing existing sketches. add it's icon button to the actions column also. it should simply add functionality to edit a sketches name, id, type etc. 4. Don't worry about handling anything to do with the update-sketch-meta script yet. We will keep this handled by ci only for now. 5. edit and delete should also be accessible from the sketches page itself, although the user should not be able to edit the slug/id from this screen to avoid potential bugs."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a New Sketch (Priority: P1)

A developer opens the sketch gallery and clicks a "New Sketch" button. A form appears where they enter a name, optionally adjust the auto-generated slug/id, and choose a sketch type. On confirmation, the new sketch is created and immediately appears in the gallery.

**Why this priority**: Creating sketches is the entry point to all other sketch work. Without this in the UI, users must leave the browser to run a CLI command.

**Independent Test**: Can be fully tested by clicking "New Sketch," filling in the form, submitting, and confirming the new sketch row appears in the gallery — delivers standalone value even without edit/delete.

**Acceptance Scenarios**:

1. **Given** the gallery is open, **When** the user clicks "New Sketch" and submits a valid name with a valid auto-filled slug and a chosen type, **Then** a new sketch is created and appears in the gallery table without a page reload.
2. **Given** the "New Sketch" form is open, **When** the user edits the slug/id field to a custom value, **Then** the custom slug is used (not re-derived from the name).
3. **Given** the "New Sketch" form is open, **When** the user clears or leaves the name empty and attempts to submit, **Then** the form shows a validation error and does not proceed.
4. **Given** the "New Sketch" form is open, **When** the user enters a name whose derived slug already exists, **Then** the slug field is highlighted as conflicting and submission is blocked.
5. **Given** the "New Sketch" form is open, **When** the user cancels or dismisses the form, **Then** no sketch is created and the gallery is unchanged.

---

### User Story 2 - Duplicate an Existing Sketch (Priority: P2)

A developer finds a sketch in the gallery and clicks the duplicate icon in the actions column. A pre-filled form appears showing a suggested name (e.g., "My Sketch - Copy") and derived slug, both of which can be edited. The type is inherited from the source. On confirmation, the duplicate is created and appears in the gallery.

**Why this priority**: Duplication is the fastest way to start a variation of existing work — high-frequency workflow for iterating on sketches.

**Independent Test**: Can be fully tested in the gallery actions column by duplicating any existing sketch and confirming a new row appears with the expected name and type.

**Acceptance Scenarios**:

1. **Given** a sketch exists in the gallery, **When** the user clicks the duplicate icon, **Then** a form opens pre-filled with a suggested name, derived slug, and the source sketch's type.
2. **Given** the duplicate form is open, **When** the user edits the name, **Then** the slug updates automatically to reflect the new name (while still being independently editable).
3. **Given** the duplicate form is open and the user submits, **Then** the new sketch appears in the gallery with all source sketch files copied and fresh authorship/date metadata.
4. **Given** the duplicate form has a slug that already exists, **When** the user attempts to submit, **Then** submission is blocked and a conflict error is shown.

---

### User Story 3 - Edit a Sketch's Metadata (Priority: P3)

A developer wants to rename a sketch or change its type. They can do this from two places: (a) the gallery's actions column edit icon, which allows editing name, slug/id, and type; or (b) the individual sketch page, which allows editing name and type only (slug/id is locked to prevent broken links).

**Why this priority**: Metadata correction is needed less frequently than creation or duplication, but critical for keeping the gallery organized. The sketch-page entry point is a convenience shortcut.

**Independent Test**: Can be tested independently by clicking the edit icon in the gallery, changing the name and type, confirming, and verifying the gallery row updates — delivers value without the sketch-page entry point.

**Acceptance Scenarios**:

1. **Given** the gallery edit form is open, **When** the user changes the name, slug, or type and confirms, **Then** the sketch's metadata is updated and the gallery reflects the new values.
2. **Given** the edit form is opened from the sketch page, **Then** the slug/id field is absent (or visibly locked/read-only) and cannot be changed.
3. **Given** the gallery edit form, **When** the user changes the slug to one already used by another sketch, **Then** the form shows a conflict error and blocks submission.
4. **Given** the user edits a sketch's slug in the gallery form and confirms, **Then** the sketch's folder is renamed to match the new slug and all file references remain consistent.
5. **Given** the user is on the sketch page and opens the edit form, **When** they change the name and confirm, **Then** the sketch page title reflects the new name.

---

### User Story 4 - Delete a Sketch (Priority: P4)

A developer wants to permanently remove a sketch. A delete icon appears in the gallery actions column and also on the individual sketch page. Clicking it shows a confirmation prompt before any data is removed.

**Why this priority**: Deletion is a destructive operation, so it is lower priority than creation/edit — but still important for gallery hygiene.

**Independent Test**: Can be tested by clicking the delete icon in the gallery for any sketch, confirming the prompt, and verifying the row disappears.

**Acceptance Scenarios**:

1. **Given** a sketch exists in the gallery, **When** the user clicks the delete icon and confirms, **Then** the sketch is permanently removed and the gallery row disappears.
2. **Given** the delete confirmation prompt is open, **When** the user cancels, **Then** no changes occur.
3. **Given** the user is on a sketch page, **When** they click the delete button and confirm, **Then** the sketch is removed and the user is redirected to the gallery.

---

### Edge Cases

- What happens when the dev server middleware is unavailable (e.g., user accidentally opened the production build)? All mutation actions should be gracefully disabled or show an error indicating mutations are not available.
- What happens if a slug update causes a filesystem rename failure (e.g., permissions issue)? The error should be surfaced clearly and the sketch's previous state preserved.
- What if two browser tabs attempt to create a sketch with the same slug simultaneously? The second request should receive a conflict error; no data is corrupted.
- What happens when the sketch type options list changes (new types added)? The form should always show the current list of valid types.
- What if the name field input is entirely whitespace? Treated the same as empty — validation error, blocked submission.

---

## Requirements *(mandatory)*

### Functional Requirements

**Create Sketch**

- **FR-001**: The gallery MUST include a "New Sketch" button visible at all times (not dependent on existing sketches being present).
- **FR-002**: Clicking "New Sketch" MUST open a form containing: a name field, a slug/id field (auto-derived from the name but independently editable), and a type selector showing all valid sketch types.
- **FR-003**: The slug/id field MUST update automatically as the user types a name, unless the user has manually edited the slug field (at which point auto-derivation stops).
- **FR-004**: The form MUST block submission and show field-level errors when: the name is empty or whitespace-only, the slug is empty or contains invalid characters, or the slug conflicts with an existing sketch.
- **FR-005**: On successful submission, the new sketch MUST appear in the gallery without requiring a manual page reload.

**Duplicate Sketch**

- **FR-006**: The gallery sketch table MUST include an "Actions" column containing icon buttons for duplicate, edit, and delete — one set per row.
- **FR-007**: Clicking the duplicate icon MUST open a form pre-filled with a suggested name (e.g., "[Source Name] - Copy"), a derived slug, and the source sketch's type.
- **FR-008**: The duplicate form MUST apply the same validation rules as the create form (FR-004).
- **FR-009**: On successful duplication, all source sketch files MUST be copied to the new sketch folder and fresh authorship/date metadata MUST be written.

**Edit Sketch**

- **FR-010**: A new server-side edit capability MUST be introduced to support renaming a sketch's display name, changing its slug/id, and changing its type — updating all relevant files and folder names atomically.
- **FR-011**: Clicking the edit icon in the gallery actions column MUST open a form pre-filled with the sketch's current name, slug/id, and type — all fields editable.
- **FR-012**: Clicking the edit button on the individual sketch page MUST open a form pre-filled with the sketch's current name and type only; the slug/id field MUST NOT be present or editable from this context.
- **FR-013**: If a slug change is requested, the sketch's folder MUST be renamed to match the new slug before the operation is reported as successful.
- **FR-014**: A slug conflict during edit MUST be caught before any filesystem changes are made, and the error MUST be reported to the user without partial side effects.

**Delete Sketch**

- **FR-015**: Clicking the delete icon in the gallery actions column MUST show a confirmation prompt naming the sketch before any deletion occurs.
- **FR-016**: The individual sketch page MUST include a delete button that triggers the same confirmation prompt.
- **FR-017**: On confirmed deletion from the sketch page, the user MUST be navigated back to the gallery after the sketch is removed.
- **FR-018**: Deletion MUST be irreversible — no soft-delete or trash.

**General / Cross-cutting**

- **FR-019**: All mutation actions (create, duplicate, edit, delete) MUST be routed through the local dev server. They MUST NOT be available when the app is served from a static production build.
- **FR-020**: All forms MUST be dismissible without side effects via a cancel button or pressing Escape.
- **FR-021**: The gallery MUST reflect the current sketch list (including any mutations) without requiring a full page reload.
- **FR-022**: The `update-sketch-meta` script and its automated CI behaviour remain unchanged and are out of scope for this feature.

### Key Entities

- **Sketch**: A named creative work with a unique slug/id, a display name, a type (e.g., `p5`, `q5`, `p5play`), and associated source files stored in a folder named after the slug.
- **Sketch Action**: A user-initiated mutation (create, duplicate, edit, delete) applied to a single sketch at a time.
- **Slug/ID**: A URL-safe, filesystem-safe identifier derived from the sketch's name, unique across all sketches. Changing it renames the sketch folder.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can create a new sketch from the browser gallery in under 30 seconds from first click to the sketch appearing in the list.
- **SC-002**: A developer can duplicate, edit, or delete a sketch from the gallery actions column in under 20 seconds from first click to confirmation.
- **SC-003**: All four sketch management operations (create, duplicate, edit, delete) complete without requiring a manual browser refresh or CLI command.
- **SC-004**: Submitting a form with invalid data (empty name, conflicting slug, invalid characters) surfaces a clear, field-level error message within 1 second and does not trigger any filesystem changes.
- **SC-005**: The sketch gallery accurately reflects the current state of sketches on disk within 3 seconds of any successful mutation.
- **SC-006**: All mutation actions are unavailable or visibly inoperative when the app is not running as a local dev server, with no silent failures.

---

## Assumptions

- This feature targets local development use only. No authentication, authorization, or multi-user conflict resolution is required.
- The app is always run via the development server command; a production static build is not a supported target for sketch mutations.
- Sketch types are a fixed, known set defined in the existing codebase; the type selector in forms pulls from this same source.
- The developer running the server has write access to the sketches directory on disk.
- The existing slug derivation logic (shared between CLI scripts) is the canonical implementation and will be reused by the new server-side edit capability.
- Git authorship (creator/updater name) is resolved from the local git config, consistent with the existing CLI scripts.
- The `update-sketch-meta` fields (`dateUpdated`, `lastUpdatedBy`) are managed by CI only and are not modified by any UI-triggered mutation in this feature.
- Renaming a sketch's slug (via the gallery edit form) will update the folder name and meta.json `id` field but will not update any external references (e.g., bookmarks or shared links) — this is an accepted limitation for a local dev tool.
