<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/002-native-p5js-output/plan.md`

Active feature: **Native p5.js Output** (`002-native-p5js-output`)
Adds a read-only panel on the sketch page showing the native global-mode JS equivalent of a
sketch's instance-mode `sketch.ts`, with a copy button, scoped `CTRL + A` selection, and
syntax highlighting. Native code is **derived on the fly** (no new files) by a pure converter
(`src/lib/native-p5.ts`) using the TypeScript compiler API for **faithful 1:1** text-splice
conversion; rendered by `src/components/NativeCodePanel.tsx` with Prism highlighting. Raw
source is loaded via a Vite `?raw` glob in `src/sketches.ts`.

Foundation feature: **p5.js Sketch Gallery & Local Dev Server** (`001-p5js-sketch-gallery`)
Stack: Vite 6 + React 19 + TypeScript, React Router 7, Tailwind v4 (dark-by-default) +
Radix primitives, p5 (instance mode), TanStack Table, zod. CLI tooling via `tsx`.
Data: per-sketch `sketches/<id>/meta.json` (no database), auto-discovered with
`import.meta.glob`. UI is view-only; mutations only via `create-sketch` / `delete-sketch`
/ `update-sketch-meta` npm scripts. See plan.md, data-model.md, and contracts/.
<!-- SPECKIT END -->
