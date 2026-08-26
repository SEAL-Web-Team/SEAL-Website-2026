import { describe, expect, it } from "vitest";
import { dragDepth, firstImageFrom, selectKeyAction } from "./editor-helpers";

const state = (over: Partial<{ open: boolean; activeIndex: number; length: number }> = {}) => ({
  open: true,
  activeIndex: 0,
  length: 5,
  ...over,
});

describe("selectKeyAction — closed", () => {
  it.each(["ArrowDown", "ArrowUp", "Enter", " "])("opens on %s", (key) => {
    expect(selectKeyAction(key, state({ open: false }))).toEqual({ type: "open" });
  });

  it.each(["Escape", "Tab", "a", "Shift"])("ignores %s", (key) => {
    expect(selectKeyAction(key, state({ open: false })).type).toBe("none");
  });
});

describe("selectKeyAction — open", () => {
  it("moves down and up", () => {
    expect(selectKeyAction("ArrowDown", state({ activeIndex: 1 }))).toEqual({ type: "move", index: 2 });
    expect(selectKeyAction("ArrowUp", state({ activeIndex: 1 }))).toEqual({ type: "move", index: 0 });
  });

  it("clamps rather than wrapping at both ends", () => {
    // A native select doesn't wrap; wrapping here would surprise people
    // arrow-keying to the end of the list.
    expect(selectKeyAction("ArrowUp", state({ activeIndex: 0 }))).toEqual({ type: "move", index: 0 });
    expect(selectKeyAction("ArrowDown", state({ activeIndex: 4 }))).toEqual({ type: "move", index: 4 });
  });

  it("jumps with Home and End", () => {
    expect(selectKeyAction("Home", state({ activeIndex: 3 }))).toEqual({ type: "move", index: 0 });
    expect(selectKeyAction("End", state({ activeIndex: 0 }))).toEqual({ type: "move", index: 4 });
  });

  it.each(["Enter", " "])("commits on %s", (key) => {
    expect(selectKeyAction(key, state({ activeIndex: 2 }))).toEqual({ type: "commit", index: 2 });
  });

  it.each(["Escape", "Tab"])("closes on %s", (key) => {
    expect(selectKeyAction(key, state())).toEqual({ type: "close" });
  });

  it("ignores unrelated keys", () => {
    expect(selectKeyAction("x", state()).type).toBe("none");
  });

  it("commits a clamped index if activeIndex somehow drifted out of range", () => {
    expect(selectKeyAction("Enter", state({ activeIndex: 99 }))).toEqual({ type: "commit", index: 4 });
  });

  it("does nothing at all for an empty option list", () => {
    for (const key of ["ArrowDown", "Enter", "Home", "Escape"]) {
      expect(selectKeyAction(key, state({ length: 0 })).type).toBe("none");
    }
  });
});

describe("firstImageFrom", () => {
  const file = (type: string, name = "f") => new File([new Uint8Array([1])], name, { type });

  it("returns the first image in a FileList-like array", () => {
    const png = file("image/png", "a.png");
    expect(firstImageFrom([png])).toBe(png);
  });

  it("skips non-images and returns the first image found", () => {
    const png = file("image/png", "photo.png");
    expect(firstImageFrom([file("application/zip"), file("text/plain"), png])).toBe(png);
  });

  it("returns null when nothing is an image", () => {
    expect(firstImageFrom([file("application/pdf"), file("text/csv")])).toBeNull();
  });

  it.each([null, undefined, []])("returns null for %p", (input) => {
    expect(firstImageFrom(input as never)).toBeNull();
  });

  it("unwraps clipboard entries via getAsFile()", () => {
    const png = file("image/png");
    const items = [
      { type: "text/plain", getAsFile: () => null },
      { type: "image/png", getAsFile: () => png },
    ];
    expect(firstImageFrom(items)).toBe(png);
  });

  it("tolerates a clipboard entry whose getAsFile returns null", () => {
    expect(firstImageFrom([{ type: "image/png", getAsFile: () => null }])).toBeNull();
  });

  it("ignores entries with no type", () => {
    expect(firstImageFrom([{} as never])).toBeNull();
  });

  it("accepts every image type the upload route allows", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"]) {
      expect(firstImageFrom([file(type)]), type).not.toBeNull();
    }
  });
});

describe("dragDepth", () => {
  it("counts nested enters and leaves", () => {
    // Entering a child fires enter again; leaving it must not clear the
    // highlight while the pointer is still inside the parent.
    let d = 0;
    d = dragDepth(d, "enter"); // into the zone
    d = dragDepth(d, "enter"); // into a child
    expect(d).toBe(2);
    d = dragDepth(d, "leave"); // out of the child, still inside
    expect(d).toBe(1);
    d = dragDepth(d, "leave"); // out of the zone
    expect(d).toBe(0);
  });

  it("never goes negative on a stray leave", () => {
    expect(dragDepth(0, "leave")).toBe(0);
  });

  it("resets to zero on drop", () => {
    expect(dragDepth(5, "drop")).toBe(0);
  });
});
