import { describe, expect, it } from "vitest";
import { validateSubmission } from "./schema";
import { safeReturnTo } from "./session";
import { parseSectionFields } from "./sections";
import { createStore } from "./store";
import { toNewsRecord } from "./to-section-record";

// One test per bug that actually shipped. Each names the symptom a user would
// have seen, so a future regression is obvious from the failure message alone.

describe("regression: PATCH must be a partial update, not a silent full replace", () => {
  // Symptom: renaming a published paper wiped its authors AND unpublished it,
  // because the create schema's .default()s were applied to omitted keys.
  const existing = {
    status: "published" as const,
    fields: { authors: "A. Author", venue: "IEEE", kind: "journal" },
  };
  const ctx = { partial: true, existingSection: "publications" as const, existing };

  it("keeps the post published when only the title is patched", () => {
    const r = validateSubmission({ title: "Renamed" }, ctx);
    expect(r.success).toBe(true);
    // status omitted → must NOT fall back to the "draft" default
    expect(r.success && r.data.status).not.toBe("draft");
  });

  it("does not blank the section fields when they are omitted", () => {
    // For a published post the effective fields are re-validated and returned,
    // so they must come back intact — never as {}.
    const r = validateSubmission({ title: "Renamed" }, ctx);
    expect(r.success && r.data.fields).toMatchObject({ authors: "A. Author", venue: "IEEE" });
  });

  it("leaves fields undefined on a draft patch so the store keeps its own copy", () => {
    const r = validateSubmission(
      { title: "Renamed" },
      { partial: true, existingSection: "news", existing: { status: "draft", fields: { date: "May" } } },
    );
    expect(r.success && r.data.fields).toBeUndefined();
  });

  it("does not blank the body when it is omitted", () => {
    const r = validateSubmission({ title: "Renamed" }, ctx);
    expect(r.success && r.data.body).toBeUndefined();
  });

  it("still validates against the STORED section when the patch omits it", () => {
    const r = validateSubmission(
      { title: "Renamed" },
      { partial: true, existingSection: "partners", existing: { status: "published", fields: {} } },
    );
    expect(r.success).toBe(false);
  });

  it("the store leaves omitted columns alone", () => {
    const store = createStore(":memory:");
    try {
      const post = store.create(
        {
          section: "publications",
          title: "Paper",
          summary: "S",
          body: "",
          bannerUrl: "",
          status: "published",
          fields: { authors: "A", venue: "V" },
        } as never,
        { email: "a@uw.edu" },
      );

      const after = store.update(post.id, { title: "Paper Renamed" })!;
      expect(after.status).toBe("published");
      expect(after.fields).toMatchObject({ authors: "A", venue: "V" });
      expect(after.summary).toBe("S");
    } finally {
      store.close();
    }
  });
});

describe("regression: dangerous URL schemes reached public hrefs", () => {
  // Symptom: a member could publish a partner whose "website" was
  // data:text/html,<script>…, and it rendered as a live href.
  it("rejects data: in a partner website", () => {
    expect(
      parseSectionFields("partners", { website: "data:text/html,<script>alert(1)</script>" })
        .success,
    ).toBe(false);
  });

  it("rejects javascript: in a project link", () => {
    expect(parseSectionFields("projects", { url: "javascript:alert(1)" }).success).toBe(false);
  });

  it("still accepts ordinary links", () => {
    expect(parseSectionFields("partners", { website: "https://example.org" }).success).toBe(true);
  });
});

describe("regression: /\\ was treated as a same-origin path", () => {
  // Symptom: ?return=/\evil.com passed the "/" check but browsers normalize it
  // to //evil.com, so login redirected off-site.
  it.each(["/\\evil.com", "/\\/evil.com", "\\\\evil.com", "/path\\evil.com"])(
    "refuses %s",
    (target) => {
      expect(safeReturnTo(target)).toBe("/intake");
    },
  );

  it("still allows genuine paths", () => {
    expect(safeReturnTo("/intake/new")).toBe("/intake/new");
    expect(safeReturnTo("/intake/edit/3?x=1")).toBe("/intake/edit/3?x=1");
  });
});

describe("regression: prototype-pollution keys behaved inconsistently", () => {
  // Symptom: constructor/prototype were rejected but __proto__ was silently
  // dropped by zod, so the three keys gave different, confusing outcomes.
  it.each(["__proto__", "constructor", "prototype"])("rejects %s the same way", (key) => {
    const r = validateSubmission({ title: "T", fields: JSON.parse(`{"${key}":{"x":1}}`) });
    expect(r.success).toBe(false);
    expect(!r.success && r.error).toBe("Invalid field name.");
  });

  it("does not reject an ordinary fields object", () => {
    expect(validateSubmission({ title: "T", fields: { authors: "A" } }).success).toBe(true);
  });
});

describe("regression: intake news ids must not collide with the archive", () => {
  // Symptom: raw autoincrement ids (1, 2, 3…) risked colliding with legacy
  // WordPress ids and would make /news/<id> resolve to the wrong article.
  it("offsets intake ids well clear of the archive range", () => {
    const store = createStore(":memory:");
    try {
      const post = store.create(
        { title: "T", section: "news", summary: "", body: "", bannerUrl: "" } as never,
        { email: "a@uw.edu" },
      );
      expect(toNewsRecord(post).id).toBeGreaterThan(999_999);
    } finally {
      store.close();
    }
  });
});

describe("regression: a corrupt fields column must not take the site down", () => {
  it("degrades to an empty object", () => {
    const store = createStore(":memory:");
    try {
      const post = store.create(
        { title: "T", summary: "", body: "", bannerUrl: "" } as never,
        { email: "a@uw.edu" },
      );
      store.db.prepare("UPDATE posts SET fields = ? WHERE id = ?").run("{oops", post.id);
      expect(() => store.get(post.id)).not.toThrow();
      expect(store.get(post.id)!.fields).toEqual({});
    } finally {
      store.close();
    }
  });
});
