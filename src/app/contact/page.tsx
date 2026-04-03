import contact from "@/data/contact.json";

export default function ContactPage() {
  return (
    <div className="page-shell">
      <div className="page-container">

        <div className="page-header">
          <h1 className="page-title">{contact.page.title}</h1>
          <p className="page-subtitle">{contact.page.subtitle}</p>
        </div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-6">

          {/* Director card */}
          <div className="surface-card overflow-hidden flex flex-col md:flex-row">
            <div className="media-frame w-full md:w-64 aspect-square md:aspect-auto shrink-0 overflow-hidden" style={{ maxHeight: "18rem" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={contact.director.image}
                alt={contact.director.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col gap-6 p-5 sm:p-7 w-full">
              <div>
                <p className="text-sm uppercase tracking-widest text-slate-500 mb-3">{contact.director.eyebrow}</p>
                <p className="text-white text-3xl font-semibold leading-tight">{contact.director.name}</p>
                <p className="text-slate-300 text-lg mt-3">
                  {contact.director.title}
                </p>
              </div>
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={contact.director.emailImage} alt="Email address" className="h-8 w-auto" />
              </div>
            </div>
          </div>

          {/* Address card */}
          <div className="surface-card overflow-hidden p-5 sm:p-7">
            <p className="text-sm uppercase tracking-widest text-slate-500 mb-3">{contact.address.eyebrow}</p>
            <p className="text-white text-3xl font-semibold leading-tight">{contact.address.name}</p>
            <address className="not-italic text-slate-300 text-lg leading-9 mt-3">
              {contact.address.lines.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </address>
          </div>

        </div>
      </div>
    </div>
  );
}
