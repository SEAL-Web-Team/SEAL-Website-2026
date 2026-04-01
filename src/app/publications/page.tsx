'use client'

import { useState } from "react";
import publications from "@/data/publications.json";

type Publication = {
  authors: string;
  title: string;
  venue: string;
  url: string | null;
  bibtex: string | null;
  endnote: string | null;
  type?: string;
};

function PubRow({ pub, index }: { pub: Publication; index: number }) {
  return (
    <div className="flex gap-5 py-5 border-b border-white/[0.06] last:border-b-0">
      {/* Index */}
      <div className="w-8 shrink-0 text-right text-slate-600 text-sm tabular-nums pt-0.5 select-none">
        {index}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {pub.url ? (
          <a
            href={pub.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-medium text-[0.9375rem] leading-snug hover:text-slate-200 transition-colors duration-150 break-words"
          >
            {pub.title}
          </a>
        ) : (
          <span className="text-white font-medium text-[0.9375rem] leading-snug break-words">
            {pub.title}
          </span>
        )}
        <p className="text-slate-400 text-sm mt-1 leading-snug">{pub.authors}</p>
        <p className="text-slate-500 text-sm italic mt-0.5 leading-snug">{pub.venue}</p>
      </div>

      {/* Citation pills */}
      {(pub.bibtex || pub.endnote) && (
        <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
          {pub.bibtex && (
            <a
              href={pub.bibtex}
              download
              className="text-xs font-medium text-slate-400 bg-white/[0.04] border border-white/[0.08] rounded-md px-2.5 py-1 hover:text-white hover:border-white/20 hover:bg-white/[0.07] transition-all duration-150 whitespace-nowrap"
            >
              BibTeX
            </a>
          )}
          {pub.endnote && (
            <a
              href={pub.endnote}
              download
              className="text-xs font-medium text-slate-400 bg-white/[0.04] border border-white/[0.08] rounded-md px-2.5 py-1 hover:text-white hover:border-white/20 hover:bg-white/[0.07] transition-all duration-150 whitespace-nowrap"
            >
              EndNote
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  shown,
  total,
  open,
  onToggle,
}: {
  title: string;
  shown: number;
  total: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-3 w-full text-left group mb-8"
    >
      <h2 className="text-white text-xl font-semibold group-hover:text-slate-200 transition-colors">{title}</h2>
      <span className="text-xs font-medium text-slate-400 bg-white/[0.06] border border-white/[0.08] rounded-full px-2.5 py-0.5 tabular-nums">
        {shown}/{total}
      </span>
      <span className="ml-auto text-slate-500 group-hover:text-slate-300 transition-colors text-sm">
        {open ? "−" : "+"}
      </span>
    </button>
  );
}

export default function PublicationsPage() {
  const [query, setQuery] = useState("");
  const [openJournal, setOpenJournal] = useState(true);
  const [openConference, setOpenConference] = useState(true);
  const [openBooks, setOpenBooks] = useState(true);
  const [openChapters, setOpenChapters] = useState(true);

  const journal: Publication[] = publications.journal;
  const conference: Publication[] = publications.conference;
  const books = publications.books;
  const completeBooks = books.filter((b) => b.type === "complete");
  const chapters = books.filter((b) => b.type === "chapter");

  const q = query.trim().toLowerCase();

  const filteredCompleteBooks = q
    ? completeBooks.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.toLowerCase().includes(q)
      )
    : completeBooks;

  const filteredChapters = q
    ? chapters.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.toLowerCase().includes(q)
      )
    : chapters;

  const filteredJournal = q
    ? journal.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.toLowerCase().includes(q)
      )
    : journal;

  const filteredConference = q
    ? conference.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.toLowerCase().includes(q)
      )
    : conference;

  return (
    <div className="min-h-screen pt-40 pb-28 px-8">
      <div className="max-w-4xl mx-auto">

        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white">Publications</h1>
          <p className="text-slate-400 text-lg mt-4">
            Peer-reviewed journal articles and conference papers from SEAL Lab research spanning sensors, electrostatics, power systems, and more.
          </p>
        </div>

        {/* Global search */}
        <div className="mb-12">
          <input
            type="text"
            placeholder="Search by title or authors…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 outline-none focus:border-white/20"
          />
        </div>

        {/* Journal Publications */}
        <section className="mb-12">
          <SectionHeader title="Journal Publications" shown={filteredJournal.length} total={journal.length} open={openJournal} onToggle={() => setOpenJournal((v) => !v)} />
          {openJournal && (
            <div className="flex flex-col mb-8">
              {filteredJournal.map((pub, idx) => (
                <PubRow key={`journal-${idx}`} pub={pub} index={q ? journal.indexOf(pub) + 1 : idx + 1} />
              ))}
              {filteredJournal.length === 0 && <p className="text-slate-500 text-sm py-8 text-center">No journal publications match your search.</p>}
            </div>
          )}
        </section>

        {/* Conference Publications */}
        <section className="mb-12">
          <SectionHeader title="Conference Publications" shown={filteredConference.length} total={conference.length} open={openConference} onToggle={() => setOpenConference((v) => !v)} />
          {openConference && (
            <div className="flex flex-col mb-8">
              {filteredConference.map((pub, idx) => (
                <PubRow key={`conf-${idx}`} pub={pub} index={q ? conference.indexOf(pub) + 1 : idx + 1} />
              ))}
              {filteredConference.length === 0 && <p className="text-slate-500 text-sm py-8 text-center">No conference publications match your search.</p>}
            </div>
          )}
        </section>

        {/* Books */}
        <section className="mb-12">
          <SectionHeader title="Complete Books" shown={filteredCompleteBooks.length} total={completeBooks.length} open={openBooks} onToggle={() => setOpenBooks((v) => !v)} />
          {openBooks && (
            <div className="flex flex-col mb-8">
              {filteredCompleteBooks.map((pub, idx) => (
                <PubRow key={`book-${idx}`} pub={pub} index={idx + 1} />
              ))}
              {filteredCompleteBooks.length === 0 && <p className="text-slate-500 text-sm py-8 text-center">No books match your search.</p>}
            </div>
          )}
        </section>

        {/* Book Chapters */}
        <section className="mb-12">
          <SectionHeader title="Book Chapters" shown={filteredChapters.length} total={chapters.length} open={openChapters} onToggle={() => setOpenChapters((v) => !v)} />
          {openChapters && (
            <div className="flex flex-col mb-8">
              {filteredChapters.map((pub, idx) => (
                <PubRow key={`chapter-${idx}`} pub={pub} index={idx + 1} />
              ))}
              {filteredChapters.length === 0 && <p className="text-slate-500 text-sm py-8 text-center">No book chapters match your search.</p>}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
