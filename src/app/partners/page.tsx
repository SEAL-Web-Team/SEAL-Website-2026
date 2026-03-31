import partners from "@/data/partners.json";

export default function PartnersPage() {
  return (
    <div className="min-h-screen pt-40 pb-28 px-8">
      <div className="max-w-6xl mx-auto">

        <div className="mb-16">
          <h1 className="text-5xl font-bold text-white">Partner Organizations</h1>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {partners.map((p) => (
            <div
              key={p.name}
              className="group relative flex flex-col rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-200 overflow-hidden"
            >
              {p.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-52 object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-200"
                />
              )}
              <div className="flex flex-col flex-1 p-8">
                <h2 className="text-white text-xl font-semibold mb-4">{p.name}</h2>
                <p className="text-slate-400 text-base leading-relaxed flex-1 mb-8">{p.description}</p>
                <a
                  href={p.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-start text-sm font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/30 px-4 py-2 rounded-lg transition-all"
                >
                  Visit website →
                </a>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
