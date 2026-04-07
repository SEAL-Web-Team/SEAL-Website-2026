"use client";

import Link from "next/link";
import { useLayoutEffect, useState } from "react";

type NewsItem = {
  id: number;
  title: string;
  date: string;
  image?: string | null;
  people: string[];
};

function gridColumnsForViewport(): number {
  if (typeof window === "undefined") return 1;
  if (window.matchMedia("(min-width: 1024px)").matches) return 3;
  if (window.matchMedia("(min-width: 640px)").matches) return 2;
  return 1;
}

export function NewsGrid({
  items,
  actionLabel,
  expandListLabel,
}: {
  items: NewsItem[];
  actionLabel: string;
  expandListLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [previewCount, setPreviewCount] = useState(2);

  useLayoutEffect(() => {
    function sync() {
      setPreviewCount(gridColumnsForViewport() * 2);
    }
    sync();
    const mqLg = window.matchMedia("(min-width: 1024px)");
    const mqSm = window.matchMedia("(min-width: 640px)");
    mqLg.addEventListener("change", sync);
    mqSm.addEventListener("change", sync);
    return () => {
      mqLg.removeEventListener("change", sync);
      mqSm.removeEventListener("change", sync);
    };
  }, []);

  const visible = expanded ? items : items.slice(0, previewCount);
  const showExpand = !expanded && items.length > previewCount;

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.map((item) => (
          <Link
            key={item.id}
            href={`/news/${item.id}`}
            className="surface-card surface-card-hover group overflow-hidden flex flex-col text-left cursor-pointer"
          >
            <div className="media-frame h-44 sm:h-48 shrink-0">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full" />
              )}
            </div>

            <div className="flex flex-col flex-1 p-5 sm:p-6">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-2 shrink-0">{item.date}</p>
              <h2 className="text-white text-sm font-semibold leading-snug mb-3 line-clamp-3 flex-1">
                {item.title}
              </h2>
              {item.people.length > 0 && (
                <p className="text-xs text-slate-500 line-clamp-1 mb-4 shrink-0">{item.people.join(", ")}</p>
              )}
              <span className="action-chip mt-auto self-start text-xs shrink-0">
                <span>{actionLabel}</span>
                <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {showExpand && (
        <div className="flex justify-center mt-10">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="px-6 py-3.5 text-base font-semibold text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all backdrop-blur-sm"
          >
            {expandListLabel}
          </button>
        </div>
      )}
    </>
  );
}
