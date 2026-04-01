"use client";

import { useState, useEffect } from "react";
import news from "@/data/news.json";

type NewsItem = typeof news[number];

function Modal({ item, onClose }: { item: NewsItem; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0e0a14] border border-white/[0.08] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-slate-400 hover:text-white bg-black/40 hover:bg-black/60 border border-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-all text-base leading-none"
          aria-label="Close"
        >
          ×
        </button>

        {item.image && (
          <div className="h-72 bg-black/30 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
          </div>
        )}

        <div className="p-8">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">{item.date}</p>
          <h2 className="text-white text-2xl font-semibold leading-snug mb-2">{item.title}</h2>
          {item.people.length > 0 && (
            <p className="text-sm text-slate-400 mb-6">{item.people.join(", ")}</p>
          )}

          <div className="border-t border-white/[0.06] pt-6 text-slate-300 text-base leading-relaxed space-y-4">
            {item.body.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {item.links.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/[0.06]">
              {item.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/30 px-4 py-2 rounded-lg transition-all"
                >
                  {link.label} →
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewsPage() {
  const [selected, setSelected] = useState<NewsItem | null>(null);

  return (
    <div className="min-h-screen pt-40 pb-28 px-8">
      <div className="max-w-6xl mx-auto">

        <div className="mb-16">
          <h1 className="text-5xl font-bold text-white">News &amp; Awards</h1>
          <p className="text-slate-400 text-lg mt-4">Latest highlights, recognitions, and milestones from the SEAL Lab community.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="group rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden flex flex-col text-left hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-200 cursor-pointer"
            >
              {/* Fixed-height image box */}
              <div className="h-48 bg-black/20 flex items-center justify-center shrink-0">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>

              {/* Card content */}
              <div className="flex flex-col flex-1 p-6">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2 shrink-0">{item.date}</p>
                <h2 className="text-white text-sm font-semibold leading-snug mb-3 line-clamp-3 flex-1">
                  {item.title}
                </h2>
                {item.people.length > 0 && (
                  <p className="text-xs text-slate-400 line-clamp-1 mb-4 shrink-0">{item.people.join(", ")}</p>
                )}
                <span className="mt-auto self-start text-xs font-semibold text-slate-400 group-hover:text-white border border-white/10 group-hover:border-white/30 px-3 py-1.5 rounded-lg transition-all shrink-0">
                  View More →
                </span>
              </div>
            </button>
          ))}
        </div>

      </div>

      {selected && <Modal item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
