import { getLocations } from "@/data/intake-content";
import locationPage from "@/data/locations-page.json";

// Reads published /intake submissions from SQLite at request time, so this
// page must not be prerendered — a static build would freeze the list at
// build time and never show anything members post.
export const dynamic = "force-dynamic";

export default function LocationsPage() {
  return (
    <div className="page-shell">
      <div className="page-container">

        <div className="page-header">
          <h1 className="page-title">{locationPage.page.title}</h1>
          <p className="page-subtitle">{locationPage.page.subtitle}</p>
        </div>

        {/* Campus Map */}
        <div className="surface-card mb-14 sm:mb-20 overflow-hidden">
          <iframe
            title={locationPage.map.title}
            src={locationPage.map.url}
            className="h-[55svh] min-h-[20rem] sm:h-[560px] w-full bg-black/20"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>

        {/* Location grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {getLocations().locations.map((loc, i) => (
            <div
              key={`${loc.name}-${i}`}
              className="surface-card surface-card-hover overflow-hidden flex flex-col"
            >
              {/* Image */}
              <div className="media-frame h-48 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={loc.image}
                  alt={loc.name}
                  className="w-full h-full object-cover"
                  style={loc.name === "SEAL Avionics" ? { objectPosition: "center 30%" } : undefined}
                />
              </div>

              <div className="h-px bg-white/[0.06]" />

              {/* Content */}
              <div className="flex flex-col flex-1 p-5 sm:p-6">
                <h2 className="text-[#f1f3f9] font-semibold text-base leading-snug mb-3">
                  {loc.name}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed flex-1">
                  {loc.description}
                </p>
                {loc.link && (
                  <a
                    href={loc.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-chip mt-5 self-start text-xs"
                  >
                    <span>{loc.linkLabel}</span>
                    <span aria-hidden="true">→</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
