import { describe, expect, it } from "vitest";
import { excerpt, sanitizeBody } from "./sanitize";

describe("sanitizeBody — XSS defenses", () => {
  it.each([
    ["script tag", '<p>hi</p><script>alert(1)</script>'],
    ["iframe", '<iframe src="https://evil.com"></iframe>'],
    ["object", '<object data="x"></object>'],
    ["style tag", "<style>body{display:none}</style>"],
    ["form", '<form action="/x"><input name="a"></form>'],
  ])("strips a %s", (_label, html) => {
    const out = sanitizeBody(html);
    expect(out).not.toMatch(/<(script|iframe|object|style|form|input)/i);
  });

  it("strips inline event handlers", () => {
    const out = sanitizeBody('<p onclick="alert(1)" onerror="x()">text</p>');
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("onerror");
    expect(out).toContain("text");
  });

  it("strips javascript: hrefs", () => {
    const out = sanitizeBody('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toContain("javascript:");
  });

  it("strips data: image sources (scriptable SVG smuggling)", () => {
    const out = sanitizeBody(
      '<img src="data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+">',
    );
    expect(out).not.toContain("data:");
  });

  it("strips protocol-relative hrefs", () => {
    expect(sanitizeBody('<a href="//evil.com">x</a>')).not.toContain("evil.com");
  });

  it("removes style attributes", () => {
    expect(sanitizeBody('<p style="position:fixed;top:0">x</p>')).not.toContain("style");
  });

  it("keeps safe formatting markup", () => {
    const out = sanitizeBody(
      "<h2>Title</h2><p><strong>bold</strong> <em>italic</em> <code>x</code></p><ul><li>a</li></ul>",
    );
    expect(out).toContain("<h2>Title</h2>");
    expect(out).toContain("<strong>bold</strong>");
    expect(out).toContain("<em>italic</em>");
    expect(out).toContain("<li>a</li>");
  });

  it("keeps https links and images", () => {
    const out = sanitizeBody('<a href="https://uw.edu">uw</a><img src="/uploads/intake/a.png">');
    expect(out).toContain('href="https://uw.edu"');
    expect(out).toContain('src="/uploads/intake/a.png"');
  });

  it("adds rel=noopener noreferrer to links", () => {
    expect(sanitizeBody('<a href="https://uw.edu">x</a>')).toContain(
      'rel="noopener noreferrer"',
    );
  });

  it("allows mailto links", () => {
    expect(sanitizeBody('<a href="mailto:a@uw.edu">mail</a>')).toContain("mailto:a@uw.edu");
  });

  it("is idempotent", () => {
    const once = sanitizeBody('<p onclick="x">hi</p><script>bad()</script>');
    expect(sanitizeBody(once)).toBe(once);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
  ])("handles %s without throwing", (_l, v) => {
    expect(sanitizeBody(v as unknown as string)).toBe("");
  });
});

describe("excerpt", () => {
  it("strips all markup", () => {
    expect(excerpt("<h2>Hello</h2><p>world</p>")).toBe("Helloworld");
  });

  it("collapses whitespace", () => {
    expect(excerpt("<p>a\n\n   b</p>")).toBe("a b");
  });

  it("truncates with an ellipsis and respects the max length", () => {
    const out = excerpt(`<p>${"x".repeat(300)}</p>`, 50);
    expect(out).toHaveLength(50);
    expect(out.endsWith("…")).toBe(true);
  });

  it("leaves short text untouched", () => {
    expect(excerpt("<p>short</p>", 50)).toBe("short");
  });

  it("drops script content entirely rather than inlining its text", () => {
    expect(excerpt("<p>keep</p><script>alert(1)</script>")).toBe("keep");
  });
});
