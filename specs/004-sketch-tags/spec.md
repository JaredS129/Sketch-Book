# Feature Specification: Sketch Tags

**Feature Branch**: `004-sketch-tags`

**Created**: 2026-06-23

**Status**: Draft

**Input**: User description: "I want to add another property to sketches called 'Tags' which will hold an array of single words. We should add a 'Tags' column to display the sketch tags in the sketch table as well as add the tags to the metadata display in the sketches page itself. The tags in the sketch table will need to be hidden with ellipsis if they are too long for the table cell. When creating, editing, or copying a sketch, the user should be able to input these tags one by one with a standard tags ui input. As the user types, the ui component should search for existing tags that have been used on other sketches to allow the user to easliy select existing tags that have been used already without needing to write the full word. The search should be case-insensitive. We will need some sort of centralised data where existing tags are saved to allow for easy searching, therefore on saving of sketches, this data will need to be updated."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Tags in the Sketch Gallery (Priority: P1)

A developer opens the sketch gallery and sees a Tags column in the table. Each row shows the tags for that sketch as a compact list. When the combined tag text is too long for the column width, it is clipped with an ellipsis so the table layout is not disrupted.

**Why this priority**: Displaying tags is the visible entry point for the whole feature — without it, tags have no presence in the UI. It is also the simplest deliverable and validates that the data model is in place.

**Independent Test**: Can be fully tested by adding tags to one or more sketches' metadata files directly and confirming a Tags column appears in the gallery with the correct values and ellipsis truncation.

**Acceptance Scenarios**:

1. **Given** a sketch has one or more tags in its metadata, **When** the gallery is loaded, **Then** a Tags column is visible and shows the sketch's tags as space-separated or comma-separated text within the cell.
2. **Given** a sketch has no tags, **When** the gallery is loaded, **Then** the Tags cell for that sketch is empty (not an error or placeholder text).
3. **Given** a sketch has enough tags that the combined text overflows the column width, **When** the gallery is loaded, **Then** the overflowing text is hidden with an ellipsis and the table layout is not disrupted.
4. **Given** the gallery is loaded, **When** the user hovers over a truncated Tags cell, **Then** a tooltip or title attribute reveals the full list of tags.

---

### User Story 2 - View Tags on the Sketch Page (Priority: P1)

A developer opens an individual sketch page and sees the sketch's tags displayed in the metadata panel alongside other properties such as name, type, and creation date.

**Why this priority**: Tags should be visible wherever other metadata is shown to keep the UI consistent. This is equally foundational as gallery display.

**Independent Test**: Can be fully tested by navigating to any sketch page that has tags in its metadata and confirming they appear in the metadata section.

**Acceptance Scenarios**:

1. **Given** a sketch has tags, **When** the user opens the sketch page, **Then** the tags are displayed in the metadata panel.
2. **Given** a sketch has no tags, **When** the user opens the sketch page, **Then** no Tags entry is shown (or it shows empty gracefully without breaking layout).

---

### User Story 3 - Add and Edit Tags via the Sketch Form (Priority: P2)

When creating, editing, or duplicating a sketch, the form includes a tags input field. The user can type a word and press Enter (or a delimiter key) to add it as a tag. Tags appear as removable chips/pills within the input. As the user types, a dropdown suggests existing tags from other sketches that match the partial input (case-insensitively), allowing quick selection without retyping.

**Why this priority**: Without the ability to author tags, the display features have no way to be populated through the normal UI workflow.

**Independent Test**: Can be fully tested by opening the New Sketch form, typing a partial tag, selecting a suggestion, adding another tag manually, saving, and confirming the tags appear in the gallery and sketch page.

**Acceptance Scenarios**:

1. **Given** the sketch form is open, **When** the user types a word and confirms it (e.g., presses Enter or Tab, or selects from suggestions), **Then** the word is added as a tag chip/pill in the input field.
2. **Given** a tag chip exists in the input, **When** the user clicks its remove button, **Then** the tag is removed from the input.
3. **Given** the user has typed two or more characters, **When** existing tags on other sketches match (case-insensitively), **Then** a dropdown shows those matching tags as selectable suggestions.
4. **Given** the suggestion dropdown is open, **When** the user clicks a suggestion, **Then** it is added as a tag chip and the text input is cleared.
5. **Given** the form is for duplicating a sketch, **When** the form opens, **Then** the source sketch's tags are pre-populated in the tags input.
6. **Given** the form is for editing a sketch, **When** the form opens, **Then** the existing sketch tags are pre-populated in the tags input.
7. **Given** the user types a word that already exists as a tag on this sketch, **When** they attempt to confirm it, **Then** the duplicate is silently ignored (tag not added twice).
8. **Given** the user submits the form, **When** the sketch is saved, **Then** the tags are persisted in the sketch's metadata.

---

### User Story 4 - Centralised Tag Registry Stays Current (Priority: P2)

Whenever a sketch is saved (created, edited, or duplicated), any new tags introduced are added to a central tag registry. This registry is what powers the autocomplete suggestions, ensuring all tags from all sketches are discoverable without scanning every sketch's metadata at search time.

**Why this priority**: The autocomplete feature depends on this registry. Without it, suggestions would be incomplete or require expensive full-scan lookups.

