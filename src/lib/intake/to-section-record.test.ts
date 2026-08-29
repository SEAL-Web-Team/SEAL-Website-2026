import { describe, expect, it } from "vitest";
import type { Post } from "./store";
import {
  INTAKE_ID_OFFSET,
  isIntakeNewsId,
  publicationBucket,
  toLocationRecord,
  toNewsRecord,
  toPartnerRecord,
  toProjectRecord,
  toPublicationRecord,
} from "./to-section-record";

const base: Post = {
  id: 7,
  slug: "a-post",
  section: "news",
  title: "A Post",
  summary: "The summary.",
  body: "<p>Body</p>",
  bannerUrl: "/uploads/intake/x.png",
  fields: {},
  status: "published",
  authorEmail: "a@uw.edu",
  authorName: "A",
  createdAt: Date.UTC(2026, 1, 15),
  updatedAt: Date.UTC(2026, 1, 15),
};

const post = (over: Partial<Post> = {}): Post => ({ ...base, ...over });

describe("toNewsRecord", () => {
  it("maps to the news.json shape", () => {
    const r = toNewsRecord(post({ fields: { date: "February 2026", people: ["Ada"] } }));
    expect(r).toMatchObject({
      title: "A Post",
      date: "February 2026",
      image: "/uploads/intake/x.png",
      people: ["Ada"],
      body: "<p>Body</p>",
      fromIntake: true,
    });
  });

  it("derives a month-year date when none is given", () => {
    expect(toNewsRecord(post()).date).toBe("February 2026");
  });

  it("offsets the id clear of the legacy WordPress range", () => {
    // news.json ids are ~9800; a raw id of 7 would collide with nothing today but
    // could once the archive grows, and would break /news/7 routing.
    const r = toNewsRecord(post({ id: 7 }));
    expect(r.id).toBe(INTAKE_ID_OFFSET + 7);
    expect(isIntakeNewsId(r.id)).toBe(true);
    expect(isIntakeNewsId(9859)).toBe(false);
  });

  it("uses null for a missing banner so the grid can skip the image", () => {
    expect(toNewsRecord(post({ bannerUrl: "" })).image).toBeNull();
  });

  it("defaults people and links to arrays when fields are junk", () => {
    const r = toNewsRecord(post({ fields: { people: "not an array", links: 5 } }));
    expect(r.people).toEqual([]);
    expect(r.links).toEqual([]);
  });
});

describe("toProjectRecord", () => {
  it("maps to the projects.json shape", () => {
    const r = toProjectRecord(
      post({ section: "projects", fields: { url: "https://github.com/x" } }),
    );
    expect(r).toEqual({
      name: "A Post",
      slug: "a-post",
      description: "The summary.",
      image: "/uploads/intake/x.png",
      url: "https://github.com/x",
      fromIntake: true,
    });
  });
});

describe("toPublicationRecord", () => {
  it("maps to the publications.json shape", () => {
    const r = toPublicationRecord(
      post({
        section: "publications",
        fields: { authors: "A. M.", venue: "IEEE", url: "https://doi.org/1" },
      }),
    );
    expect(r).toMatchObject({
      authors: "A. M.",
      title: "A Post",
      venue: "IEEE",
      url: "https://doi.org/1",
      // Submitted papers have no uploaded citation files.
      bibtex: null,
      endnote: null,
    });
  });

  it("nulls an absent url so PubRow renders plain text", () => {
    expect(toPublicationRecord(post({ fields: { authors: "A", venue: "V" } })).url).toBeNull();
  });
});

describe("publicationBucket", () => {
  it.each([
    ["journal", "journal"],
    ["conference", "conference"],
    ["book", "books"],
  ])("routes kind=%s to %s", (kind, bucket) => {
    expect(publicationBucket(post({ fields: { kind } }))).toBe(bucket);
  });

  it("defaults to journal for a missing or unknown kind", () => {
    expect(publicationBucket(post({ fields: {} }))).toBe("journal");
    expect(publicationBucket(post({ fields: { kind: "zine" } }))).toBe("journal");
  });
});

describe("toPartnerRecord / toLocationRecord", () => {
  it("maps partners to the partners.json shape", () => {
    const r = toPartnerRecord(post({ fields: { website: "https://x.org" } }));
    expect(r).toEqual({
      name: "A Post",
      description: "The summary.",
      image: "/uploads/intake/x.png",
      website: "https://x.org",
      fromIntake: true,
    });
  });

  it("maps locations, nulling an empty link so the card hides the button", () => {
    const r = toLocationRecord(post({ fields: {} }));
    expect(r.link).toBeNull();
    expect(r.linkLabel).toBeNull();
  });

  it("keeps a location link and label", () => {
    const r = toLocationRecord(post({ fields: { link: "https://x.org", linkLabel: "Tour" } }));
    expect(r).toMatchObject({ link: "https://x.org", linkLabel: "Tour" });
  });
});
