import Link from "next/link";

const teams = [
  {
    id: "01", name: "ITAC", full: "Industrial Training and Assessment Center",
    description: "Energy assessments and technical solutions for industrial efficiency and sustainability.",
    color: "bg-amber-400", text: "text-amber-400",
  },
  {
    id: "02", name: "Plasma", full: "High Voltage Plasma Research",
    description: "High-voltage plasma R&D with applications in medical devices, filtration, avionics, and satellites.",
    color: "bg-violet-400", text: "text-violet-400",
  },
  {
    id: "03", name: "Biz/Tech", full: "Business & Technology",
    description: "Spin-off formation, grant proposals, scholarship coordination, and lab commercialization.",
    color: "bg-emerald-400", text: "text-emerald-400",
  },
  {
    id: "04", name: "Embedded", full: "Embedded Systems & Instrumentation",
    description: "Sensor design, weak-signal detection, and signal processing across agriculture, scientific measurement, and environmental monitoring.",
    color: "bg-cyan-400", text: "text-cyan-400",
  },
  {
    id: "05", name: "Sudoku", full: "DevOps & Software Engineering",
    description: "Software platforms, web systems, apps, scripts, and media production.",
    color: "bg-pink-400", text: "text-pink-400",
  },
  {
    id: "06", name: "Teaching", full: "Education & Teaching Tools",
    description: "Novel teaching tools and curricula, deployed in UW courses and institutions worldwide.",
    color: "bg-sky-400", text: "text-sky-400",
  },
];

const benefits = [
  {
    heading: "Earn Academic Credit",
    description: "Take on 1–3 credits while shipping real work on active projects. Flexible commitment, real output.",
    href: "/apply",
    accent: "from-purple-500 to-violet-700",
    border: "border-purple-500/20",
    tag: "text-purple-400",
    label: "Academic",
  },
  {
    heading: "Do Real Research",
    description: "Get hands-on with graduate-level work at one of the world's top public research universities.",
    href: "/projects",
    accent: "from-emerald-500 to-teal-600",
    border: "border-emerald-500/20",
    tag: "text-emerald-400",
    label: "Research",
  },
  {
    heading: "Build Your Resume",
    description: "You learn by doing. Every project teaches something concrete and demonstrable.",
    href: "/apply",
    accent: "from-sky-500 to-blue-600",
    border: "border-sky-500/20",
    tag: "text-sky-400",
    label: "Career",
  },
  {
    heading: "Publish and Win Scholarships",
    description: "SEAL actively supports students pursuing publications and scholarships — especially valuable for anyone with graduate school in mind.",
    href: "/publications",
    accent: "from-amber-500 to-orange-600",
    border: "border-amber-500/20",
    tag: "text-amber-400",
    label: "Growth",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/uw%20cherry%20blossom%20footage.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative text-center px-6 max-w-4xl w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/UW.svg" alt="University of Washington" className="h-20 mx-auto mb-6 brightness-0 invert" />
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
            Sensors, Energy, and<br className="hidden sm:block" /> Automation Laboratory
          </h1>
          <p className="text-slate-200 text-xl sm:text-2xl max-w-2xl mx-auto leading-relaxed mb-10">
            Engineering research that moves from lab bench to real-world impact —
            in medicine, defense, avionics, energy, and beyond.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/projects"
              className="px-7 py-3.5 text-base font-semibold text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              Our Research
            </Link>
            <Link
              href="/contact"
              className="px-7 py-3.5 text-base font-semibold text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              Work With Us
            </Link>
            <Link
              href="/apply"
              className="px-7 py-3.5 text-base font-semibold text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              Apply Now
            </Link>
          </div>
        </div>

        {/* Scroll indicator — bottom center */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-40">
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-white/60" />
          <span className="text-white text-xs uppercase tracking-widest">Scroll</span>
        </div>
      </section>

      {/* ── About ── */}
      <section className="relative py-28 px-8 border-b border-white/[0.06] overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-purple-700/10 blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-16 items-start">
            <div>
              <p className="text-sm uppercase tracking-widest text-purple-400 mb-4">About</p>
              <h2 className="text-4xl font-bold text-white leading-tight">Who we are</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-6 pt-1">
              <p className="text-slate-200 text-lg leading-relaxed">
                A UW engineering research lab at the crossroads of sensors, energy, and
                automation. We take on hard problems in medicine, avionics, wearable tech,
                defense, and sustainability — and see them through to real-world application.
                Associates have gone on to found startups, publish research, and land roles
                at top companies.
              </p>
              <p className="text-slate-400 text-lg leading-relaxed">
                The lab runs like a giant RPG: quests, battlestations, squads, a sandbox
                for newcomers, and mission-critical teams for high performers. We&apos;re always
                open to motivated people — experience is welcome, but never required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEAL Teams ── */}
      <section className="relative py-28 px-8 border-b border-white/[0.06] overflow-hidden">
        <div className="absolute top-1/2 -left-48 w-[600px] h-[600px] rounded-full bg-indigo-800/10 blur-[140px] pointer-events-none -translate-y-1/2" />
        <div className="max-w-6xl mx-auto relative">
          <div className="flex items-baseline justify-between mb-16 flex-wrap gap-4">
            <div>
              <p className="text-sm uppercase tracking-widest text-purple-400 mb-4">Capabilities</p>
              <h2 className="text-4xl font-bold text-white">SEAL Teams</h2>
            </div>
            <Link href="/projects" className="text-base text-slate-400 hover:text-slate-200 transition-colors">
              All projects &amp; publications →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="relative group p-7 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-200 overflow-hidden cursor-default"
              >
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${team.color.replace("bg-", "from-")} to-transparent`} />
                <div className="flex items-start justify-between mb-5">
                  <span className="text-xs font-mono text-slate-500">{team.id}</span>
                  <div className={`w-2 h-2 rounded-full ${team.color} opacity-80`} />
                </div>
                <p className={`text-xs font-semibold uppercase tracking-widest ${team.text} mb-2`}>{team.name}</p>
                <h3 className="text-white font-semibold text-base mb-3 leading-snug">{team.full}</h3>
                <p className="text-slate-400 text-base leading-relaxed">{team.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Join ── */}
      <section className="relative py-28 px-8 overflow-hidden">
        <div className="absolute -bottom-24 right-0 w-[500px] h-[500px] rounded-full bg-violet-700/10 blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <div className="mb-16">
            <p className="text-sm uppercase tracking-widest text-purple-400 mb-4">Students</p>
            <h2 className="text-4xl font-bold text-white">Why join SEAL?</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((b) => (
              <div
                key={b.heading}
                className={`relative flex flex-col p-7 rounded-2xl border ${b.border} bg-white/[0.02] hover:bg-white/[0.04] transition-all overflow-hidden`}
              >
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${b.accent}`} />
                <p className={`text-xs uppercase tracking-widest ${b.tag} mb-4`}>{b.label}</p>
                <h3 className="text-white font-semibold text-lg mb-3 leading-snug">{b.heading}</h3>
                <p className="text-slate-300 text-base leading-relaxed flex-1 mb-6">{b.description}</p>
                <Link
                  href={b.href}
                  className={`self-start text-base font-semibold bg-gradient-to-r ${b.accent} bg-clip-text text-transparent hover:opacity-80 transition-opacity`}
                >
                  Learn more →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
