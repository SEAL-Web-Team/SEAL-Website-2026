import Link from "next/link";
import home from "@/data/home.json";

export default function HomePage() {
  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src={home.hero.videoSrc} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative text-center px-6 max-w-4xl w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={home.hero.uwLogoSrc} alt={home.hero.uwLogoAlt} className="h-20 mx-auto mb-6 brightness-0 invert" />
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
            {home.hero.titleLines[0]}<br className="hidden sm:block" /> {home.hero.titleLines[1]}
          </h1>
          <p className="text-slate-200 text-xl sm:text-2xl max-w-2xl mx-auto leading-relaxed mb-10">
            {home.hero.subtitle}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {home.hero.actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="px-7 py-3.5 text-base font-semibold text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Scroll indicator — bottom center */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-40">
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-white/60" />
          <span className="text-white text-xs uppercase tracking-widest">{home.hero.scrollLabel}</span>
        </div>
      </section>

      {/* ── About ── */}
      <section className="py-24 px-8 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-16 items-start">
            <div>
              <h2 className="text-4xl font-bold text-white leading-tight">{home.about.title}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-6 pt-1">
              {home.about.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-slate-300 text-lg leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SEAL Teams ── */}
      <section className="py-24 px-8 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between mb-16 flex-wrap gap-4">
            <div>
              <h2 className="text-4xl font-bold text-white">{home.teamsSection.title}</h2>
            </div>
            <div className="flex items-center gap-6">
              {home.teamsSection.links.map((link) => (
                <Link key={link.href} href={link.href} className="text-base text-slate-400 hover:text-slate-200 transition-colors">
                  {link.label} →
                </Link>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {home.teamsSection.items.map((team) => (
              <div
                key={team.id}
                className="surface-card surface-card-hover p-7 cursor-default"
              >
                <span className="text-xs font-mono text-slate-600 block mb-5">{team.id}</span>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">{team.name}</p>
                <h3 className="text-white font-semibold text-base mb-3 leading-snug">{team.full}</h3>
                <p className="text-slate-300 text-base leading-relaxed">{team.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Join ── */}
      <section className="py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-white">{home.benefitsSection.title}</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {home.benefitsSection.items.map((b) => (
              <div
                key={b.heading}
                className="surface-card surface-card-hover flex flex-col p-7"
              >
                <h3 className="text-white font-semibold text-lg mb-3 leading-snug">{b.heading}</h3>
                <p className="text-slate-300 text-base leading-relaxed flex-1 mb-6">{b.description}</p>
                <Link
                  href={b.href}
                  className="action-chip self-start"
                >
                  <span>Learn more</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
