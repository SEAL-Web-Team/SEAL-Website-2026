import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { isSafeUrl, parseSectionFields } from "./sections";
import { validateSubmission } from "./schema";
import { renderMarkdown } from "./markdown";
import { sanitizeBody } from "./sanitize";
import { sniffImageType } from "./image-type";
import { readSession, safeReturnTo, signSession } from "./session";
import { createStore } from "./store";
import {
  toLocationRecord,
  toNewsRecord,
  toPartnerRecord,
  toProjectRecord,
  toPublicationRecord,
} from "./to-section-record";

// Attack-shaped tests. Each one is a thing a signed-in SEAL member (or someone
// who stole a link) could actually try; every one of them must fail closed.

// ── Dangerous URL schemes ───────────────────────────────────────────────────
// These values all end up inside an href on a public page.

const DANGEROUS_URLS = [
  "javascript:alert(1)",
  "JaVaScRiPt:alert(1)",
  "  javascript:alert(1)  ",
  "data:text/html,<script>alert(1)</script>",
  "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
  "vbscript:msgbox(1)",
  "file:///etc/passwd",
  "about:blank",
  "blob:https://evil.com/x",
];

describe("attack: dangerous URL schemes are rejected everywhere they can reach an href", () => {
  it.each(DANGEROUS_URLS)("isSafeUrl rejects %s", (url) => {
    expect(isSafeUrl(url)).toBe(false);
  });

  it.each(["https://uw.edu", "http://uw.edu/x?y=1", "HTTPS://UW.EDU"])(
    "isSafeUrl allows %s",
    (url) => {
      expect(isSafeUrl(url)).toBe(true);
    },
  );

  it.each(DANGEROUS_URLS)("a partner website of %s cannot be published", (url) => {
    expect(parseSectionFields("partners", { website: url }).success).toBe(false);
  });

  it.each(DANGEROUS_URLS)("a project link of %s cannot be published", (url) => {
    expect(parseSectionFields("projects", { url }).success).toBe(false);
  });

  it.each(DANGEROUS_URLS)("a location link of %s cannot be published", (url) => {
    expect(parseSectionFields("locations", { link: url }).success).toBe(false);
  });

  it.each(DANGEROUS_URLS)("a news link of %s cannot be published", (url) => {
    expect(
      parseSectionFields("news", { links: [{ label: "Click me", url }] }).success,
    ).toBe(false);
  });

  it.each(DANGEROUS_URLS)("a publication url of %s cannot be published", (url) => {
    expect(
      parseSectionFields("publications", { authors: "A", venue: "V", url }).success,
    ).toBe(false);
  });

  it("blocks the whole submission, not just the field", () => {
    const r = validateSubmission({
      section: "partners",
      title: "Evil",
      status: "published",
      fields: { website: "javascript:alert(1)" },
    });
    expect(r.success).toBe(false);
  });
});

// ── Stored XSS through the body ─────────────────────────────────────────────

const XSS_BODIES = [
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  "<svg/onload=alert(1)>",
  "<iframe src=javascript:alert(1)></iframe>",
  "<a href=\"javascript:alert(1)\">x</a>",
  "<body onload=alert(1)>",
  "<div style=\"background:url(javascript:alert(1))\">x</div>",
  "<object data=\"data:text/html,<script>alert(1)</script>\"></object>",
  "<embed src=x onerror=alert(1)>",
  "<form action=/steal><input name=a></form>",
  "<math><mtext><script>alert(1)</script></mtext></math>",
  "<template><script>alert(1)</script></template>",
  "<noscript><p title=\"</noscript><script>alert(1)</script>\">",
];

const assertInert = (html: string) => {
  expect(html).not.toMatch(/<script/i);
  expect(html).not.toMatch(/<iframe/i);
  expect(html).not.toMatch(/<object/i);
  expect(html).not.toMatch(/<embed/i);
  expect(html).not.toMatch(/\son\w+\s*=/i); // onerror=, onload=, …
  expect(html).not.toMatch(/javascript:/i);
  expect(html).not.toMatch(/\sstyle\s*=/i);
};

describe("attack: stored XSS through an HTML body", () => {
  it.each(XSS_BODIES)("sanitizes %s", (payload) => {
    assertInert(sanitizeBody(payload));
  });

  it("survives a double-encoded payload without reviving it", () => {
    assertInert(sanitizeBody("&lt;script&gt;alert(1)&lt;/script&gt;"));
  });

  it("keeps sanitizing after a round-trip through the store", () => {
    const store = createStore(":memory:");
    try {
      const post = store.create(
        { title: "T", body: '<p>ok</p><script>alert(1)</script>', summary: "", bannerUrl: "" } as never,
        { email: "a@uw.edu" },
      );
      assertInert(store.get(post.id)!.body);
    } finally {
      store.close();
    }
  });
});

// ── Stored XSS through Markdown ─────────────────────────────────────────────
// marked passes raw HTML through by default, so the sanitizer must still run.

