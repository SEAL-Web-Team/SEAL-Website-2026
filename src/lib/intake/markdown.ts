import { marked } from "marked";
import { sanitizeBody } from "./sanitize";

// Markdown → sanitized HTML, so content can be authored either in the Tiptap
// editor (which emits HTML) or by hand in a JSON data file using Markdown.
//
// The output ALWAYS goes through the same sanitizer as editor content: marked
// passes raw HTML in the source straight through by default, so `<script>` in a
// .md body would otherwise land verbatim in the page.

marked.setOptions({
  gfm: true,
  breaks: true, // single newlines become <br>, matching how people write these
});

/**
 * True when the text looks like HTML rather than Markdown/plain text.
 * Used to auto-detect the format of a stored body so both authoring routes work
 * without a per-record flag.
 */
export function looksLikeHtml(text: string): boolean {
  return /<(p|div|h[1-6]|ul|ol|li|blockquote|pre|img|a|strong|em|br)\b[^>]*>/i.test(
    String(text ?? ""),
  );
}

/** Render Markdown (or plain text) to sanitized HTML. */
export function renderMarkdown(source: string): string {
  const text = String(source ?? "");
  if (!text.trim()) return "";
  // marked.parse is sync when no async extensions are registered.
  return sanitizeBody(marked.parse(text, { async: false }) as string);
}

/**
 * Render a body of unknown provenance:
 *  - Tiptap/editor HTML  → sanitize only (already structured)
 *  - Markdown/plain text → convert, then sanitize
 *
 * Plain paragraphs separated by blank lines are valid Markdown, so the existing
 * news.json bodies render correctly through this path too.
 */
export function renderBody(source: string): string {
  const text = String(source ?? "");
  if (!text.trim()) return "";
  return looksLikeHtml(text) ? sanitizeBody(text) : renderMarkdown(text);
}
