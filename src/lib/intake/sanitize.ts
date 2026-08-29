import sanitizeHtml from "sanitize-html";

// Post bodies are authored as HTML by the Tiptap editor and rendered back with
// dangerouslySetInnerHTML, so everything MUST pass through here first. Anyone in
// SEAL can post, and a stored <script> would run for every later reader.

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "s", "u", "code", "pre", "blockquote",
  "h1", "h2", "h3", "h4",
  "ul", "ol", "li",
  "a", "img", "hr",
];

export const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title"],
  },
  // http/https only. Notably excludes `javascript:` (XSS) and `data:` (which can
  // smuggle scriptable SVG payloads through an <img src>).
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
  transformTags: {
    // Untrusted outbound links must not get window.opener access to our page.
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
};

export function sanitizeBody(html: string): string {
  return sanitizeHtml(String(html ?? ""), sanitizeOptions);
}

/** Plain-text excerpt for list views — strips every tag, collapses whitespace. */
export function excerpt(html: string, max = 180): string {
  const text = sanitizeHtml(String(html ?? ""), { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}