describe("attack: stored XSS through Markdown", () => {
  it.each([
    "<script>alert(1)</script>",
    "[click](javascript:alert(1))",
    "[click](  javascript:alert(1))",
    "![img](javascript:alert(1))",
    "<img src=x onerror=alert(1)>",
    "[click](data:text/html,<script>alert(1)</script>)",
    "<a href='javascript:alert(1)'>x</a>",
  ])("neutralizes %s", (md) => {
    assertInert(renderMarkdown(md));
  });

  it("still renders legitimate Markdown", () => {
    const html = renderMarkdown("## Title\n\nSome **bold** and a [link](https://uw.edu).");
    expect(html).toContain("<h2");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain('href="https://uw.edu"');
  });
});

// ── Banner path traversal ───────────────────────────────────────────────────

describe("attack: banner path traversal / remote images", () => {
  it.each([
    "/uploads/intake/../../../etc/passwd",
    "/uploads/intake/..%2f..%2fetc%2fpasswd",
    "/etc/passwd",
    "https://evil.com/track.png",
    "//evil.com/track.png",
    "javascript:alert(1)",
    "/uploads/intake/nested/dir.png",
    "/uploads/other/x.png",
  ])("rejects a banner of %s", (bannerUrl) => {
    expect(validateSubmission({ title: "T", bannerUrl }).success).toBe(false);
  });

  it("accepts a real uploaded path", () => {
    expect(
      validateSubmission({ title: "T", bannerUrl: "/uploads/intake/abc-123.png" }).success,
    ).toBe(true);
  });
});

// ── Disguised uploads ───────────────────────────────────────────────────────

describe("attack: uploading non-images", () => {
  const pad = (s: string) => Buffer.from(s.padEnd(64, " "));

  it.each([
    ["HTML", pad("<html><script>alert(1)</script></html>")],
    ["SVG with script", pad('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')],
    ["PHP", pad("<?php system($_GET['c']); ?>")],
    ["shell script", pad("#!/bin/sh\nrm -rf /")],
    ["ELF", Buffer.concat([Buffer.from([0x7f, 0x45, 0x4c, 0x46]), Buffer.alloc(60)])],
  ])("refuses to store %s even with an image extension", (_label, bytes) => {
    expect(sniffImageType(bytes)).toBeNull();
  });

  it("refuses a polyglot whose image magic appears after the HTML", () => {
    const polyglot = Buffer.concat([
      Buffer.from("<html><script>alert(1)</script>".padEnd(32)),
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ]);
    expect(sniffImageType(polyglot)).toBeNull();
  });
});

// ── Session forgery ─────────────────────────────────────────────────────────

describe("attack: forging a session cookie", () => {
  it.each([
    ["no signature", "eyJlbWFpbCI6ImV2aWxAZXZpbC5jb20ifQ"],
    ["empty signature", "eyJlbWFpbCI6ImV2aWxAZXZpbC5jb20ifQ."],
    ["garbage signature", "eyJlbWFpbCI6ImV2aWxAZXZpbC5jb20ifQ.AAAAAAAA"],
    ["not a token", "admin"],
  ])("rejects %s", (_l, cookie) => {
    expect(readSession(cookie)).toBeNull();
  });

  it("rejects a valid body re-signed with the wrong secret", () => {
    const real = signSession({ email: "member@uw.edu" });
    const [body] = real.split(".");
    const forged = crypto.createHmac("sha256", "wrong").update(body).digest("base64url");
    expect(readSession(`${body}.${forged}`)).toBeNull();
  });

  it("refuses to accept a pre-OAuth cookie as a login", () => {
    // The pre cookie is issued BEFORE the SEAL gate runs, so promoting one into
    // a session would bypass the Clan Life check entirely.
    expect(readSession(signSession({ email: "x@uw.edu", stateNonce: "n", __pre: true }))).toBeNull();
  });
});

// ── Open redirect ───────────────────────────────────────────────────────────

describe("attack: open redirect through returnTo", () => {
  it.each([
    "//evil.com",
    "https://evil.com",
    "http://evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "\\\\evil.com",
  ])("refuses to send the user to %s", (target) => {
    const safe = safeReturnTo(target);
    expect(safe.startsWith("/")).toBe(true);
    expect(safe.startsWith("//")).toBe(false);
    expect(safe).not.toContain("evil.com");
  });
});

// ── Prototype pollution / oversized payloads ────────────────────────────────

