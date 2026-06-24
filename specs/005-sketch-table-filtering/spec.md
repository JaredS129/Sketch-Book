# Feature Specification: Sketch Table Filtering & Search

**Feature Branch**: `Sketch-table-filtering`

**Created**: 2026-06-24

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search Sketches by Name (Priority: P1)

As a user browsing the sketch gallery, I want to type a name (or partial name) into a search box and immediately see only matching sketches in the table, so I can quickly locate a specific sketch without scrolling.

**Why this priority**: Name search is the most common, lowest-friction lookup. It delivers standalone value with zero other filters present.

**Independent Test**: Can be tested end-to-end by visiting the gallery, typing a partial sketch name, and confirming the table updates to show only sketches whose names contain that text (case-insensitive).

**Acceptance Scenarios**:

1. **Given** sketches are loaded in the table, **When** the user types "wave" into the search box, **Then** the table immediately updates to show only sketches whose names contain "wave" (case-insensitive), with no button press required.
2. **Given** a name search is active, **When** the user clears the search box, **Then** all sketches reappear.
3. **Given** a search term matches nothing, **When** the user types it, **Then** the table shows an empty state (zero rows) with a friendly message.

---

### User Story 2 - Filter by Sketch Type (Priority: P2)

As a user, I want to filter the sketch table to show only sketches of one or more types (e.g., `p5`, `q5`, `p5play`, `q5play`), so I can focus on sketches using a particular library.

**Why this priority**: Type is a coarse, high-value grouping signal. Delivering this filter alone already segments the gallery usefully.

**Independent Test**: Can be tested by opening the type dropdown, selecting one or more types, and confirming the table shows only sketches of the selected types.

**Acceptance Scenarios**:

1. **Given** sketches of multiple types exist, **When** the user opens the type dropdown and checks "p5", **Then** only `p5` sketches appear in the table.
2. **Given** the type dropdown is open, **When** the user checks both "p5" and "q5", **Then** sketches of either type appear (OR logic).
3. **Given** a type filter is active, **When** the user unchecks all types, **Then** all sketches reappear (no type filter applied).
4. **Given** the dropdown is populated, **Then** it only lists types that actually exist on at least one sketch in the gallery.

---

### User Story 3 - Filter by Tags (Priority: P3)

As a user, I want to filter sketches by one or more tags, so I can find sketches grouped by topic or technique.

**Why this priority**: Tags are more granular than type and build on the existing tagging feature; very useful once the tag corpus grows.

**Independent Test**: Can be tested by selecting a tag from the tag filter autocomplete and confirming only sketches with that tag appear.

**Acceptance Scenarios**:

1. **Given** sketches with tags exist, **When** the user types in the tag filter and selects "generative", **Then** only sketches tagged "generative" appear.
2. **Given** the user selects multiple tags, **Then** the table shows sketches that have **all** selected tags (AND logic — sketches must match every selected tag).
3. **Given** the user types a partial tag string, **Then** the autocomplete dropdown suggests only tags that exist on at least one sketch (no invented tags accepted).
4. **Given** a tag chip is shown in the filter, **When** the user removes it, **Then** the table updates immediately.

---

### User Story 4 - Filter by Author (Priority: P4)

As a user, I want to filter the table to show sketches by one or more specific authors (the "Created by" field), so I can browse work by a particular person.

**Why this priority**: Author filtering is useful in multi-author galleries but lower priority since many installs are single-author.

**Independent Test**: Can be tested by opening the author dropdown, selecting one name, and verifying only their sketches appear.

**Acceptance Scenarios**:

1. **Given** multiple authors exist, **When** the user opens the author dropdown and selects one, **Then** only that author's sketches appear.
2. **Given** multiple authors are selected, **Then** sketches from any of the selected authors appear (OR logic).
3. **Given** the dropdown is populated, **Then** it lists only authors present in the current gallery (no phantom names).

---

### User Story 5 - Combine All Filters and Clear (Priority: P1)

As a user, I want all active filters and the name search to combine their constraints simultaneously, and I want a single "Clear" button to reset everything, so I can refine my view precisely and return to the full gallery easily.

**Why this priority**: Combined filtering and easy reset are the glue that makes the whole feature cohesive and trustworthy.

**Independent Test**: Can be tested by activating name search + type filter + tag filter + author filter simultaneously and verifying the result set is the correct intersection; then clicking Clear and verifying all rows return.

**Acceptance Scenarios**:

