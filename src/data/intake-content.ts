import "server-only";

import newsJson from "@/data/news.json";
import partnersJson from "@/data/partners.json";
import locationsJson from "@/data/locations.json";
import projectsJson from "@/data/projects.json";
import publicationsJson from "@/data/publications.json";
import { getStore } from "@/lib/intake/store";
import { renderBody } from "@/lib/intake/markdown";
import {
  publicationBucket,
  toLocationRecord,
  toNewsRecord,
  toPartnerRecord,
  toProjectRecord,
  toPublicationRecord,
} from "@/lib/intake/to-section-record";

// Published /intake submissions merged on top of the committed JSON. The static
// files stay the canonical archive and are never rewritten at runtime; anything
// members post lives in SQLite and is folded in here at request time, so the
// pages need no knowledge of where a record came from.
//
// Every getter degrades to the static JSON if the database is unavailable — a
// broken intake DB must never take the public site down.

function published<T>(section: Parameters<ReturnType<typeof getStore>["listPublishedBySection"]>[0], map: (p: never) => T): T[] {
  try {
    return getStore().listPublishedBySection(section).map(map as never);
  } catch (error) {
    console.error(`[intake-content] falling back to static JSON for ${section}:`, error);
    return [];
  }
}

export function getNews() {
  // Every body — editor HTML, hand-written Markdown, or the plain-text bodies
  // already in news.json — is normalized to sanitized HTML here, so the article
  // page has exactly one rendering path and a new .json entry can just use
  // Markdown and display correctly.
  const withHtml = <T extends { body: string }>(item: T) => ({
    ...item,
    bodyHtml: renderBody(item.body),
  });
  // Newest first: intake posts are appended above the archive.
  return [
    ...published("news", toNewsRecord).map(withHtml),
    ...newsJson.map(withHtml),
  ];
}

export function getProjectsWithIntake() {
  return [...projectsJson, ...published("projects", toProjectRecord)];
}

export function getPartners() {
  return [...partnersJson, ...published("partners", toPartnerRecord)];
}

export function getLocations() {
  return {
    ...locationsJson,
    locations: [...locationsJson.locations, ...published("locations", toLocationRecord)],
  };
}

export function getPublications() {
  const extra = { journal: [], conference: [], books: [] } as Record<string, unknown[]>;
  try {
    for (const post of getStore().listPublishedBySection("publications")) {
      extra[publicationBucket(post)].push(toPublicationRecord(post));
    }
  } catch (error) {
    console.error("[intake-content] falling back to static publications:", error);
  }
  return {
    journal: [...extra.journal, ...publicationsJson.journal],
    conference: [...extra.conference, ...publicationsJson.conference],
    // Submitted books have no "type" discriminator, so tag them as complete
    // books to match how books.json is filtered downstream.
    books: [
      ...extra.books.map((b) => ({ ...(b as object), type: "complete" })),
      ...publicationsJson.books,
    ],
  };
}
