# Quickstart: Validating Sketch Management UI

## Prerequisites

- Node.js 22+ and npm installed
- Local git user configured (`git config user.name` returns a name)
- Dev server running: `npm run dev`
- App accessible at `http://localhost:5173` (default Vite port)

---

## Scenario 1: Create a sketch

1. Open `http://localhost:5173`
2. Click **New Sketch** (top-right of gallery header)
3. In the form: enter name `Test Sketch`, confirm slug auto-fills as `test-sketch`, select type `p5`
4. Click **Create**
5. **Expected**: dialog closes, gallery reloads (≤ 3 s), row for "Test Sketch" appears

**API validation** (optional — verify directly):
```bash
curl -s -X POST http://localhost:5173/api/sketches \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Sketch","id":"test-sketch","type":"p5"}' | jq .
# → { "ok": true }
```

**Filesystem check**:
```bash
ls sketches/test-sketch/
# → meta.json  sketch.ts
cat sketches/test-sketch/meta.json
# → id, name, type, dateCreated, createdBy present
```

---

## Scenario 2: Duplicate a sketch

1. In the gallery, find the row for "Test Sketch"
2. Click the **duplicate icon** in the Actions column
3. In the form: name pre-fills as `Test Sketch - Copy`, slug as `test-sketch-copy`; edit name to `Test Sketch V2`, confirm slug updates to `test-sketch-v2`
4. Click **Duplicate**
5. **Expected**: gallery reloads, new row "Test Sketch V2" appears with same type as source

**API validation**:
```bash
curl -s -X POST http://localhost:5173/api/sketches/test-sketch/duplicate \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Sketch V2","id":"test-sketch-v2"}' | jq .
# → { "ok": true }
```

---

## Scenario 3: Edit a sketch (gallery — name + slug + type)

1. In the gallery, click the **edit icon** for "Test Sketch V2"
2. Change the name to `Test Sketch V2 Renamed`, confirm slug updates to `test-sketch-v2-renamed`, change type to `q5`
3. Click **Save**
4. **Expected**: gallery reloads, row reflects new name, slug, and type

**API validation**:
```bash
curl -s -X PATCH http://localhost:5173/api/sketches/test-sketch-v2 \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Sketch V2 Renamed","newId":"test-sketch-v2-renamed","type":"q5"}' | jq .
# → { "ok": true }
ls sketches/
# → test-sketch-v2-renamed/ exists; test-sketch-v2/ does NOT exist
```

---

## Scenario 4: Edit from the sketch page (name + type only)

1. Navigate to `http://localhost:5173/sketch/test-sketch`
2. Click the **Edit** button (top of sketch page)
3. **Expected**: form opens with name and type fields — NO slug/id field visible
4. Change name to `Test Sketch Renamed`, click **Save**
5. **Expected**: page title updates to "Test Sketch Renamed" after reload

---

## Scenario 5: Delete a sketch (gallery)

1. In the gallery, click the **delete icon** for "Test Sketch Renamed"
2. **Expected**: confirmation dialog shows the sketch name
3. Click **Delete** to confirm
4. **Expected**: gallery reloads, row for "Test Sketch Renamed" is gone

**Filesystem check**:
```bash
ls sketches/test-sketch 2>&1
# → No such file or directory
```

---

## Scenario 6: Delete from the sketch page

1. Navigate to `http://localhost:5173/sketch/test-sketch-v2-renamed`
2. Click **Delete** (on sketch page)
3. Confirm in the dialog
4. **Expected**: navigated to `/`, sketch no longer in gallery

---

## Scenario 7: Validation — slug conflict

1. Open the Create form, enter name `Test Sketch` (which would produce slug `test-sketch`, but that folder was deleted above — use any name matching an existing sketch)
2. If re-using existing slug: the slug field should highlight with an error message and the Create button should be disabled
3. **Expected**: no sketch is created; error message is visible in the form

---

## Scenario 8: Production build guard

```bash
npm run build && npm run preview
# Open http://localhost:4173
```

- **Expected**: No "New Sketch" button appears, OR clicking it shows an error — mutations are not available in the static build.

---

## Reference

- API contract: [`contracts/sketch-management-api.md`](contracts/sketch-management-api.md)
- Data model: [`data-model.md`](data-model.md)
- Spec: [`spec.md`](spec.md)
