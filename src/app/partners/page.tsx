import partners from "@/data/partners.json";

export default function PartnersPage() {
  return (
    <div className="page-shell">
      <div className="page-container">

        <div className="page-header">
          <h1 className="page-title">Partner Organizations</h1>
          <p className="page-subtitle">Industry, government, and academic organizations collaborating with SEAL Lab.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {partners.map((p) => (
            <div
              key={p.name}
              className="surface-card surface-card-hover group flex flex-col overflow-hidden"
            >
              {p.image && (
                <div className="media-frame h-52 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="flex flex-col flex-1 p-8">
                <h2 className="text-white text-xl font-semibold mb-4">{p.name}</h2>
                <p className="text-slate-300 text-base leading-relaxed flex-1 mb-8">{p.description}</p>
                <a
                  href={p.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-chip self-start"
                >
                  <span>Visit website</span>
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
