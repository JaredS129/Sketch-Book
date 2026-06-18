# Feature Specification: Native p5.js Output

**Feature Branch**: `002-native-p5js-output`

**Created**: 2026-06-18

**Status**: Draft

**Input**: User description: "native p5js output. This app supports creating sketches with typescript and importing the p5js library as it's a node.js base project. However when people create sketches in the native p5js editor online it's a raw javascript format that has p5js functions and methods etc accessible globally. I want to add a read-only copy and pasteable output to the UI that shows the native p5js version of the code compatible with the online editor. The output should have a 'copy' icon button, it should allow 'CTRL + A' text selection that is limited to the bounds of the output, and should have syntax highlighting."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the native p5.js version of a sketch (Priority: P1)

A person viewing a sketch in the gallery wants to see what that sketch looks like as
"native" p5.js code — the raw, global-mode JavaScript form used by the official online
p5.js editor — without having to mentally translate the project's TypeScript/instance-mode
source. On the sketch's page, a read-only output panel shows that native version with
syntax highlighting.

**Why this priority**: This is the core of the feature. Without a faithful native version
visible on the page, nothing else (copy, scoped selection) has anything to operate on. It
alone delivers value: a person can read the native form and hand-type or reference it.

**Independent Test**: Open the sketch page for the example `vector-field` sketch and
confirm the panel shows global-mode JavaScript (`function setup()` / `function draw()`,
no `p.` prefixes, no imports, no TypeScript types) that matches the verified native example.

**Acceptance Scenarios**:

1. **Given** a sketch authored in TypeScript instance mode, **When** the user opens that
   sketch's page, **Then** a read-only output panel displays the equivalent native
   global-mode JavaScript.
2. **Given** the native output panel is shown, **When** the user reads it, **Then** the
   code is syntax-highlighted and the panel content cannot be edited.
3. **Given** the source uses lifecycle hooks (`p.setup`, `p.draw`, `p.windowResized`),
   **When** the native version is produced, **Then** each appears as a top-level global
   function (`function setup()`, `function draw()`, `function windowResized()`).
4. **Given** the source contains literal values and in-body comments, **When** the native
   version is produced, **Then** those values and comments are preserved unchanged.

---

### User Story 2 - Copy the native code with one click (Priority: P2)

The person wants to take the native version and paste it straight into the online p5.js
editor. A copy icon button on the panel puts the exact native code onto the clipboard in
one action, with visible confirmation.

**Why this priority**: Copy is the primary way the output gets used (paste into the online
editor). It depends on US1 existing but is the highest-value interaction on top of it.

**Independent Test**: Click the copy button, then paste into a plain text field and the
online p5.js editor; the pasted text matches the panel exactly and runs without edits.

**Acceptance Scenarios**:

1. **Given** the native output panel, **When** the user clicks the copy button, **Then**
   the full native code is placed on the clipboard as plain text.
2. **Given** the user clicked copy, **When** the action succeeds, **Then** the button shows
   visible confirmation feedback.
3. **Given** copied text, **When** it is pasted into the online p5.js editor, **Then** it
   matches the displayed code exactly (no highlighting markup, no extra/trailing artifacts).

---

### User Story 3 - Select all within the panel only (Priority: P3)

The person prefers manual selection. Pressing `CTRL + A` while focused in the output
selects only the panel's contents, not the rest of the page, so they can copy without
grabbing surrounding UI.

**Why this priority**: A convenience/robustness path that complements the copy button. It
improves the experience but is not required for the core copy flow to work.

**Independent Test**: Focus the output panel, press `CTRL + A`, and confirm only the panel
text is selected while no other page content is highlighted.

**Acceptance Scenarios**:

1. **Given** focus is inside the output panel, **When** the user presses `CTRL + A`,
   **Then** the selection covers exactly the panel's contents and nothing outside it.
2. **Given** the panel contents are selected via `CTRL + A`, **When** the user copies the
   selection, **Then** the copied text matches the full native code.

---

### Edge Cases

- **Multiple / additional lifecycle hooks** (e.g. `preload`, `mousePressed`, `keyPressed`):
  each hook attached to the instance is converted to its global-mode function form.
- **Local helper functions and variables** defined inside the sketch (not p5 lifecycle
  hooks): preserved as-is in the native output.
- **Source that cannot be faithfully converted** (unsupported or unparseable structure,
  e.g. the instance is aliased/destructured in ways the conversion does not recognize):
  the panel shows a clear message instead of crashing or showing partial/incorrect code.
- **Empty or missing sketch source**: the panel surfaces a clear, non-crashing state.
- **Very long code / long lines**: the panel remains readable (scrolls as needed) and
  scoped selection still applies only to the panel.
- **Clipboard unavailable or permission denied**: the copy button reports failure clearly;
  the user can still select-all (US3) and copy manually.
