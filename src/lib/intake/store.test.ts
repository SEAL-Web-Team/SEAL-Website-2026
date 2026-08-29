import { beforeEach, afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createStore, type IntakeStore } from "./store";

let store: IntakeStore;
const alice = { email: "alice@uw.edu", name: "Alice" };
const bob = { email: "bob@uw.edu", name: "Bob" };

beforeEach(() => {
  store = createStore(":memory:");
});
afterEach(() => {
  store.close();
});

const make = (title = "A Post", extra: Record<string, unknown> = {}, author = alice) =>
  store.create(
    { title, summary: "", body: "", bannerUrl: "", status: "draft", ...extra } as never,
    author,
  );

describe("create", () => {
  it("persists a post with author and timestamps", () => {
    const post = make("Hello World");
    expect(post).toMatchObject({
      title: "Hello World",
      slug: "hello-world",
      status: "draft",
      authorEmail: "alice@uw.edu",
      authorName: "Alice",
    });
    expect(post.id).toBeGreaterThan(0);
    expect(post.createdAt).toBeGreaterThan(0);
    expect(post.updatedAt).toBe(post.createdAt);
  });

  it("lowercases the author email so ownership checks are case-insensitive", () => {
    const post = make("X", {}, { email: "MiXeD@UW.edu", name: "M" });
    expect(post.authorEmail).toBe("mixed@uw.edu");
  });

  it("sanitizes the body on the way in", () => {
    const post = make("T", { body: '<p>ok</p><script>alert(1)</script>' });
    expect(post.body).toContain("<p>ok</p>");
    expect(post.body).not.toContain("script");
  });

  it("derives a summary from the body when none is given", () => {
    const post = make("T", { body: "<p>Derived summary text.</p>" });
    expect(post.summary).toBe("Derived summary text.");
  });

  it("keeps an explicit summary", () => {
    expect(make("T", { summary: "Mine", body: "<p>Other</p>" }).summary).toBe("Mine");
  });

  it("gives duplicate titles distinct slugs", () => {
    expect(make("Same Title").slug).toBe("same-title");
    expect(make("Same Title").slug).toBe("same-title-2");
    expect(make("Same Title").slug).toBe("same-title-3");
  });

  it("de-duplicates slugs across different authors too", () => {
    expect(make("Shared", {}, alice).slug).toBe("shared");
    expect(make("Shared", {}, bob).slug).toBe("shared-2");
  });

  it("handles a title that slugifies to nothing", () => {
    expect(make("🎉🎉").slug).toBe("post");
    expect(make("🎉🎉").slug).toBe("post-2");
  });
});

describe("get / getBySlug", () => {
  it("finds by id and by slug", () => {
    const post = make("Findable");
    expect(store.get(post.id)?.title).toBe("Findable");
    expect(store.getBySlug("findable")?.id).toBe(post.id);
  });

  it("returns null for unknown ids and slugs", () => {
    expect(store.get(9999)).toBeNull();
    expect(store.getBySlug("nope")).toBeNull();
  });
});

describe("listByAuthor", () => {
  it("returns only that author's posts", () => {
    make("Alice 1", {}, alice);
    make("Alice 2", {}, alice);
    make("Bob 1", {}, bob);

    expect(store.listByAuthor("alice@uw.edu")).toHaveLength(2);
    expect(store.listByAuthor("bob@uw.edu")).toHaveLength(1);
  });

  it("includes drafts (the author's private view)", () => {
    make("Draft", { status: "draft" });
    expect(store.listByAuthor("alice@uw.edu")[0].status).toBe("draft");
  });

  it("matches case-insensitively", () => {
    make("X", {}, alice);
    expect(store.listByAuthor("ALICE@UW.EDU")).toHaveLength(1);
  });

  it("returns [] for an author with nothing", () => {
    expect(store.listByAuthor("nobody@uw.edu")).toEqual([]);
  });
});

describe("listPublished", () => {
  it("excludes drafts — they must never leak to readers", () => {
    make("Published", { status: "published" });
    make("Secret Draft", { status: "draft" });

    const published = store.listPublished();
    expect(published).toHaveLength(1);
    expect(published[0].title).toBe("Published");
  });

  it("includes every author's published posts", () => {
    make("A", { status: "published" }, alice);
    make("B", { status: "published" }, bob);
    expect(store.listPublished()).toHaveLength(2);
  });
});

