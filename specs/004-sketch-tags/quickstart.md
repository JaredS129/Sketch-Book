# Quickstart & Validation Guide: Sketch Tags

## Prerequisites

- `npm run dev` running (Vite dev server on `http://localhost:5173`)
- At least two existing sketches in `sketches/`
- A terminal for `curl` commands and file inspection

---

## Scenario 1: Tags column visible in gallery (US-1)

**Setup**: Add `"tags": ["animation", "demo"]` to any sketch's `meta.json`.

**Validate**:
1. Open `http://localhost:5173/` in the browser.
2. Confirm a **Tags** column is visible in the sketch table.
3. Confirm the sketch row shows "animation, demo" (or space-separated equivalent).
4. Add enough tags to a sketch so the text overflows the cell — confirm ellipsis truncation (no layout shift).
5. Hover over the truncated cell — confirm the full tag list is visible in a tooltip.

---

## Scenario 2: Tags displayed on sketch page (US-2)

**Setup**: Ensure the sketch from Scenario 1 has tags in its `meta.json`.

**Validate**:
1. Navigate to that sketch's page (`/sketch/<id>`).
2. Confirm a **Tags** entry appears in the metadata panel showing "animation, demo".
3. Navigate to a sketch with no `tags` field in its `meta.json`.
4. Confirm no broken layout or error — Tags entry is absent or empty.

---

## Scenario 3: Adding tags via New Sketch form (US-3)

**Validate**:
1. Click **New Sketch** in the gallery header.
2. Confirm a **Tags** input field is present in the form.
3. Type "animation" and press **Enter** — confirm it becomes a chip/pill.
4. Type "audio" and press **Space** — confirm it becomes a chip.
5. Click the × on the "audio" chip — confirm it is removed.
6. Type "anim" — confirm the autocomplete dropdown shows "animation" as a suggestion.
7. Click "animation" in the dropdown — confirm it is added as a chip (no duplicate created).
8. Fill in the name/slug fields and submit.
9. Confirm the new sketch row in the gallery shows tags "animation".
10. Check `sketches/<new-id>/meta.json` — confirm `"tags": ["animation"]` is present.

---

## Scenario 4: Autocomplete from registry (US-4)

**Validate**:
1. From Scenario 3, the tag "animation" is now in the registry.

   Verify via API:
   ```bash
   curl http://localhost:5173/api/tags
   # Expected: ["animation"]
   ```

2. Open the **New Sketch** form again.
3. Type "a" in the tags input — confirm the dropdown suggests "animation".
4. The search is case-insensitive: type "ANIM" — confirm "animation" still appears.

---

## Scenario 5: Edit form pre-populates tags (US-3, scenarios 5–6)

**Validate**:
1. Click the edit icon on a sketch that has tags.
2. Confirm the **Tags** field is pre-populated with the sketch's existing tags as chips.
3. Remove one tag, add a new tag, submit.
4. Confirm the sketch page and gallery reflect the updated tags.
5. Check the registry: `curl http://localhost:5173/api/tags` — confirm the newly added tag is present; the removed tag remains in the registry.

---

## Scenario 6: Duplicate form inherits tags (US-3, scenario 5)

**Validate**:
1. Click the duplicate icon on a sketch that has tags.
2. Confirm the **Tags** field is pre-populated with the source sketch's tags.
3. Submit without modifying tags.
4. Confirm the duplicated sketch has the same tags.

---

## Scenario 7: Registry accumulates across saves

**Validate**:
1. Create sketch A with tags `["generative"]`.
2. Create sketch B with tags `["physics"]`.
3. Run: `curl http://localhost:5173/api/tags`
   Expected: `["generative","physics"]` (alphabetically sorted).
4. Check `sketches/tags.json` on disk — confirm same content.

---

## Scenario 8: Existing sketches unaffected

**Validate**:
1. Identify a sketch whose `meta.json` has no `tags` key.
2. Open the gallery — confirm that sketch row renders without error (empty Tags cell).
3. Navigate to its sketch page — confirm no crash or broken layout.
4. Open its edit form — confirm the Tags input starts empty.

---

## API spot-checks

```bash
# Get full tag registry
curl http://localhost:5173/api/tags

# Create a sketch with tags
curl -X POST http://localhost:5173/api/sketches \
  -H "Content-Type: application/json" \
  -d '{"name":"Tag Test","id":"tag-test","type":"p5","tags":["demo","test"]}'

# Edit a sketch, replacing its tags
curl -X PATCH http://localhost:5173/api/sketches/tag-test \
  -H "Content-Type: application/json" \
  -d '{"name":"Tag Test","type":"p5","tags":["demo"]}'

# Verify registry updated (should contain both "demo" and "test" — registry is append-only)
curl http://localhost:5173/api/tags

# Tag with a space should fail
curl -X POST http://localhost:5173/api/sketches \
  -H "Content-Type: application/json" \
  -d '{"name":"Bad Tag","id":"bad-tag","type":"p5","tags":["two words"]}'
# Expected: {"ok":false,"error":"tag 'two words' must be a single word (no spaces)"}
```
