import { describe, expect, it } from "vitest";
import { looksLikeHtml, renderBody, renderMarkdown } from "./markdown";

// The point of these: someone should be able to hand-write a news entry in
// news.json using Markdown and have it display correctly, without touching code.

describe("renderMarkdown — the formatting people actually use", () => {
  it.each([
    ["heading", "## Section Title", "<h2"],
    ["bold", "some **bold** text", "<strong>bold</strong>"],
    ["italic", "some *slanted* text", "<em>slanted</em>"],
    ["inline code", "run `npm test` now", "<code>npm test</code>"],
    ["bullet list", "- one\n- two", "<li>"],
    ["numbered list", "1. one\n2. two", "<ol>"],
    ["blockquote", "> quoted", "<blockquote>"],
    ["link", "[SEAL](https://uwseal.org)", 'href="https://uwseal.org"'],
    ["horizontal rule", "a\n\n---\n\nb", "<hr"],
    ["fenced code", "```\ncode here\n```", "<pre>"],
  ])("renders a %s", (_label, md, expected) => {
    expect(renderMarkdown(md)).toContain(expected);
  });

  it("renders an image from Markdown", () => {
    expect(renderMarkdown("![alt](https://uwseal.org/a.png)")).toContain(
      'src="https://uwseal.org/a.png"',
    );
  });

  it("turns blank-line-separated text into paragraphs", () => {
    const html = renderMarkdown("First para.\n\nSecond para.");
    expect(html.match(/<p>/g)).toHaveLength(2);
  });

  it("adds rel=noopener to links, like the editor path does", () => {
    expect(renderMarkdown("[x](https://uw.edu)")).toContain('rel="noopener noreferrer"');
  });

  it.each(["", "   ", "\n\n"])("returns empty for %p", (input) => {
    expect(renderMarkdown(input)).toBe("");
  });

  it("handles a full article without throwing", () => {
    const article = [
      "# Big News",
      "",
      "The lab **shipped** something. Details:",
      "",
      "- First point",
      "- Second point with a [link](https://uwseal.org)",
      "",
      "> A quote from someone.",
      "",
      "![Photo](https://uwseal.org/photo.png)",
    ].join("\n");

    const html = renderMarkdown(article);
    for (const fragment of ["<h1", "<strong>shipped</strong>", "<li>", "<blockquote>", "<img"]) {
      expect(html, `missing ${fragment}`).toContain(fragment);
    }
  });
});

describe("looksLikeHtml", () => {
  it.each(["<p>hi</p>", "<h2>Title</h2>", "<ul><li>a</li></ul>", '<img src="x">'])(
    "detects %s as HTML",
    (html) => expect(looksLikeHtml(html)).toBe(true),
  );

  it.each([
    "## Just markdown",
    "Plain text with a < sign",
    "a < b and c > d",
    "",
    "5 < 10",
  ])("does not mistake %p for HTML", (text) => {
    expect(looksLikeHtml(text)).toBe(false);
  });
});

describe("renderBody — one path for every authoring route", () => {
  it("passes editor HTML through (already structured)", () => {
    const html = renderBody("<h2>From the editor</h2><p>Body</p>");
    expect(html).toContain("<h2>From the editor</h2>");
    // Must not be double-wrapped in a paragraph by the Markdown renderer.
    expect(html).not.toContain("<p><h2>");
  });

  it("converts hand-written Markdown", () => {
    expect(renderBody("## Hand written\n\nWith a paragraph.")).toContain("<h2");
  });

  it("renders the legacy plain-text news.json shape as paragraphs", () => {
    // Existing entries are plain prose with blank lines between paragraphs.
    const legacy = "The lab announced something.\n\nA second paragraph follows.";
    const html = renderBody(legacy);
    expect(html.match(/<p>/g)).toHaveLength(2);
    expect(html).toContain("The lab announced something.");
  });

  it("sanitizes regardless of which path it takes", () => {
    for (const input of ["<p>ok</p><script>alert(1)</script>", "## md\n\n<script>alert(1)</script>"]) {
      expect(renderBody(input)).not.toContain("<script");
    }
  });

  it("is empty for empty input", () => {
    expect(renderBody("")).toBe("");
  });
});