- **Source edited while the page is open**: the native output updates to reflect the
  current source, consistent with the app's existing hot-reload behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The sketch page MUST display a read-only output panel showing the native
  global-mode JavaScript equivalent of that sketch's TypeScript instance-mode source.
- **FR-002**: The native conversion MUST remove import statements (e.g.
  `import type p5 from "p5"`).
- **FR-003**: The native conversion MUST remove the instance-mode wrapper (the
  `export default function sketch(p: p5)` enclosure) and present the body at top level.
- **FR-004**: The native conversion MUST convert each p5 lifecycle hook assigned to the
  instance (e.g. `p.setup = () => {…}`, `p.draw`, `p.windowResized`, `p.preload`) into a
  top-level global function declaration (e.g. `function setup() {…}`).
- **FR-005**: The native conversion MUST remove the `p.` instance prefix from all p5 API
  calls, properties, and constants (e.g. `p.createCanvas` → `createCanvas`, `p.ROUND` →
  `ROUND`).
- **FR-006**: The native conversion MUST strip TypeScript-only syntax (type annotations on
  variables/parameters/returns, `import type`, and similar) while leaving runtime logic
  unchanged.
- **FR-007**: The native conversion MUST be faithful 1:1 — preserving the sketch's logic,
  literal values, identifiers, and in-body comments exactly, applying NO semantic
  adaptations (e.g. it MUST NOT rewrite canvas sizing or add handlers that the source
  did not contain).
- **FR-008**: Comments and code that belong to removed constructs (imports and the
  instance-mode wrapper) MAY be dropped with those constructs; comments inside lifecycle
  hooks and helper code MUST be preserved.
- **FR-009**: The output panel MUST be read-only (the displayed code cannot be edited).
- **FR-010**: The panel MUST provide a copy icon button that copies the entire native code
  to the clipboard in a single action.
- **FR-011**: A successful copy MUST give visible confirmation feedback on the button.
- **FR-012**: Pressing `CTRL + A` while focused within the output panel MUST select only
  the panel's contents and MUST NOT extend the selection to other page content.
- **FR-013**: The output MUST be displayed with JavaScript syntax highlighting.
- **FR-014**: The native output MUST reflect the current sketch source, updating when the
  source changes consistently with the app's hot-reload behavior.
- **FR-015**: If a sketch's source cannot be faithfully converted, the panel MUST surface a
  clear message rather than crash or display partial/incorrect code.
- **FR-016**: The copied/clipboard text MUST be plain text that exactly matches the
  displayed native code — no syntax-highlighting markup and no added or trailing
  artifacts — so it pastes cleanly into the online p5.js editor.
- **FR-017**: The native output and the copy action MUST be derived on the fly from the
  existing sketch source; the feature MUST NOT create new per-sketch files.

### Key Entities *(include if feature involves data)*

- **Native Conversion**: A read-only, derived view of an existing Sketch's source code,
  expressed as online-editor-compatible global-mode JavaScript. It is not stored; it is
  produced from the Sketch's TypeScript instance-mode source each time it is shown.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For a faithfully convertible sketch, a user can copy the native output and
  paste it into the online p5.js editor and run it successfully with zero manual edits.
- **SC-002**: For the reference `vector-field` sketch, the produced native code matches the
  verified native example character-for-character.
- **SC-003**: 100% of the characters shown in the panel match the characters placed on the
  clipboard (no markup, no missing or extra characters).
- **SC-004**: Pressing `CTRL + A` within the panel selects only panel content in 100% of
  cases and never highlights content outside the panel.
- **SC-005**: Copying takes a single click and shows confirmation within 1 second.
- **SC-006**: After a sketch source edit, the native output reflects the change within the
  same time budget as the sketch's hot-reload (within 3 seconds), without a full page
  reload.

## Assumptions

- Sketches follow the project's instance-mode contract: a single default export
  `(p: p5) => void` with p5 lifecycle hooks attached to the `p` instance. The conversion
  targets exactly this contract.
- The conversion is purely mechanical and faithful; no responsive-canvas or other
  opinionated adaptations are applied (values such as `createCanvas(...)` are preserved
  verbatim). This was confirmed with the requester.
- The native output is auto-derived from the existing `sketch.ts`; no new per-sketch files
  are created (confirmed with the requester).
- The output panel lives on the per-sketch page (the sketch detail view), alongside the
  rendered canvas and metadata.
- The intended paste destination is the official online p5.js editor, which uses global
  mode (p5 functions/constants available globally).
- Clipboard and scoped selection rely on standard capabilities of a modern evergreen
  browser, consistent with the rest of the project.
- The reference input/output example lives in the requester's note
  (`p5js server vs native.md`) and the `vector-field` sketch under `sketches/`.
