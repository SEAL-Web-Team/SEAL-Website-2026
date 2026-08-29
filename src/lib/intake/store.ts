import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { toSlug, type PostInput, type PostPatch, type PostStatus } from "./schema";
import { sanitizeBody, excerpt } from "./sanitize";
import type { Section } from "./sections";

export type Post = {
  id: number;
  slug: string;
  section: Section;
  title: string;
  summary: string;
  body: string;
  bannerUrl: string;
  /** Section-specific extras (authors, venue, website…). Shape per section. */
  fields: Record<string, unknown>;
  status: PostStatus;
  authorEmail: string;
  authorName: string;
  createdAt: number;
  updatedAt: number;
};

type Row = {
  id: number;
  slug: string;
  section: string;
  title: string;
  summary: string;
  body: string;
  banner_url: string;
  fields: string;
  status: string;
  author_email: string;
  author_name: string;
  created_at: number;
  updated_at: number;
};

function parseFields(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

const toPost = (r: Row): Post => ({
  id: r.id,
  slug: r.slug,
  section: (r.section || "news") as Section,
  title: r.title,
  summary: r.summary,
  body: r.body,
  bannerUrl: r.banner_url,
  fields: parseFields(r.fields),
  status: r.status as PostStatus,
  authorEmail: r.author_email,
  authorName: r.author_name,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const TABLE = `
CREATE TABLE IF NOT EXISTS posts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT    NOT NULL UNIQUE,
  section      TEXT    NOT NULL DEFAULT 'news',
  title        TEXT    NOT NULL,
  summary      TEXT    NOT NULL DEFAULT '',
  body         TEXT    NOT NULL DEFAULT '',
  banner_url   TEXT    NOT NULL DEFAULT '',
  fields       TEXT    NOT NULL DEFAULT '{}',
  status       TEXT    NOT NULL DEFAULT 'draft',
  author_email TEXT    NOT NULL,
  author_name  TEXT    NOT NULL DEFAULT '',
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);
`;

// Indexes run AFTER migrate(): posts_section references a column that an
// older database won't have until the migration adds it.
const INDEXES = `
CREATE INDEX IF NOT EXISTS posts_author  ON posts (author_email);
CREATE INDEX IF NOT EXISTS posts_status  ON posts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_section ON posts (section, status, created_at DESC);
`;

/**
 * Add columns introduced after the first release. SQLite has no
 * "ADD COLUMN IF NOT EXISTS", so check the table info first — this must be safe
 * to run on every boot against an already-migrated database.
 */
function migrate(db: Database.Database) {
  const existing = new Set(
    (db.prepare("PRAGMA table_info(posts)").all() as { name: string }[]).map((c) => c.name),
  );
  if (!existing.has("section")) {
    db.exec("ALTER TABLE posts ADD COLUMN section TEXT NOT NULL DEFAULT 'news'");
  }
  if (!existing.has("fields")) {
    db.exec("ALTER TABLE posts ADD COLUMN fields TEXT NOT NULL DEFAULT '{}'");
  }
}

export type IntakeStore = ReturnType<typeof createStore>;

export function createStore(filename: string) {
  if (filename !== ":memory:") mkdirSync(path.dirname(filename), { recursive: true });
  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(TABLE);
  migrate(db);
  db.exec(INDEXES);

  /**
   * Slugs are unique, so a duplicate title needs a suffix. Done inside the same
   * transaction as the insert by the caller, so two concurrent creates can't both
   * see the same "free" slug — the UNIQUE constraint is the real backstop.
   */
  function uniqueSlug(title: string, excludeId?: number): string {
    const base = toSlug(title);
    const taken = db.prepare(
      excludeId
        ? "SELECT 1 FROM posts WHERE slug = ? AND id != ? LIMIT 1"
        : "SELECT 1 FROM posts WHERE slug = ? LIMIT 1",
    );
    let candidate = base;
    for (let n = 2; ; n += 1) {
      const hit = excludeId ? taken.get(candidate, excludeId) : taken.get(candidate);
      if (!hit) return candidate;
      candidate = `${base}-${n}`;
    }
  }

  const insert = db.prepare(`
    INSERT INTO posts (slug, section, title, summary, body, banner_url, fields, status, author_email, author_name, created_at, updated_at)
    VALUES (@slug, @section, @title, @summary, @body, @banner_url, @fields, @status, @author_email, @author_name, @created_at, @updated_at)
  `);

  return {
    db,

    create(input: PostInput, author: { email: string; name?: string }): Post {
      const now = Date.now();
      const body = sanitizeBody(input.body ?? "");
      const run = db.transaction((): number => {
        const info = insert.run({
          slug: uniqueSlug(input.title),
          section: input.section ?? "news",
          title: input.title,
          summary: input.summary || excerpt(body),
          body,
          banner_url: input.bannerUrl ?? "",
          fields: JSON.stringify(input.fields ?? {}),
          status: input.status ?? "draft",
          author_email: author.email.toLowerCase(),
          author_name: author.name ?? "",
          created_at: now,
          updated_at: now,
        });
        return Number(info.lastInsertRowid);
      });
      return this.get(run())!;
    },

    get(id: number): Post | null {
      const row = db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as Row | undefined;
      return row ? toPost(row) : null;
    },

    getBySlug(slug: string): Post | null {
      const row = db.prepare("SELECT * FROM posts WHERE slug = ?").get(slug) as Row | undefined;
      return row ? toPost(row) : null;
    },

    /** Everything, newest first — the author's own dashboard view. */
    listByAuthor(email: string): Post[] {
      const rows = db
        .prepare("SELECT * FROM posts WHERE author_email = ? ORDER BY created_at DESC")
        .all(email.toLowerCase()) as Row[];
      return rows.map(toPost);
    },

    /** Published only — safe for any reader. Drafts must never leak here. */
    listPublished(): Post[] {
      const rows = db
        .prepare("SELECT * FROM posts WHERE status = 'published' ORDER BY created_at DESC")
        .all() as Row[];
      return rows.map(toPost);
    },

    /** Published rows for one site section, newest first. */
    listPublishedBySection(section: Section): Post[] {
      const rows = db
        .prepare(
          "SELECT * FROM posts WHERE status = 'published' AND section = ? ORDER BY created_at DESC",
        )
        .all(section) as Row[];
      return rows.map(toPost);
    },

    update(id: number, patch: PostPatch): Post | null {
      const existing = this.get(id);
      if (!existing) return null;

      const body = patch.body === undefined ? existing.body : sanitizeBody(patch.body);
      const title = patch.title ?? existing.title;
      // Re-slug only when the title actually changed, so published URLs stay put
      // through unrelated edits.
      const slug = patch.title && patch.title !== existing.title ? uniqueSlug(title, id) : existing.slug;

      db.prepare(
        `UPDATE posts SET slug=?, section=?, title=?, summary=?, body=?, banner_url=?, fields=?, status=?, updated_at=? WHERE id=?`,
      ).run(
        slug,
        patch.section ?? existing.section,
        title,
        patch.summary ?? existing.summary,
        body,
        patch.bannerUrl ?? existing.bannerUrl,
        JSON.stringify(patch.fields ?? existing.fields),
        patch.status ?? existing.status,
        Date.now(),
        id,
      );
      return this.get(id);
    },

    remove(id: number): boolean {
      return db.prepare("DELETE FROM posts WHERE id = ?").run(id).changes > 0;
    },

    close() {
      db.close();
    },
  };
}

// One shared connection per process. better-sqlite3 is synchronous, so a single
// handle is both correct and fastest; WAL handles concurrent readers.
let shared: IntakeStore | null = null;

export function getStore(): IntakeStore {
  if (!shared) {
    shared = createStore(process.env.INTAKE_DB_PATH || path.join(process.cwd(), "data", "intake.db"));
  }
  return shared;
}
