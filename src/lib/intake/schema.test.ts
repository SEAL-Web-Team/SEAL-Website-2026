import { describe, expect, it } from "vitest";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  extensionForType,
  postInputSchema,
  postPatchSchema,
  toSlug,
  validateSubmission,
} from "./schema";

describe("postInputSchema", () => {
  it("accepts a minimal post and applies defaults", () => {
    const parsed = postInputSchema.parse({ title: "Hello" });
    expect(parsed).toMatchObject({ title: "Hello", summary: "", body: "", bannerUrl: "", status: "draft" });
  });

  it("trims the title", () => {
    expect(postInputSchema.parse({ title: "  Spaced  " }).title).toBe("Spaced");
  });

  it.each([
    ["empty", ""],
    ["whitespace only", "   "],
  ])("rejects a %s title", (_l, title) => {
    const r = postInputSchema.safeParse({ title });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toMatch(/title is required/i);
  });

  it("rejects an over-long title", () => {
    expect(postInputSchema.safeParse({ title: "x".repeat(161) }).success).toBe(false);
  });

  it("rejects an over-long summary", () => {
    expect(postInputSchema.safeParse({ title: "t", summary: "x".repeat(401) }).success).toBe(false);
  });

  it("rejects an unknown status", () => {
    expect(postInputSchema.safeParse({ title: "t", status: "archived" }).success).toBe(false);
  });

  it("accepts both valid statuses", () => {
    for (const status of ["draft", "published"]) {
      expect(postInputSchema.safeParse({ title: "t", status }).success).toBe(true);
    }
  });

  describe("bannerUrl must be a local upload path", () => {
    it("accepts an uploaded path", () => {
      const r = postInputSchema.safeParse({ title: "t", bannerUrl: "/uploads/intake/abc-1.png" });
      expect(r.success).toBe(true);
    });

    it("accepts empty (no banner)", () => {
      expect(postInputSchema.safeParse({ title: "t", bannerUrl: "" }).success).toBe(true);
    });

    it.each([
      ["remote host", "https://evil.com/x.png"],
      ["protocol relative", "//evil.com/x.png"],
      ["path traversal", "/uploads/intake/../../../etc/passwd"],
      ["other directory", "/etc/passwd"],
      ["javascript", "javascript:alert(1)"],
      ["nested path", "/uploads/intake/sub/dir.png"],
    ])("rejects a %s banner", (_l, bannerUrl) => {
      expect(postInputSchema.safeParse({ title: "t", bannerUrl }).success).toBe(false);
    });
  });
});

describe("postPatchSchema", () => {
  it("allows a partial update", () => {
    expect(postPatchSchema.parse({ status: "published" })).toMatchObject({ status: "published" });
  });

  it("allows an empty patch", () => {
    expect(postPatchSchema.safeParse({}).success).toBe(true);
  });

  it("still validates supplied fields", () => {
    expect(postPatchSchema.safeParse({ title: "" }).success).toBe(false);
    expect(postPatchSchema.safeParse({ bannerUrl: "https://evil.com/a.png" }).success).toBe(false);
  });
});

describe("toSlug", () => {
  it.each([
    ["Hello World", "hello-world"],
    ["  Trim  Me  ", "trim-me"],
    ["Punctuation!? Here.", "punctuation-here"],
    ["MiXeD CaSe", "mixed-case"],
  ])("slugifies %s", (input, expected) => {
    expect(toSlug(input)).toBe(expected);
  });

  it("never returns empty, even for unslugifiable input", () => {
    for (const input of ["🎉🎉", "", "   ", "!!!"]) {
      expect(toSlug(input)).not.toBe("");
    }
  });

  it("caps the length", () => {
    expect(toSlug("word ".repeat(100)).length).toBeLessThanOrEqual(80);
  });
});

describe("upload type helpers", () => {
  it("maps allowed types to extensions", () => {
    expect(extensionForType("image/png")).toBe("png");
    expect(extensionForType("image/jpeg")).toBe("jpg");
    expect(extensionForType("IMAGE/WEBP")).toBe("webp");
  });

  it("returns null for disallowed types", () => {
    for (const t of ["text/html", "image/svg+xml", "application/pdf", ""]) {
      expect(extensionForType(t)).toBeNull();
    }
  });

  it("every allowed type has an extension", () => {
    for (const t of ALLOWED_IMAGE_TYPES) expect(extensionForType(t)).toBeTruthy();
  });

  it("notably does not allow SVG (scriptable)", () => {
    expect(ALLOWED_IMAGE_TYPES.has("image/svg+xml")).toBe(false);
  });

  it("caps uploads at 8MB", () => {
    expect(MAX_UPLOAD_BYTES).toBe(8 * 1024 * 1024);
  });
});

describe("validateSubmission — section fields are enforced on publish only", () => {
  const draft = { title: "WIP", section: "publications" as const, status: "draft" as const };

  it("lets an incomplete draft through", () => {
    // A draft is a work in progress: blocking it for a missing venue would stop
    // people saving as they go.
    const r = validateSubmission(draft);
    expect(r.success).toBe(true);
  });

  it("blocks publishing without the section's required fields", () => {
    const r = validateSubmission({ ...draft, status: "published" });
    expect(r.success).toBe(false);
    expect(!r.success && r.error).toMatch(/authors/i);
  });

  it("allows publishing once the fields are supplied", () => {
    const r = validateSubmission({
      ...draft,
      status: "published",
      fields: { authors: "A. Mamishev", venue: "IEEE Sensors" },
    });
    expect(r.success).toBe(true);
    expect(r.success && r.data.fields).toMatchObject({ authors: "A. Mamishev" });
  });

  it("requires a project link before publishing", () => {
    const r = validateSubmission({ title: "P", section: "projects", status: "published" });
    expect(r.success).toBe(false);
    expect(!r.success && r.error).toMatch(/link/i);
  });

  it("requires a partner website before publishing", () => {
    const r = validateSubmission({ title: "P", section: "partners", status: "published" });
    expect(r.success).toBe(false);
  });

  it("publishes news with no extra fields at all", () => {
    expect(validateSubmission({ title: "N", section: "news", status: "published" }).success).toBe(true);
  });

  it("defaults the section to news", () => {
    const r = validateSubmission({ title: "N" });
    expect(r.success && r.data.section).toBe("news");
  });

  it("rejects an unknown section", () => {
    expect(validateSubmission({ title: "N", section: "blog" }).success).toBe(false);
  });

  it("falls back to the existing section when a patch omits it", () => {
    // PATCHing only {status:"published"} must still enforce the stored section's
    // rules, not silently validate against news.
    const r = validateSubmission(
      { title: "P", status: "published" },
      { existingSection: "partners" },
    );
    expect(r.success).toBe(false);
  });

  it("still rejects a bad title regardless of section", () => {
    expect(validateSubmission({ title: "", section: "news" }).success).toBe(false);
  });
});