describe("attack: prototype pollution and payload bloat via fields", () => {
  it.each(["__proto__", "constructor", "prototype"])("rejects a %s key", (key) => {
    const r = validateSubmission({ title: "T", fields: JSON.parse(`{"${key}":{"admin":true}}`) });
    expect(r.success).toBe(false);
  });

  it("leaves Object.prototype untouched after a rejected attempt", () => {
    validateSubmission({ title: "T", fields: JSON.parse('{"__proto__":{"polluted":"yes"}}') });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("rejects a fields blob far beyond any legitimate use", () => {
    const r = validateSubmission({ title: "T", fields: { note: "x".repeat(20_000) } });
    expect(r.success).toBe(false);
  });

  it("rejects an oversized body", () => {
    expect(validateSubmission({ title: "T", body: "x".repeat(200_001) }).success).toBe(false);
  });
});

// ── SQL injection ───────────────────────────────────────────────────────────

describe("attack: SQL injection through stored text", () => {
  it("treats injection strings as literal data", () => {
    const store = createStore(":memory:");
    try {
      const evil = "'; DROP TABLE posts; --";
      const post = store.create(
        { title: evil, summary: evil, body: "", bannerUrl: "" } as never,
        { email: "a@uw.edu" },
      );

      // The table still exists and the value round-trips verbatim.
      expect(store.get(post.id)!.title).toBe(evil);
      expect(store.listByAuthor("a@uw.edu")).toHaveLength(1);
    } finally {
      store.close();
    }
  });

  it("does not let a crafted author email read another author's rows", () => {
    const store = createStore(":memory:");
    try {
      store.create({ title: "Mine", summary: "", body: "", bannerUrl: "" } as never, {
        email: "victim@uw.edu",
      });
      expect(store.listByAuthor("' OR 1=1 --")).toEqual([]);
    } finally {
      store.close();
    }
  });
});

// ── Draft confidentiality ───────────────────────────────────────────────────

describe("attack: reading someone else's unpublished work", () => {
  it("keeps drafts out of every public listing", () => {
    const store = createStore(":memory:");
    try {
      store.create(
        { title: "Embargoed", section: "news", status: "draft", summary: "", body: "", bannerUrl: "" } as never,
        { email: "victim@uw.edu" },
      );
      expect(store.listPublished()).toEqual([]);
      expect(store.listPublishedBySection("news")).toEqual([]);
    } finally {
      store.close();
    }
  });
});

// ── Publish-time bypass ─────────────────────────────────────────────────────

describe("attack: sneaking unvalidated content live via PATCH", () => {
  it("cannot publish by PATCHing only the status", () => {
    // The stored draft has no authors/venue; flipping status alone must not
    // put an incomplete record on the public page.
    const r = validateSubmission(
      { status: "published" },
      { partial: true, existingSection: "publications", existing: { status: "draft", fields: {} } },
    );
    expect(r.success).toBe(false);
  });

  it("cannot publish with a dangerous URL already sitting in the stored draft", () => {
    const r = validateSubmission(
      { status: "published" },
      {
        partial: true,
        existingSection: "partners",
        existing: { status: "draft", fields: { website: "javascript:alert(1)" } },
      },
    );
    expect(r.success).toBe(false);
  });
});

// ── Rows that predate the validation ────────────────────────────────────────
// Write-time checks only guard new writes. Anything already in the database —
// or written by a future path that skips the schema — must still render inert.

describe("attack: dangerous URLs already sitting in the database", () => {
  const stored = (section: string, fields: Record<string, unknown>) => {
    const store = createStore(":memory:");
    const post = store.create(
      { title: "Legacy", section, summary: "s", body: "", bannerUrl: "" } as never,
      { email: "a@uw.edu" },
    );
    // Bypass the schema entirely, exactly as a pre-fix row or a manual edit would.
    store.db.prepare("UPDATE posts SET fields = ? WHERE id = ?").run(JSON.stringify(fields), post.id);
    const row = store.get(post.id)!;
    store.close();
    return row;
  };

  it("strips a javascript: partner website at render time", () => {
    const r = toPartnerRecord(stored("partners", { website: "javascript:alert(1)" }));
    expect(r.website).toBe("");
  });

  it("strips a data: partner website at render time", () => {
    const r = toPartnerRecord(stored("partners", { website: "data:text/html,<script>x</script>" }));
    expect(r.website).toBe("");
  });

  it("strips a dangerous project link", () => {
    expect(toProjectRecord(stored("projects", { url: "javascript:alert(1)" })).url).toBe("");
  });

  it("nulls a dangerous location link", () => {
    expect(toLocationRecord(stored("locations", { link: "vbscript:x" })).link).toBeNull();
  });

  it("nulls a dangerous publication url", () => {
    const r = toPublicationRecord(stored("publications", { authors: "A", venue: "V", url: "javascript:x" }));
    expect(r.url).toBeNull();
  });

  it("drops dangerous news links but keeps the safe ones", () => {
    const r = toNewsRecord(
      stored("news", {
        links: [
          { label: "bad", url: "javascript:alert(1)" },
          { label: "good", url: "https://uw.edu" },
        ],
      }),
    );
    expect(r.links).toHaveLength(1);
    expect(r.links[0].url).toBe("https://uw.edu");
  });

  it("keeps legitimate stored URLs untouched", () => {
    expect(toPartnerRecord(stored("partners", { website: "https://example.org" })).website).toBe(
      "https://example.org",
    );
  });
});
