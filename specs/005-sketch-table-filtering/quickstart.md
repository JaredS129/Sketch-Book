# Quickstart: Sketch Table Filtering & Search

Validation guide to confirm the feature works end-to-end in the running app.

## Prerequisites

- At least 3 sketches exist with varied types, tags, and authors.
- The dev server is running (`npm run dev`).
- Browser is open at `http://localhost:5173` (or the Vite port shown in the terminal).

## Setup: Seed Diverse Sketch Data

If your gallery is sparse, create or edit sketches via the UI to ensure:
- At least 2 distinct types (e.g., two `p5` and one `q5`)
- At least 2 sketches with at least one tag, and one sketch with no tags
- At least 2 different `createdBy` values (author field)

---

## Scenario 1: Name Search

1. Open the gallery home page.
2. In the **search box** (labelled "Search by name…" or similar), type part of a sketch name.
3. **Expected**: The table updates immediately (no button press) to show only sketches whose names contain the typed text (case-insensitive).
4. Clear the search box.
5. **Expected**: All sketches reappear.
6. Type a string that matches nothing.
7. **Expected**: Table shows zero rows with an empty-state message.

---

## Scenario 2: Type Filter

1. Click the **Type** dropdown trigger.
2. Check one type (e.g., "p5").
3. **Expected**: Popover stays open; table behind updates immediately to show only `p5` sketches.
4. Also check "q5".
5. **Expected**: Table now shows `p5` OR `q5` sketches.
6. Uncheck all types.
7. **Expected**: All sketches reappear; dropdown trigger shows no badge/count.
8. **Expected**: The dropdown only lists types that exist on at least one sketch.

---

## Scenario 3: Tag Filter

1. Click the **Tags** filter input.
2. **Expected**: Popover opens showing all available tags (tags that exist on at least one sketch).
3. Select a tag.
4. **Expected**: Table shows only sketches tagged with that tag; tag chip appears in the filter input.
5. Select a second tag.
6. **Expected**: Table shows only sketches that have BOTH tags (AND logic — fewer or equal results than step 4).
7. Remove the first tag chip (click the × on the chip).
8. **Expected**: Table now shows sketches with only the second tag.
9. Try typing a tag name that doesn't exist.
10. **Expected**: Autocomplete does not suggest it; pressing Enter/Tab/comma does nothing.

---

## Scenario 4: Author Filter

1. Click the **Author** dropdown trigger.
2. **Expected**: List shows only authors present in the gallery.
3. Select one author.
4. **Expected**: Table shows only that author's sketches.
5. Select a second author.
6. **Expected**: Table shows sketches from either author (OR logic).

---

## Scenario 5: Combined Filters

1. Type a partial name in the search box.
2. Select one type in the Type dropdown.
3. Select one tag.
4. Select one author.
5. **Expected**: Table shows only sketches that satisfy all four constraints simultaneously (AND across filter types).
6. Note the count in the page header (e.g., "3 of 12 sketches").
7. Click **Clear**.
8. **Expected**: All filters reset, all 12 sketches reappear, count returns to "12 sketches".

---

## Scenario 6: Clear Button State

1. With no filters active, observe the **Clear** button.
2. **Expected**: Button is disabled or visually muted (not interactive).
3. Activate any filter.
4. **Expected**: Clear button becomes active/prominent.
5. Click it.
6. **Expected**: All filters reset in a single action.

---

## Scenario 7: Performance Check

1. With many sketches loaded, type quickly in the name search box (several characters per second).
2. **Expected**: Table updates feel instantaneous with each keystroke — no noticeable lag or flicker.

---

## Verification Checklist

- [ ] Name search filters in real time, case-insensitive
- [ ] Type dropdown shows only real types, supports multi-select (OR)
- [ ] Tag filter autocomplete shows only existing tags, supports multi-select (AND)
- [ ] Tag filter rejects free-form tags that don't exist
- [ ] Author dropdown shows only real authors, supports multi-select (OR)
- [ ] All four filters combine correctly (AND across filter types)
- [ ] Clear resets everything in one click
- [ ] Clear button is disabled when no filters are active
- [ ] Count in page header reflects filtered result count
- [ ] Empty state message appears when filter produces zero results
