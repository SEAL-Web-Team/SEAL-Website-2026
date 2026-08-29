import { describe, expect, it } from "vitest";
import {
  SECTIONS,
  SECTION_HELP,
  SECTION_LABELS,
  SECTION_USES,
  parseSectionFields,
} from "./sections";

describe("section registry", () => {
  it("has a label, help text and usage flags for every section", () => {
    for (const s of SECTIONS) {
      expect(SECTION_LABELS[s], `label for ${s}`).toBeTruthy();
      expect(SECTION_HELP[s], `help for ${s}`).toBeTruthy();
      expect(SECTION_USES[s], `uses for ${s}`).toBeTruthy();
    }
  });

  it("only gives news a rich-text body", () => {
    expect(SECTION_USES.news.body).toBe(true);
    for (const s of SECTIONS.filter((x) => x !== "news")) {
      expect(SECTION_USES[s].body, `${s} should not use a body`).toBe(false);
    }
  });
});

describe("parseSectionFields — news", () => {
  it("accepts empty fields and defaults them", () => {
    const r = parseSectionFields("news", {});
    expect(r.success).toBe(true);
    expect(r.success && r.data).toMatchObject({ date: "", people: [], links: [] });
  });

  it("keeps people and links", () => {
    const r = parseSectionFields("news", {
      date: "February 2026",
      people: ["Ada", "Alan"],
      links: [{ label: "Paper", url: "https://uw.edu/p" }],
    });
    expect(r.success && r.data.people).toEqual(["Ada", "Alan"]);
  });

  it("rejects a link with a bad URL", () => {
    const r = parseSectionFields("news", { links: [{ label: "x", url: "not-a-url" }] });
    expect(r.success).toBe(false);
  });
});

describe("parseSectionFields — projects", () => {
  it("requires a link", () => {
    const r = parseSectionFields("projects", {});
    expect(r.success).toBe(false);
    expect(!r.success && r.error).toMatch(/link/i);
  });

  it("rejects a non-URL link", () => {
    expect(parseSectionFields("projects", { url: "github.com/x" }).success).toBe(false);
  });

  it("accepts a valid link", () => {
    expect(parseSectionFields("projects", { url: "https://github.com/x" }).success).toBe(true);
  });
});

describe("parseSectionFields — publications", () => {
  const ok = { authors: "A. Mamishev", venue: "IEEE Sensors" };

  it("requires authors and venue", () => {
    expect(parseSectionFields("publications", {}).success).toBe(false);
    expect(parseSectionFields("publications", { authors: "A" }).success).toBe(false);
    expect(parseSectionFields("publications", { venue: "V" }).success).toBe(false);
  });

  it("accepts the minimum and defaults kind to journal", () => {
    const r = parseSectionFields("publications", ok);
    expect(r.success && r.data.kind).toBe("journal");
  });

  it.each(["journal", "conference", "book"])("accepts kind=%s", (kind) => {
    expect(parseSectionFields("publications", { ...ok, kind }).success).toBe(true);
  });

  it("rejects an unknown kind", () => {
    expect(parseSectionFields("publications", { ...ok, kind: "zine" }).success).toBe(false);
  });

  it("treats an empty url as absent", () => {
    expect(parseSectionFields("publications", { ...ok, url: "" }).success).toBe(true);
  });
});

describe("parseSectionFields — partners and locations", () => {
  it("partners require a website", () => {
    expect(parseSectionFields("partners", {}).success).toBe(false);
    expect(parseSectionFields("partners", { website: "https://x.org" }).success).toBe(true);
  });

  it("locations accept nothing at all", () => {
    expect(parseSectionFields("locations", {}).success).toBe(true);
  });

  it("locations reject a malformed link", () => {
    expect(parseSectionFields("locations", { link: "nope" }).success).toBe(false);
  });
});

describe("parseSectionFields — unknown section", () => {
  it("fails closed", () => {
    // @ts-expect-error deliberately invalid
    expect(parseSectionFields("blog", {}).success).toBe(false);
  });
});
