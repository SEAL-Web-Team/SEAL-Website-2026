import Link from "next/link";

const teams = [
  {
    id: "01", name: "ITAC", full: "Industrial Training & Assessment Center",
    description: "Technical solutions for energy efficiency and industrial sustainability.",
    color: "bg-amber-400", text: "text-amber-400", glow: "shadow-amber-500/20",
  },
  {
    id: "02", name: "Plasma", full: "High Voltage Plasma Research",
    description: "Plasma technology for medical devices, filters, avionics, and satellites.",
    color: "bg-violet-400", text: "text-violet-400", glow: "shadow-violet-500/20",
  },
  {
    id: "03", name: "Biz/Tech", full: "Business & Technology",
    description: "University spin-offs, proposal writing, scholarships, and commercialization.",
    color: "bg-emerald-400", text: "text-emerald-400", glow: "shadow-emerald-500/20",
  },
  {
    id: "04", name: "Embedded", full: "Embedded Systems & Instrumentation",
    description: "Sensor design, weak-signal detection, and signal processing across applications.",
    color: "bg-cyan-400", text: "text-cyan-400", glow: "shadow-cyan-500/20",
  },
  {
    id: "05", name: "Sudoku", full: "DevOps & Software Engineering",
    description: "Software platforms, web systems, scripts, and media production.",
    color: "bg-pink-400", text: "text-pink-400", glow: "shadow-pink-500/20",
  },
  {
    id: "06", name: "Teaching", full: "Education & Teaching Tools",
    description: "Pedagogical tools and techniques deployed in UW courses and institutions worldwide.",
    color: "bg-sky-400", text: "text-sky-400", glow: "shadow-sky-500/20",
  },
];

const engagements = [
  {
    label: "Industry & Partners",
    heading: "Contract with us",
    description: "We work directly with industry on applied research, prototyping, energy assessments, and custom technical solutions — university expertise at commercial speed.",
    cta: "Get in touch",
    href: "/contact",
    accent: "from-emerald-500 to-teal-600",
    border: "border-emerald-500/30",
    tag: "text-emerald-400",
  },
  {
    label: "Researchers & Collaborators",
    heading: "Explore our research",
    description: "Browse our publications, active projects, and team specializations. We welcome collaborations with other labs, departments, and research institutions.",
    cta: "View publications",
    href: "/publications",
    accent: "from-violet-500 to-purple-700",
    border: "border-violet-500/30",
    tag: "text-violet-400",
  },
  {
    label: "Students",
    heading: "Join the lab",
    description: "Earn credits, build real skills, and contribute to meaningful work. No prior experience required — just motivation. UW students at any level are welcome.",
    cta: "Apply now",
    href: "/apply",
    accent: "from-sky-500 to-blue-600",
    border: "border-sky-500/30",
    tag: "text-sky-400",
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

        <div className="relative text-center px-6 max-w-3xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            Sensors, Energy, and Automation Laboratory
          </h1>
          <img src="/UW.svg" alt="University of Washington" className="h-15 w-auto mx-auto mb-8 brightness-0 invert opacity-80" />
          <p className="text-slate-300 text-lg max-w-xl mx-auto leading-relaxed mb-10">
            Applied engineering research solving real problems in medicine,
            defense, avionics, and sustainability.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/projects" className="px-6 py-3 text-sm font-semibold text-white bg-white/10 border border-white/25 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm">
              Our Research
            </Link>
            <Link href="/contact" className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-700 rounded-lg hover:from-purple-500 hover:to-violet-600 transition-all shadow-lg shadow-purple-900/40">
              Work With Us
            </Link>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section className="py-24 px-8 border-b border-white/8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-xs uppercase tracking-widest text-purple-400 mb-3">About</p>
            <h2 className="text-3xl font-bold text-white">Who we are</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-12">
            <p className="text-slate-300 text-lg leading-relaxed">
              An engineering research lab at the intersection of sensors, energy, and
              automation — bridging academic research and real-world application.
            </p>
            <p className="text-slate-500 leading-relaxed">
              Our associates span faculty, graduate students, and undergraduates. We partner
              with industry, publish peer-reviewed research, and spin off companies. Open to
              any motivated contributor regardless of experience.
            </p>
          </div>
        </div>
      </section>

      {/* ── Research Areas ── */}
      <section className="py-24 px-8 border-b border-white/8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between mb-16 flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-purple-400 mb-3">Capabilities</p>
              <h2 className="text-3xl font-bold text-white">Research Areas</h2>
            </div>
            <Link href="/projects" className="text-sm text-slate-500 hover:text-white transition-colors">
              All projects & publications →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {teams.map((team) => (
              <div
                key={team.id}
                className={`relative group p-6 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-white/15 hover:bg-white/[0.06] transition-all duration-200 overflow-hidden`}
              >
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${team.color.replace("bg-", "from-")} to-transparent`} />
                <div className="flex items-start justify-between mb-5">
                  <span className={`text-xs font-mono ${team.text} opacity-60`}>{team.id}</span>
                  <div className={`w-2 h-2 rounded-full ${team.color} shadow-lg ${team.glow}`} />
                </div>
                <p className={`text-xs font-semibold uppercase tracking-widest ${team.text} mb-2`}>{team.name}</p>
                <h3 className="text-white font-semibold text-sm mb-3 leading-snug">{team.full}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{team.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Work with SEAL ── */}
      <section className="py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-xs uppercase tracking-widest text-purple-400 mb-3">Engage</p>
            <h2 className="text-3xl font-bold text-white">Work with SEAL</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {engagements.map((e) => (
              <div
                key={e.label}
                className={`relative flex flex-col p-8 rounded-2xl border ${e.border} bg-white/[0.02] hover:bg-white/[0.05] transition-all overflow-hidden`}
              >
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${e.accent}`} />
                <p className={`text-xs uppercase tracking-widest ${e.tag} mb-4`}>{e.label}</p>
                <h3 className="text-white font-semibold text-xl mb-4">{e.heading}</h3>
                <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-8">{e.description}</p>
                <Link
                  href={e.href}
                  className={`self-start text-sm font-semibold bg-gradient-to-r ${e.accent} bg-clip-text text-transparent hover:opacity-80 transition-opacity`}
                >
                  {e.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
