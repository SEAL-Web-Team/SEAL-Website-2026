import { z } from "zod";
import slugify from "slugify";
import { SECTIONS, parseSectionFields, type Section } from "./sections";

export const POST_STATUSES = ["draft", "published"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

const POLLUTION_KEYS = ["__proto__", "constructor", "prototype"];
export const MAX_FIELDS_BYTES = 16 * 1024;

/** True if the raw object carries a key that could reach Object.prototype. */
function hasPollutionKey(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  // Own-keys only: a plain {} inherits "constructor" from its prototype, and
  // flagging that would reject every ordinary submission.
  return POLLUTION_KEYS.some((k) => Object.prototype.hasOwnProperty.call(raw, k));
}

// Relative upload paths only. An absolute URL here would let a post point its
// banner at an attacker-controlled host (and leak referrers to it).
const uploadPath = z
  .string()
  .trim()
  .regex(/^\/uploads\/intake\/[A-Za-z0-9._-]+$/, "must be an uploaded image path");

export const postInputSchema = z.object({
  // Deliberately NO .default() — a default here would be indistinguishable from
  // the caller explicitly choosing "news", so a PATCH that omits the section
  // would silently re-validate against news instead of the stored section.
  section: z.enum(SECTIONS).optional(),
  title: z.string().trim().min(1, "Title is required").max(160, "Title is too long"),
  summary: z.string().trim().max(400, "Summary is too long").optional().default(""),
  body: z.string().max(200_000, "Body is too long").optional().default(""),
  bannerUrl: z.union([uploadPath, z.literal("")]).optional().default(""),
  // Drafts skip per-section validation, so without this guard `fields` is an
  // unbounded attacker-controlled JSON blob. (Pollution keys are checked on the
  // RAW payload in validateSubmission — zod strips `__proto__` before a refine
  // here could ever see it, which would make the three keys behave differently.)
  fields: z
    .record(z.string(), z.unknown())
    .refine((f) => JSON.stringify(f).length <= MAX_FIELDS_BYTES, {
      message: "Too much field data.",
    })
    .optional()
    .default({}),
  status: z.enum(POST_STATUSES).optional().default("draft"),
});

export type PostInput = z.infer<typeof postInputSchema>;

/**
 * Update schema — every key optional AND default-free.
 *
 * Deliberately spelled out rather than `postInputSchema.partial()`: `.partial()`
 * only adds `.optional()`, it does not remove the `.default()`s, so an omitted
 * key would still resolve to "" / {} / "draft" and overwrite stored data. An
 * absent key here stays `undefined`, which is what lets the store keep what it
 * already has.
 */
export const postPatchSchema = z.object({
  section: z.enum(SECTIONS).optional(),
  title: z.string().trim().min(1, "Title is required").max(160, "Title is too long").optional(),
  summary: z.string().trim().max(400, "Summary is too long").optional(),
  body: z.string().max(200_000, "Body is too long").optional(),
  bannerUrl: z.union([uploadPath, z.literal("")]).optional(),
  fields: z
    .record(z.string(), z.unknown())
    .refine((f) => JSON.stringify(f).length <= MAX_FIELDS_BYTES, {
      message: "Too much field data.",
    })
    .optional(),
  status: z.enum(POST_STATUSES).optional(),
});
export type PostPatch = z.infer<typeof postPatchSchema>;

/**
 * Validate the shared fields AND the section-specific ones together.
 *
 * Section extras are only enforced on publish: a draft is a work in progress and
 * shouldn't be blocked for not having a venue yet, but anything that reaches the
 * public site must be complete.
 */
export function validateSubmission(
  payload: unknown,
  {
    existingSection,
    existing,
    partial = false,
  }: { existingSection?: Section; existing?: Partial<PostInput>; partial?: boolean } = {},
):
  | { success: true; data: PostInput }
  | { success: false; error: string } {
  // A PATCH must be a genuine partial update. Parsing it with the full schema
  // applies every `.default()`, so omitting `status` silently unpublished the
  // post and omitting `fields` wiped its authors/venue. The patch schema leaves
  // absent keys `undefined` so the store keeps what it already has.
  // Checked on the raw payload: zod's record parser silently drops `__proto__`,
  // so by the time a refine runs it looks identical to a clean object. Rejecting
  // here keeps all three pollution keys behaving the same and makes the refusal
  // visible to the caller instead of silently mangling their data.
  if (hasPollutionKey((payload as { fields?: unknown })?.fields)) {
    return { success: false, error: "Invalid field name." };
  }

  const schema = partial ? postPatchSchema : postInputSchema;
  const base = schema.safeParse(payload);
  if (!base.success) {
    return { success: false, error: base.error.issues[0]?.message ?? "Invalid submission." };
  }

  const data = base.data as PostInput;
  const section = data.section ?? existingSection ?? "news";
  // Effective values after the patch is applied, for deciding whether the
  // *result* is published and which fields it will end up with.
  const status = data.status ?? existing?.status ?? "draft";
  const fieldsIn = data.fields ?? existing?.fields ?? {};

  if (status !== "published") return { success: true, data: { ...data, section } };

  const fields = parseSectionFields(section, fieldsIn);
  if (!fields.success) return { success: false, error: fields.error };
  return { success: true, data: { ...data, section, status, fields: fields.data } };
}

/**
 * URL-safe slug. Always returns something non-empty: a title of only emoji or
 * CJK can slugify to "", which would produce colliding empty slugs.
 */
export function toSlug(title: string): string {
  const base = slugify(String(title ?? ""), { lower: true, strict: true, trim: true }).slice(0, 80);
  return base || "post";
}

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/**
 * Extension is derived from the sniffed MIME type, never from the client-supplied
 * filename — otherwise "x.html" could be served back as HTML from our origin.
 */
export function extensionForType(type: string): string | null {
  return EXT_BY_TYPE[String(type || "").toLowerCase()] ?? null;
}
