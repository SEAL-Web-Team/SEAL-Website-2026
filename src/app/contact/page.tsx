import contact from "@/data/contact.json";

export default function ContactPage() {
  const mapsQuery = encodeURIComponent(
    [contact.address.name, ...contact.address.lines].join(", ")
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const mapsEmbedUrl = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;

  return (
    <div className="page-shell">
      <div className="page-container">

        <div className="page-header">
          <h1 className="page-title">{contact.page.title}</h1>
          <p className="page-subtitle">{contact.page.subtitle}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">

          {/* Director card */}
          <div className="surface-card overflow-hidden flex flex-col">
            <div className="media-frame aspect-[4/3] shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={contact.director.image}
                alt={contact.director.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="h-px bg-white/[0.06]" />
            <div className="flex flex-col flex-1 p-6 sm:p-8">
              <p className="text-sm uppercase tracking-widest text-slate-500 mb-3">{contact.director.eyebrow}</p>
              <p className="text-[#f1f3f9] text-2xl sm:text-3xl font-semibold leading-tight">{contact.director.name}</p>
              <p className="text-slate-400 text-base sm:text-lg mt-3 leading-relaxed flex-1">
                {contact.director.title}
              </p>
              <a
                href={`mailto:${contact.director.email}`}
                className="inline-block w-fit mt-6 opacity-90 hover:opacity-100 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={contact.director.emailImage} alt={contact.director.email} className="h-7 w-auto" />
              </a>
            </div>
          </div>

          {/* Address card */}
          <div className="surface-card overflow-hidden flex flex-col">
            <div className="media-frame aspect-[4/3] shrink-0 overflow-hidden">
              <iframe
                title={`Map to ${contact.address.name}`}
                src={mapsEmbedUrl}
                className="w-full h-full"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <div className="h-px bg-white/[0.06]" />
            <div className="flex flex-col flex-1 p-6 sm:p-8">
              <p className="text-sm uppercase tracking-widest text-slate-500 mb-3">{contact.address.eyebrow}</p>
              <p className="text-[#f1f3f9] text-2xl sm:text-3xl font-semibold leading-tight">{contact.address.name}</p>
              <address className="not-italic text-slate-400 text-base sm:text-lg leading-relaxed mt-3 flex-1">
                {contact.address.lines.map((line) => (
                  <span key={line}>
                    {line}
                    <br />
                  </span>
                ))}
              </address>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="action-chip mt-6 self-start text-xs"
              >
                <span>Get Directions</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
