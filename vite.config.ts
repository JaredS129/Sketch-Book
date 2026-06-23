import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { sketchApi } from "./src/plugins/sketch-api";

// q5play lazily initialises box2dPromise inside q5playPreSetup on the first
// Q5 instance creation. On first page load this creates a race window:
// Box2D WASM hasn't been fetched yet when the first Q5 instance is created,
// so React StrictMode's simulated unmount can tear down that instance while
// Box2D is still loading. The second instance (the real one) inherits the
// in-flight promise, but the first instance's presetup continuation runs
// after Box2D loads and may leave behind leaked global listeners.
//
// Fix: hoist box2dPromise initialisation to module-eval time. When sketch.ts
// does `import "q5play"`, Box2D starts loading immediately — before any Q5
// instance is even constructed. By the time q5playPreSetup runs, box2dPromise
// is already a non-null pending (or resolved) Promise, so the guard
// `if (!box2dPromise)` is always false and the race window disappears.
//
// We also replace import(variable) with a static string literal so Vite can
// rewrite the bare specifier correctly (import(box2d3) is opaque to Vite).
function q5playLocalBox2d(): Plugin {
  // Original lazy declaration — replaced with module-level eager init.
  const LAZY_DECL = "let box2dPromise,\n\tusing_p5 = false;";
  const EAGER_DECL =
    "let using_p5 = false;\n" +
    "let box2dPromise = (async () => {\n" +
    "\tlet Box2DFactory = await import('box2d3-wasm');\n" +
    "\treturn await Box2DFactory.default({ pthreadCount: 0 });\n" +
    "})();";

  // CDN fallback block inside the (now-unreachable) if-guard — replace the
  // variable-based import with a literal so Vite's module rewriter is happy.
  const CDN_BLOCK =
    "let box2d3 = 'https://q5play.org/Box2D.deluxe.mjs';\n\n\t\t\ttry {\n\t\t\t\tbox2d3 = import.meta.resolve('box2d3-wasm');\n\t\t\t} catch (e) {}\n\n\t\t\tlet Box2DFactory = await import(box2d3);";
  const LOCAL_ONLY = "let Box2DFactory = await import('box2d3-wasm');";

  return {
    name: "q5play-local-box2d",
    enforce: "pre",
    transform(code, id) {
      if (!id.includes("q5play")) return;
      if (!code.includes(LAZY_DECL)) return;
      return {
        code: code.replace(LAZY_DECL, EAGER_DECL).replace(CDN_BLOCK, LOCAL_ONLY),
        map: null,
      };
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), q5playLocalBox2d(), sketchApi()],
  optimizeDeps: {
    // q5play: excluded so the transform plugin above runs before the browser sees it.
    // box2d3-wasm: excluded so its new URL("Box2D.compat.wasm", import.meta.url)
    // WASM loading resolves correctly at runtime (esbuild can't handle that pattern).
    exclude: ["q5play", "box2d3-wasm"],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
  },
});
