import projects from "@/data/projects.json";

export default function ProjectsPage() {
  return (
    <div className="min-h-screen pt-40 pb-28 px-8">
      <div className="max-w-6xl mx-auto">

        <div className="mb-16">
          <h1 className="text-5xl font-bold text-white">Project Showcase</h1>
          <p className="text-slate-400 text-lg mt-4">Research initiatives and engineering projects from the SEAL Lab.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <a
              key={project.name}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden flex flex-col hover:border-white/[0.14] hover:bg-white/[0.05] transition-all duration-200"
            >
              {/* Image */}
              <div className="h-52 bg-black/20 overflow-hidden flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.image}
                  alt={project.name}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Divider */}
              <div className="h-px bg-white/[0.06]" />

              {/* Content */}
              <div className="flex flex-col flex-1 p-6">
                <h2 className="text-white font-semibold text-base leading-snug mb-3">
                  {project.name}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed flex-1">
                  {project.description}
                </p>
                <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-slate-500 group-hover:text-slate-300 transition-colors duration-200">
                  <span>View project</span>
                  <span className="group-hover:translate-x-0.5 transition-transform duration-200">→</span>
                </div>
              </div>
            </a>
          ))}
        </div>

      </div>
    </div>
  );
}