describe("update", () => {
  it("returns null for a missing post", () => {
    expect(store.update(999, { title: "x" })).toBeNull();
  });

  it("applies a partial patch and leaves other fields alone", () => {
    const post = make("Original", { summary: "keep me" });
    const updated = store.update(post.id, { status: "published" })!;

    expect(updated.status).toBe("published");
    expect(updated.title).toBe("Original");
    expect(updated.summary).toBe("keep me");
  });

  it("sanitizes a patched body", () => {
    const post = make("T");
    const updated = store.update(post.id, { body: '<p>x</p><img src="x" onerror="hack()">' })!;
    expect(updated.body).not.toContain("onerror");
  });

  it("re-slugs when the title changes", () => {
    const post = make("First Title");
    expect(store.update(post.id, { title: "Second Title" })!.slug).toBe("second-title");
  });

  it("keeps the slug stable when the title is unchanged", () => {
    const post = make("Stable Title");
    const updated = store.update(post.id, { summary: "new summary" })!;
    expect(updated.slug).toBe("stable-title");
  });

  it("keeps the slug stable when the title is re-sent identically", () => {
    const post = make("Stable Title");
    expect(store.update(post.id, { title: "Stable Title" })!.slug).toBe("stable-title");
  });

  it("avoids colliding with another post's slug when retitling", () => {
    make("Taken");
    const other = make("Other");
    expect(store.update(other.id, { title: "Taken" })!.slug).toBe("taken-2");
  });

  it("bumps updatedAt but preserves createdAt", async () => {
    const post = make("T");
    await new Promise((r) => setTimeout(r, 2));
    const updated = store.update(post.id, { title: "T2" })!;

    expect(updated.createdAt).toBe(post.createdAt);
    expect(updated.updatedAt).toBeGreaterThan(post.updatedAt);
  });

  it("can clear the banner", () => {
    const post = make("T", { bannerUrl: "/uploads/intake/a.png" });
    expect(store.update(post.id, { bannerUrl: "" })!.bannerUrl).toBe("");
  });
});

describe("remove", () => {
  it("deletes an existing post", () => {
    const post = make("Doomed");
    expect(store.remove(post.id)).toBe(true);
    expect(store.get(post.id)).toBeNull();
  });

  it("reports false for a missing post", () => {
    expect(store.remove(4242)).toBe(false);
  });

  it("frees the slug for reuse", () => {
    const post = make("Reusable");
    store.remove(post.id);
    expect(make("Reusable").slug).toBe("reusable");
  });
});

describe("sections and fields", () => {
  it("defaults to the news section", () => {
    expect(make("T").section).toBe("news");
  });

  it("persists section and fields round-trip", () => {
    const post = store.create(
      {
        section: "publications",
        title: "A Paper",
        summary: "",
        body: "",
        bannerUrl: "",
        fields: { authors: "A. M.", venue: "IEEE", kind: "conference" },
        status: "published",
      } as never,
      alice,
    );

    const reloaded = store.get(post.id)!;
    expect(reloaded.section).toBe("publications");
    expect(reloaded.fields).toEqual({ authors: "A. M.", venue: "IEEE", kind: "conference" });
  });

  it("listPublishedBySection returns only that section's published rows", () => {
    make("News A", { section: "news", status: "published" });
    make("News Draft", { section: "news", status: "draft" });
    make("Partner A", { section: "partners", status: "published" });

    const news = store.listPublishedBySection("news");
    expect(news.map((p) => p.title)).toEqual(["News A"]);
    expect(store.listPublishedBySection("partners")).toHaveLength(1);
    expect(store.listPublishedBySection("projects")).toEqual([]);
  });

  it("can change a post's section on update", () => {
    const post = make("T", { section: "news" });
    const updated = store.update(post.id, { section: "partners", fields: { website: "https://x.org" } } as never)!;
    expect(updated.section).toBe("partners");
    expect(updated.fields).toMatchObject({ website: "https://x.org" });
  });

  it("keeps existing fields when a patch omits them", () => {
    const post = make("T", { section: "partners", fields: { website: "https://x.org" } });
    const updated = store.update(post.id, { title: "T2" })!;
    expect(updated.fields).toMatchObject({ website: "https://x.org" });
  });

  it("survives corrupt JSON in the fields column", () => {
    const post = make("T");
    store.db.prepare("UPDATE posts SET fields = ? WHERE id = ?").run("{not json", post.id);
    // Must degrade to {} rather than throwing and taking the page down.
    expect(store.get(post.id)!.fields).toEqual({});
  });

  it("treats a non-object fields value as empty", () => {
    const post = make("T");
    store.db.prepare("UPDATE posts SET fields = ? WHERE id = ?").run("[1,2]", post.id);
    expect(store.get(post.id)!.fields).toEqual({});
  });
});

describe("migration from the pre-section schema", () => {
  it("adds section/fields to an existing table and defaults old rows to news", () => {
    // Build the ORIGINAL table shape, insert a row, then let createStore migrate.
    const file = path.join(mkdtempSync(path.join(tmpdir(), "intake-mig-")), "old.db");
    const legacy = new Database(file);
    legacy.exec(`
      CREATE TABLE posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '',
        banner_url TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft',
        author_email TEXT NOT NULL, author_name TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
      );
      INSERT INTO posts (slug,title,author_email,created_at,updated_at)
      VALUES ('legacy','Legacy Post','a@uw.edu',1,1);
    `);
    legacy.close();

    const migrated = createStore(file);
    const row = migrated.getBySlug("legacy")!;
    expect(row.title).toBe("Legacy Post");
    expect(row.section).toBe("news");
    expect(row.fields).toEqual({});

    // Re-opening an already-migrated database must not throw.
    migrated.close();
    const again = createStore(file);
    expect(again.getBySlug("legacy")!.section).toBe("news");
    again.close();
  });
});
