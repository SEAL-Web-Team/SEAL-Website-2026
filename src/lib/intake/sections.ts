import { z } from "zod";

// Each site section stores a different JSON shape (news has a body + people,
// publications have authors + venue, partners have a website…). Rather than
// force one schema on all of them, a submission carries a `section` plus a
// small `fields` blob validated per section, and a mapper turns it into the
// exact record shape that section's page already consumes.

export const SECTIONS = ["news", "projects", "publications", "partners", "locations"] as const;
export type Section = (typeof SECTIONS)[number];

export const SECTION_LABELS: Record<Section, string> = {
  news: "News & Awards",
  projects: "Project Showcase",
  publications: "Publications",
  partners: "Partner Organizations",
  locations: "Lab Locations",
};

/** Shown in the editor so people know what a section expects. */
export const SECTION_HELP: Record<Section, string> = {
  news: "An announcement, award, or write-up. Supports a full rich-text body.",
  projects: "A project card for the showcase. Links out to where the work lives.",
  publications: "A paper. Needs authors and a venue.",
  partners: "A partner organization and its website.",
  locations: "A lab space, with an optional link.",
};

const trimmed = z.string().trim();

/**
 * http/https only.
 *
 * zod's `.url()` delegates to the URL constructor, which happily accepts
 * `javascript:`, `data:` and `vbscript:`. Every one of these values ends up in
 * an `href` on a public page, so accepting those schemes is stored XSS waiting
 * for a context that doesn't guard them (React blocks javascript: today, but an
 * RSS feed or window.open would not).
 */
export const SAFE_URL_SCHEMES = ["http:", "https:"];

export function isSafeUrl(value: unknown): boolean {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    return SAFE_URL_SCHEMES.includes(new URL(value.trim()).protocol);
  } catch {
    return false;
  }
}

const safeUrl = (message: string) => trimmed.refine(isSafeUrl, { message });

const optionalUrl = z
  .union([safeUrl("Must be an http(s) URL"), z.literal("")])
  .optional()
  .default("");

// A missing key and an empty string must produce the SAME friendly message.
// Without the preprocess, zod reports "expected string, received undefined" for
// an absent field and the caller never learns which field it was.
const required = (message: string) =>
  z.preprocess((v) => (v == null ? "" : v), trimmed.min(1, message));

const requiredUrl = (message: string) =>
  z.preprocess((v) => (v == null ? "" : v), trimmed.min(1, message).refine(isSafeUrl, { message }));

// ── Per-section extra fields ────────────────────────────────────────────────

const newsFields = z.object({
  date: trimmed.max(60).optional().default(""),
  people: z.array(trimmed.min(1)).max(50).optional().default([]),
  links: z
    .array(z.object({ label: trimmed.min(1).max(120), url: safeUrl("Links must be http(s) URLs") }))
    .max(20)
    .optional()
    .default([]),
});

const projectsFields = z.object({
  // The showcase card links here. Members submitting a project don't get a
  // generated detail page, so they must point at where the work actually lives.
  url: requiredUrl("A project needs a link"),
});

const publicationsFields = z.object({
  authors: required("Authors are required"),
  venue: required("Venue is required"),
  kind: z.enum(["journal", "conference", "book"]).optional().default("journal"),
  url: optionalUrl,
});

const partnersFields = z.object({
  website: requiredUrl("A partner needs a website"),
});

const locationsFields = z.object({
  link: optionalUrl,
  linkLabel: trimmed.max(60).optional().default(""),
});

export const SECTION_FIELD_SCHEMAS = {
  news: newsFields,
  projects: projectsFields,
  publications: publicationsFields,
  partners: partnersFields,
  locations: locationsFields,
} satisfies Record<Section, z.ZodTypeAny>;

export type SectionFields = {
  [K in Section]: z.infer<(typeof SECTION_FIELD_SCHEMAS)[K]>;
};

/** Validate a section's extra fields. Unknown sections fail closed. */
export function parseSectionFields(section: Section, raw: unknown) {
  const schema = SECTION_FIELD_SCHEMAS[section];
  if (!schema) return { success: false as const, error: "Unknown section." };
  const result = schema.safeParse(raw ?? {});
  return result.success
    ? { success: true as const, data: result.data as Record<string, unknown> }
    : { success: false as const, error: result.error.issues[0]?.message ?? "Invalid fields." };
}

/** Which shared fields a section actually uses, for the editor to show/hide. */
export const SECTION_USES = {
  news: { body: true, image: true, summary: true },
  projects: { body: false, image: true, summary: true },
  publications: { body: false, image: false, summary: false },
  partners: { body: false, image: true, summary: true },
  locations: { body: false, image: true, summary: true },
} satisfies Record<Section, { body: boolean; image: boolean; summary: boolean }>;