1. **Given** a name search, type filter, tag filter, and author filter are all active, **Then** the table shows only sketches that satisfy **all** active constraints simultaneously.
2. **Given** one or more filters are active, **When** the user clicks the "Clear" button, **Then** all filters and the search box reset to empty and all sketches reappear.
3. **Given** no filters are active, **Then** the "Clear" button is either hidden or visually disabled.

---

### Edge Cases

- What happens when the sketch list is empty (no sketches exist)? → Dropdowns show no options; search shows empty state.
- What happens when a sketch has no tags? → It is excluded from results when any tag filter is active, but appears normally when no tag filter is active.
- What happens when a sketch has no type set? → It is excluded from results when a type filter is active.
- What happens when a sketch has no author set? → It is excluded from results when an author filter is active.
- What happens when two filters in combination produce zero results? → Table shows an empty-state message; Clear button remains visible and active.
- What happens if the user types very quickly in the name search? → The table should still reflect the latest input without lag or visual glitching (debounce or synchronous state update as appropriate).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The gallery table MUST include a text search input that filters rows by sketch name in real time as the user types, with no submit action required.
- **FR-002**: Name search MUST be case-insensitive and match any substring of the sketch name.
- **FR-003**: The gallery table MUST include a type multi-select dropdown (checkbox list) populated exclusively with types that appear on at least one sketch in the gallery.
- **FR-004**: When one or more types are selected in the type filter, the table MUST show only sketches whose type matches one of the selected types (OR logic across types).
- **FR-005**: The gallery table MUST include a tag filter input with autocomplete that suggests only tags present on at least one sketch; the user MUST NOT be able to add tags that do not exist on any sketch.
- **FR-006**: When one or more tags are selected in the tag filter, the table MUST show only sketches that have ALL of the selected tags (AND logic across tags).
- **FR-007**: The gallery table MUST include an author multi-select dropdown (checkbox list) populated exclusively with author values that appear on at least one sketch in the gallery.
- **FR-008**: When one or more authors are selected in the author filter, the table MUST show only sketches whose author matches one of the selected authors (OR logic across authors).
- **FR-009**: All active filters (name search, type, tags, author) MUST combine using AND logic — a sketch must satisfy every active constraint to appear in the table.
- **FR-010**: The filter bar MUST include a clearly labelled "Clear" control that resets all filters and the search box to their default (empty/unselected) state in a single action.
- **FR-011**: The "Clear" control MUST be visually prominent when any filter is active and hidden or disabled when no filters are active.
- **FR-012**: All filter updates MUST be reflected in the table immediately (no manual trigger required); the experience must feel instantaneous.
- **FR-013**: The type and author dropdowns MUST only display values derived from the current live sketch data (not hardcoded lists).

### Key Entities

- **Filter State**: The collective set of currently active constraints — name search string, selected types (array), selected tags (array), selected authors (array).
- **Sketch Row**: A single entry in the gallery table, with attributes: name, type, tags (array), author.
- **Available Options**: The derived sets of valid types, tags, and authors computed from the live sketch data, used to populate filter controls.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The table visually updates to reflect a changed filter within 100 ms of the user's last input across all filter types, ensuring a real-time feel.
- **SC-002**: All four filter controls (name, type, tags, author) function correctly in isolation — each independently reduces the table to the correct subset.
- **SC-003**: All four filter controls function correctly in combination — the intersection logic returns only sketches matching every active constraint.
- **SC-004**: The "Clear" action resets all filters and restores the full sketch list in a single interaction.
- **SC-005**: Filter option lists (type, tags, author) contain only values that genuinely exist in the current sketch data — no phantom or stale options appear.
- **SC-006**: The tag filter autocomplete does not allow free-text entry of non-existent tags.
- **SC-007**: Users can identify and activate filtering controls without instruction — controls are self-evident from their labels and placement.

## Assumptions

- The gallery table already exists and displays all sketches; this feature adds filter controls to that existing page.
- Sketch data is loaded client-side (via existing `import.meta.glob` mechanism) so filtering is performed in-browser without additional network requests.
- Tag filtering uses AND logic (sketches must have all selected tags) because this gives the most precise results; users can always remove tags to broaden the result.
- Type and author filtering use OR logic (show sketches matching any selected value) because selecting multiple types/authors is naturally an "any of these" intent.
- The existing `sketches/tags.json` registry provides the canonical list of all known tags for the autocomplete.
- Sketch type values come from the existing `type` field in each sketch's `meta.json`; the set of valid types is derived at runtime from loaded data, not hardcoded.
- Author values come from the existing `createdBy` (or equivalent) field in each sketch's `meta.json`.
- No server-side filtering endpoint is needed; all filtering is client-side.
- Mobile responsiveness of the filter bar is desirable but not a hard requirement for this feature version.
