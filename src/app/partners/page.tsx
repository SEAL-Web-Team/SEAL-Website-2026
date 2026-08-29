import { getPartners } from "@/data/intake-content";
import pageCopy from "@/data/page-copy.json";

// Reads published /intake submissions from SQLite at request time, so this
// page must not be prerendered — a static build would freeze the list at
// build time and never show anything members post.
export const dynamic = "force-dynamic";

export default function PartnersPage() {
  return (
    <div className="page-shell">
      <div className="page-container">

        <div className="page-header">
          <h1 className="page-title">{pageCopy.partners.title}</h1>
          <p className="page-subtitle">{pageCopy.partners.subtitle}</p>
        </div>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          {getPartners().map((p, i) => (
            <div
              key={`${p.name}-${i}`}
              className="surface-card surface-card-hover group flex flex-col overflow-hidden"
            >
              {p.image && (
                <div className="media-frame h-44 sm:h-52 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="card-media-image"
                  />
                </div>
              )}
              <div className="flex flex-col flex-1 p-5 sm:p-8">
                <h2 className="text-[#f1f3f9] text-xl font-semibold mb-4">{p.name}</h2>
                <p className="text-slate-400 text-base leading-relaxed flex-1 mb-8">{p.description}</p>
                <a
                  href={p.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-chip self-start"
                >
                  <span>{pageCopy.partners.actionLabel}</span>
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