**Independent Test**: Can be tested by creating a sketch with a novel tag, then opening a second sketch's form and typing the new tag — the suggestion should appear.

**Acceptance Scenarios**:

1. **Given** a sketch is saved with a tag not previously in the registry, **When** a user opens any sketch form and types the new tag's first characters, **Then** the new tag appears as a suggestion.
2. **Given** a sketch is saved with tags that already exist in the registry, **When** the registry is updated, **Then** no duplicates are added and the registry remains deduplicated.
3. **Given** the registry exists, **When** a tag is removed from a sketch (edit/save), **Then** the tag remains in the registry (it may still be used on other sketches — registry entries are not deleted on sketch save).

---

### Edge Cases

- What happens when the user enters a multi-word phrase instead of a single word? Tags are single-word only — spaces within a tag are not permitted; the input should prevent or reject multi-word entries.
- What happens when the user enters an empty string or whitespace-only input as a tag? It should be silently ignored.
- What happens when the tag registry file does not exist yet (fresh install)? The system treats it as an empty registry with no suggestions, and creates it on first save.
- What happens when two users edit sketches simultaneously and both add new tags? Last-write-wins is acceptable for the registry since adding a tag is an additive, non-destructive operation.
- What happens when the Tags column contains only a single very long tag that overflows? The ellipsis truncation applies the same way as for multiple short tags.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sketches MUST support a `tags` property containing an ordered array of unique, single-word strings.
- **FR-002**: The sketch gallery table MUST include a Tags column displaying each sketch's tags.
- **FR-003**: The Tags column MUST truncate overflowing content with an ellipsis rather than wrapping or expanding the row.
- **FR-004**: The Tags column MUST reveal the full tag list on hover (via tooltip or native title attribute).
- **FR-005**: The sketch page metadata panel MUST display the sketch's tags when at least one tag is present.
- **FR-006**: The sketch create, edit, and duplicate forms MUST include a tag input component supporting adding and removing individual tag chips.
- **FR-007**: The tag input MUST accept a tag when the user presses Enter, Tab, or another standard delimiter key after typing a word.
- **FR-008**: The tag input MUST display each added tag as a removable chip/pill within the input area.
- **FR-009**: As the user types in the tag input, the system MUST display autocomplete suggestions drawn from the centralised tag registry, matching case-insensitively against the partial input.
- **FR-010**: Autocomplete suggestions MUST appear after at least one character has been typed.
- **FR-011**: Selecting an autocomplete suggestion MUST add it as a tag chip and clear the text input.
- **FR-012**: The tag input MUST silently reject duplicate tags for the same sketch.
- **FR-013**: The tag input MUST silently reject empty or whitespace-only tag entries.
- **FR-014**: Tags MUST be single words only; the input MUST NOT allow spaces within a tag value.
- **FR-015**: When opening the edit or duplicate form, existing tags MUST be pre-populated in the tag input.
- **FR-016**: On saving any sketch (create, edit, or duplicate), any new tags MUST be merged into the centralised tag registry.
- **FR-017**: The centralised tag registry MUST deduplicate entries — each unique tag appears exactly once regardless of how many sketches use it.
- **FR-018**: Removing a tag from a sketch MUST NOT remove it from the centralised registry.

### Key Entities

- **Tag**: A single, lowercase (or normalised) alphanumeric word associated with a sketch. Stored as a string in the sketch's `tags` array.
- **Tag Registry**: A centralised, deduplicated list of all tags that have ever been applied to any sketch. Persists between sessions and is updated on every sketch save. Used exclusively to power autocomplete suggestions.
- **Sketch Metadata**: The per-sketch data record (currently stored as `meta.json` per sketch). Gains a `tags` field: an array of tag strings, defaulting to an empty array.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Tags entered in the sketch form appear in the gallery Tags column and on the sketch page without requiring a page reload or manual data refresh.
- **SC-002**: Autocomplete suggestions appear within one second of the user typing a character in the tag input, with no perceptible lag on a local development machine.
- **SC-003**: A tag added while saving one sketch is immediately available as an autocomplete suggestion when the next sketch form is opened in the same session.
- **SC-004**: The gallery table layout remains visually stable when any sketch has a large number of tags — no row height increase, no horizontal scroll introduced by the Tags column alone.
- **SC-005**: All existing sketches without tags continue to render correctly in the gallery and on their individual pages — no broken layouts or errors due to a missing `tags` field.

---

## Assumptions

- Tags are case-insensitively compared for deduplication but stored in the case the user first entered them (or lowercased for normalisation — implementation may choose; this spec does not mandate a specific casing strategy beyond case-insensitive matching).
- The tag input enforces single-word entries: the space character is treated as a delimiter that triggers tag confirmation, not as a character within a tag.
- The tag registry is stored as a flat list in a single file on the local file system (consistent with the project's existing file-based, no-database data strategy).
- There is no tag deletion from the registry UI — the registry is append-only from a user perspective.
- The Tags column in the gallery is display-only; clicking a tag does not filter the gallery (filtering is out of scope for this feature).
- Existing sketches that do not have a `tags` field in their metadata are treated as having an empty tags array; no migration step is required beyond tolerating a missing field.
- The autocomplete suggestion list is not paginated; all matching tags are shown (the total number of unique tags in a local dev project is expected to remain small).
