import data from "@/data/locations.json";

export default function LocationsPage() {
  return (
    <div className="min-h-screen pt-40 pb-28 px-8">
      <div className="max-w-5xl mx-auto">

        <div className="mb-16">
          <h1 className="text-5xl font-bold text-white">Lab Locations</h1>
          <p className="text-slate-400 text-lg mt-4">
            SEAL Lab operates across multiple dedicated spaces in the University of Washington campus, each tailored to specific research needs.
          </p>
        </div>

        {/* Campus Map */}
        <div className="mb-20 rounded-2xl overflow-hidden border border-white/[0.06] bg-black/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.mapImage}
            alt="SEAL Lab campus map"
            className="w-full object-contain"
          />
        </div>

        {/* Location grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.locations.map((loc) => (
            <div
              key={loc.name}
              className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden flex flex-col"
            >
              {/* Image */}
              <div className="h-48 bg-black/20 flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={loc.image}
                  alt={loc.name}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="h-px bg-white/[0.06]" />

              {/* Content */}
              <div className="flex flex-col flex-1 p-6">
                <h2 className="text-white font-semibold text-base leading-snug mb-3">
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
                    className="mt-5 self-start text-xs font-medium text-slate-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-all"
                  >
                    {loc.linkLabel} →
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
