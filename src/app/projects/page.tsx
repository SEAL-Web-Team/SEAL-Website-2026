import projects from "@/data/projects.json";

export default function ProjectsPage() {
  return (
    <div className="page-shell">
      <div className="page-container">

        <div className="page-header">
          <h1 className="page-title">Project Showcase</h1>
          <p className="page-subtitle">Research initiatives and engineering projects from the SEAL Lab.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <a
              key={project.name}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="surface-card surface-card-hover group relative overflow-hidden flex flex-col"
            >
              {/* Image */}
              <div className="media-frame h-52 overflow-hidden shrink-0">
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
                <p className="text-slate-300 text-sm leading-relaxed flex-1">
                  {project.description}
                </p>
                <div className="mt-5">
                  <span className="action-chip text-xs">
                    <span>View project</span>
                    <span aria-hidden="true">→</span>
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

      </div>
    </div>
  );
}
