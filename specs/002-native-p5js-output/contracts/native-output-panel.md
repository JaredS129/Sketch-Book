# Contract: Native Output Panel (UI behavior)

**Date**: 2026-06-18 | **Feature**: 002-native-p5js-output

Defines the behavior contract for `NativeCodePanel.tsx` and how it mounts on the sketch
page. This is the authoritative reference for the panel's component smoke tests.

---

## Placement & props

Mounted on `src/pages/SketchPage.tsx`, on the per-sketch page (`/sketch/:id`), alongside the
rendered canvas and metadata. (spec Assumptions)

```ts
interface NativeCodePanelProps {
  /** Lazy loader for the sketch's raw source (from SketchEntry.loadSource). */
  loadSource: () => Promise<string>;
  /** Sketch id — used as a remount/refresh key. */
  sketchId: string;
}
```

The panel loads the source, runs `convertToNative`, and renders one of the states below.

---

## States

| State | Trigger | UI |
|-------|---------|----|
| `loading` | source not yet loaded | unobtrusive loading affordance |
| `ready` | conversion `ok: true` | header + copy button + highlighted read-only code |
| `error` | source load fails **or** conversion `ok: false` | clear message (incl. `reason`); no code, no crash (FR-015) |

---

## Behavior requirements

| ID | Behavior | Req |
|----|----------|-----|
| B1 | Code area is **read-only** — not editable, not a focusable text input that accepts edits | FR-009 |
| B2 | Code is rendered with **JavaScript syntax highlighting** (Prism) | FR-013 |
| B3 | A **copy icon button** copies the entire native code in one click | FR-010 |
| B4 | The copied text is the **raw converted string** (plain text, no highlight markup, no extra/trailing artifacts) | FR-016 |
| B5 | On copy success, the button shows **visible confirmation** (icon → check + label), auto-reverting after ~1.5s | FR-011, SC-005 |
| B6 | On copy failure (clipboard unavailable/denied), the button shows a **clear failed state**; manual select-all (B7) remains available | spec Edge Cases |
| B7 | When focus is within the panel, **`CTRL + A` / `CMD + A`** selects only the panel's code contents and prevents the page-wide default | FR-012, SC-004 |
| B8 | The panel **re-derives** its output when the sketch source changes (Vite HMR), without a page reload or route change | FR-014, SC-006 |
| B9 | Long code **scrolls within** the panel; scoped selection (B7) still applies only to panel content | spec Edge Cases |

---

## Interaction details

- **Copy** (B3–B6): `navigator.clipboard.writeText(code)`; promise resolves → `copied`
  state for ~1.5s → `idle`; rejects/throws → `failed` state. Icons are inline SVG
  (copy / check). (research D5)
- **Scoped select-all** (B7): container has `tabIndex={0}`; `keydown` handler checks
  `(e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a"` with the active
  selection/focus inside the container, then `e.preventDefault()` and selects the code
  element's contents via the Selection API (`selectAllChildren`). (research D4)
- **Read-only display** (B1–B2): highlighted tokens render in a `<pre><code>`; copy/select
  read from the separately held raw string, decoupling display markup from copied text
  (B4). (research D3)

---

## Accessibility & theming

- Copy button has an accessible label (e.g. `aria-label="Copy native p5.js code"`) and its
  confirmation is perceivable (label text change, not color alone).
- Panel uses the app's existing Tailwind v4 dark tokens; the Prism theme maps to those
  tokens for visual consistency with the rest of the UI.

---

## Out of scope (this contract)

- Editing, saving, or downloading the native code (UI remains view-only).
- Converting to formats other than the online p5.js editor's global mode.
- Any change to sketch discovery, routing, or `meta.json`.
