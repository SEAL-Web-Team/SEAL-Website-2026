"use client";

import type { Section } from "@/lib/intake/sections";
import { Select } from "./Select";

// The extra inputs each site section needs on top of title/summary/banner.
// Values live in one loose `fields` object on the parent; the server re-validates
// them per section on publish.

type Fields = Record<string, unknown>;
type Props = {
  section: Section;
  fields: Fields;
  onChange: (next: Fields) => void;
};

const inputClass =
  "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-slate-200 text-sm placeholder-slate-600 outline-none focus:border-white/20";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
        {label}
      </span>
      {children}
      {hint ? <span className="block text-xs text-slate-600 mt-1">{hint}</span> : null}
    </label>
  );
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

export function SectionFields({ section, fields, onChange }: Props) {
  const set = (key: string, value: unknown) => onChange({ ...fields, [key]: value });

  if (section === "news") {
    const people = Array.isArray(fields.people) ? (fields.people as string[]) : [];
    return (
      <div className="grid gap-4">
        <Field label="Date" hint="Defaults to the month you publish.">
          <input
            className={inputClass}
            value={str(fields.date)}
            onChange={(e) => set("date", e.target.value)}
            placeholder="February 2026"
          />
        </Field>
        <Field label="People" hint="Comma separated.">
          <input
            className={inputClass}
            value={people.join(", ")}
            onChange={(e) =>
              set(
                "people",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            placeholder="Ada Lovelace, Alan Turing"
          />
        </Field>
      </div>
    );
  }

  if (section === "projects") {
    return (
      <Field label="Project link" hint="Where the project lives. Required to publish.">
        <input
          className={inputClass}
          value={str(fields.url)}
          onChange={(e) => set("url", e.target.value)}
          placeholder="https://github.com/uw-seal/…"
        />
      </Field>
    );
  }

  if (section === "publications") {
    return (
      <div className="grid gap-4">
        <Field label="Authors">
          <input
            className={inputClass}
            value={str(fields.authors)}
            onChange={(e) => set("authors", e.target.value)}
            placeholder="A. Mamishev, J. Doe"
          />
        </Field>
        <Field label="Venue">
          <input
            className={inputClass}
            value={str(fields.venue)}
            onChange={(e) => set("venue", e.target.value)}
            placeholder="IEEE Sensors Journal, vol. 24"
          />
        </Field>
        <Field label="Type">
          <Select
            ariaLabel="Publication type"
            value={str(fields.kind) || "journal"}
            options={[
              { value: "journal", label: "Journal" },
              { value: "conference", label: "Conference" },
              { value: "book", label: "Book" },
            ]}
            onChange={(next) => set("kind", next)}
          />
        </Field>
        <Field label="Link" hint="Optional — DOI or publisher page.">
          <input
            className={inputClass}
            value={str(fields.url)}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://doi.org/…"
          />
        </Field>
      </div>
    );
  }

  if (section === "partners") {
    return (
      <Field label="Website" hint="Required to publish.">
        <input
          className={inputClass}
          value={str(fields.website)}
          onChange={(e) => set("website", e.target.value)}
          placeholder="https://example.org"
        />
      </Field>
    );
  }

  // locations
  return (
    <div className="grid gap-4">
      <Field label="Link" hint="Optional.">
        <input
          className={inputClass}
          value={str(fields.link)}
          onChange={(e) => set("link", e.target.value)}
          placeholder="https://…"
        />
      </Field>
      <Field label="Link label">
        <input
          className={inputClass}
          value={str(fields.linkLabel)}
          onChange={(e) => set("linkLabel", e.target.value)}
          placeholder="Take a tour"
        />
      </Field>
    </div>
  );
}
