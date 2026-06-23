<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/004-sketch-tags/plan.md`

Active feature: **Sketch Tags** (`004-sketch-tags`)
Adds a `tags` field (array of lowercase single-word strings) to `SketchMeta`. Gallery gains a
Tags column with ellipsis truncation and hover tooltip. Sketch page metadata panel shows tags.
All forms (create/duplicate/edit) include a `TagInput` chip-and-autocomplete component backed
by a `GET /api/tags` endpoint and a centralised `sketches/tags.json` registry updated on every
save. New `scripts/lib/tags.ts` handles registry read/write/merge. New `@radix-ui/react-popover`
powers the autocomplete dropdown. Tags stored lowercase; registry is append-only.
See plan.md, data-model.md, contracts/sketch-tags-api.md.

Previous feature: **Sketch Management UI** (`003-sketch-management-ui`)
Adds in-browser create, duplicate, edit, and delete for sketches via four Vite dev-server
middleware endpoints (`src/plugins/sketch-api.ts`, `apply: 'serve'`). Gallery gains an
Actions column (duplicate/edit/delete icon buttons) and a New Sketch button; sketch page
gains Edit + Delete buttons. A shared `SketchFormDialog` (Radix Dialog) handles all forms;
slug auto-derives from name until user edits it. A new `scripts/lib/edit-sketch-op.ts`
module + `scripts/edit-sketch.ts` CLI support folder-rename (slug change). Gallery refresh
via Vite HMR — no explicit reload call. `update-sketch-meta` CI fields untouched.
See plan.md, data-model.md, contracts/sketch-management-api.md.

Foundation feature: **p5.js Sketch Gallery & Local Dev Server** (`001-p5js-sketch-gallery`)
Stack: Vite 6 + React 19 + TypeScript, React Router 7, Tailwind v4 (dark-by-default) +
Radix primitives, p5 (instance mode), TanStack Table, zod. CLI tooling via `tsx`.
Data: per-sketch `sketches/<id>/meta.json` (no database), auto-discovered with
`import.meta.glob`. See plan.md, data-model.md, and contracts/.
<!-- SPECKIT END -->
