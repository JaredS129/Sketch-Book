import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NativeCodePanel } from "../../src/components/NativeCodePanel";

const VALID_SOURCE = `import type p5 from "p5";
export default function sketch(p: p5): void {
  let cols: number;
  p.setup = () => {
    // keep me
    p.createCanvas(p.windowWidth, p.windowHeight);
  };
  p.draw = () => {};
}
`;

// Has no default-export factory → convertToNative returns { ok: false }.
const INVALID_SOURCE = `function setup() {}\n`;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("NativeCodePanel — US1: see the native version", () => {
  it("renders the ready state with highlighted, non-editable native code", async () => {
    render(<NativeCodePanel sketchId="x" loadSource={() => Promise.resolve(VALID_SOURCE)} />);

    // Button appears only in the ready state.
    const copy = await screen.findByRole("button", { name: /copy native p5\.js code/i });
    expect(copy).toBeInTheDocument();

    const codeEl = document.querySelector("code.language-javascript");
    expect(codeEl).not.toBeNull();
    // Faithful conversion: global functions, no `p.`, comment preserved.
    expect(codeEl?.textContent).toContain("function setup()");
    expect(codeEl?.textContent).toContain("createCanvas(windowWidth, windowHeight)");
    expect(codeEl?.textContent).toContain("// keep me");
    expect(codeEl?.textContent).not.toContain("p.");

    // Read-only: no editable inputs / contenteditable.
    expect(document.querySelector("textarea")).toBeNull();
    expect(document.querySelector("input")).toBeNull();
    expect(document.querySelector("[contenteditable]")).toBeNull();

    // Highlighted: Prism token spans were produced.
    expect(document.querySelector("code.language-javascript .token")).not.toBeNull();
  });

  it("renders a clear error state (no crash) when the source cannot be converted", async () => {
    render(<NativeCodePanel sketchId="x" loadSource={() => Promise.resolve(INVALID_SOURCE)} />);

    expect(await screen.findByText(/could not be converted/i)).toBeInTheDocument();
    // No copy button and no code in the error state.
    expect(screen.queryByRole("button", { name: /copy/i })).toBeNull();
    expect(document.querySelector("code.language-javascript")).toBeNull();
  });

  it("renders a clear error state when the source fails to load", async () => {
    render(<NativeCodePanel sketchId="x" loadSource={() => Promise.reject(new Error("boom"))} />);
    expect(await screen.findByText(/could not load the sketch source/i)).toBeInTheDocument();
  });
});

describe("NativeCodePanel — US2: one-click copy", () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it("copies the exact raw native string (no markup) and shows confirmation", async () => {
    render(<NativeCodePanel sketchId="x" loadSource={() => Promise.resolve(VALID_SOURCE)} />);
    const copy = await screen.findByRole("button", { name: /copy native p5\.js code/i });

    fireEvent.click(copy);

    const writeText = navigator.clipboard.writeText as ReturnType<typeof vi.fn>;
    expect(writeText).toHaveBeenCalledTimes(1);
    const copied = writeText.mock.calls[0]?.[0] as string;
    // Plain text, exactly the converted code — no HTML/markup, no `p.` prefix.
    expect(copied).toContain("function setup()");
    expect(copied).not.toContain("<span");
    expect(copied).not.toContain("p.");

    expect(await screen.findByText(/copied/i)).toBeInTheDocument();
  });

  it("shows a failed state when the clipboard rejects", async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    render(<NativeCodePanel sketchId="x" loadSource={() => Promise.resolve(VALID_SOURCE)} />);
    const copy = await screen.findByRole("button", { name: /copy native p5\.js code/i });

    fireEvent.click(copy);
    expect(await screen.findByText(/copy failed/i)).toBeInTheDocument();
  });
});

describe("NativeCodePanel — US3: scoped select-all", () => {
  it("scopes CTRL + A to the panel's code and prevents the page-wide default", async () => {
    render(<NativeCodePanel sketchId="x" loadSource={() => Promise.resolve(VALID_SOURCE)} />);
    await screen.findByRole("button", { name: /copy native p5\.js code/i });

    const selectAllChildren = vi.fn();
    vi.spyOn(window, "getSelection").mockReturnValue({
      selectAllChildren,
    } as unknown as Selection);

    const container = document.querySelector('[tabindex="0"]') as HTMLElement;
    expect(container).not.toBeNull();

    const prevented = !fireEvent.keyDown(container, { key: "a", ctrlKey: true });
    expect(prevented).toBe(true); // e.preventDefault() was called
    expect(selectAllChildren).toHaveBeenCalledTimes(1);
    const target = selectAllChildren.mock.calls[0]?.[0] as Element;
    expect(target.classList.contains("language-javascript")).toBe(true);
  });

  it("ignores plain 'a' (no modifier) — does not hijack typing", async () => {
    render(<NativeCodePanel sketchId="x" loadSource={() => Promise.resolve(VALID_SOURCE)} />);
    await screen.findByRole("button", { name: /copy native p5\.js code/i });

    const selectAllChildren = vi.fn();
    vi.spyOn(window, "getSelection").mockReturnValue({
      selectAllChildren,
    } as unknown as Selection);

    const container = document.querySelector('[tabindex="0"]') as HTMLElement;
    fireEvent.keyDown(container, { key: "a" });
    expect(selectAllChildren).not.toHaveBeenCalled();
  });
});
