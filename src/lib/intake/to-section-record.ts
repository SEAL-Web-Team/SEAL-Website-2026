import type { Post } from "./store";
import { isSafeUrl, type Section } from "./sections";

// Turns a stored submission into the exact record shape each section's page
// already renders, so pages can concatenate these with their static JSON and
// need no other changes.

export type NewsRecord = {
  id: number;
  title: string;
  date: string;
  image: string | null;
  people: string[];
  body: string;
  links: { label: string; url: string }[];
  /** Marks rows that came from /intake rather than news.json. */
  fromIntake: true;
};

export type ProjectRecord = {
  name: string;
  slug: string;
  description: string;
  image: string;
  url: string;
  fromIntake: true;
};

export type PublicationRecord = {
  authors: string;
  title: string;
  venue: string;
  url: string | null;
  bibtex: string | null;
  endnote: string | null;
  fromIntake: true;
};

export type PartnerRecord = {
  name: string;
  description: string;
  image: string;
  website: string;
  fromIntake: true;
};

export type LocationRecord = {
  name: string;
  image: string;
  description: string;
  link: string | null;
  linkLabel: string | null;
  fromIntake: true;
};

const f = (post: Post) => (post.fields ?? {}) as Record<string, unknown>;
const str = (v: unknown, fallback = "") => (typeof v === "string" && v ? v : fallback);

/**
 * Defense in depth for anything rendered into an `href`.
 *
 * Write-time validation only protects rows written *after* it existed. Rows
 * already in the database (or inserted by any future path that skips the
 * schema) would still render, so drop unsafe schemes here too — the mapper is
 * the single choke point every public page goes through.
 */
const href = (v: unknown): string => {
  const value = str(v);
  return isSafeUrl(value) ? value : "";
};

/** "February 2026" — the format news.json already uses for its date strings. */
function monthYear(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function toNewsRecord(post: Post): NewsRecord {
  const raw = f(post);
  return {
    // News ids come from the legacy WordPress export and collide with our small
    // autoincrement ids, so offset intake rows into their own high range.
    id: INTAKE_ID_OFFSET + post.id,
    title: post.title,
    date: str(raw.date) || monthYear(post.createdAt),
    image: post.bannerUrl || null,
    people: Array.isArray(raw.people) ? (raw.people as string[]) : [],
    body: post.body,
    // Drop any stored link whose scheme isn't http(s).
    links: Array.isArray(raw.links)
      ? (raw.links as { label: string; url: string }[]).filter((l) => isSafeUrl(l?.url))
      : [],
    fromIntake: true,
  };
}

export function toProjectRecord(post: Post): ProjectRecord {
  return {
    name: post.title,
    slug: post.slug,
    description: post.summary,
    image: post.bannerUrl,
    url: href(f(post).url),
    fromIntake: true,
  };
}

export function toPublicationRecord(post: Post): PublicationRecord {
  const raw = f(post);
  return {
    authors: str(raw.authors),
    title: post.title,
    venue: str(raw.venue),
    url: href(raw.url) || null,
    bibtex: null,
    endnote: null,
    fromIntake: true,
  };
}

export function toPartnerRecord(post: Post): PartnerRecord {
  return {
    name: post.title,
    description: post.summary,
    image: post.bannerUrl,
    website: href(f(post).website),
    fromIntake: true,
  };
}

export function toLocationRecord(post: Post): LocationRecord {
  const raw = f(post);
  return {
    name: post.title,
    image: post.bannerUrl,
    description: post.summary,
    link: href(raw.link) || null,
    linkLabel: str(raw.linkLabel) || null,
    fromIntake: true,
  };
}

/** Keeps intake news ids clear of the legacy WordPress id range. */
export const INTAKE_ID_OFFSET = 1_000_000;

/** True for a news id produced by toNewsRecord. */
export const isIntakeNewsId = (id: number) => id > INTAKE_ID_OFFSET;

/** Which publication bucket a submission belongs in. */
export function publicationBucket(post: Post): "journal" | "conference" | "books" {
  const kind = str(f(post).kind, "journal");
  return kind === "conference" ? "conference" : kind === "book" ? "books" : "journal";
}

export const SECTION_MAPPERS = {
  news: toNewsRecord,
  projects: toProjectRecord,
  publications: toPublicationRecord,
  partners: toPartnerRecord,
  locations: toLocationRecord,
} satisfies Record<Section, (post: Post) => { fromIntake: true }>;
