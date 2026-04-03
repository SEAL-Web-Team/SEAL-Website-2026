import apply from "@/data/apply.json";

export default function ApplyPage() {
  return (
    <div className="page-shell">
      <div className="page-container-tight">

        <div className="page-header">
          <h1 className="page-title">{apply.page.title}</h1>
          <p className="page-subtitle">{apply.page.subtitle}</p>
        </div>

        <div className="flex flex-col gap-4">
          {apply.resources.map((resource) => (
            <a
              key={resource.href}
              href={resource.href}
              target="_blank"
              rel="noopener noreferrer"
              className="surface-card surface-card-hover group flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6 p-5 sm:p-7"
            >
              <div>
                <p className="text-white font-semibold text-lg mb-1">{resource.title}</p>
                <p className="text-slate-300 text-base leading-relaxed">{resource.description}</p>
              </div>
              <span className="action-chip self-start shrink-0 sm:mt-1 text-xs">
                <span>{apply.actionLabel}</span>
                <span aria-hidden="true">→</span>
              </span>
            </a>
          ))}
        </div>

      </div>
    </div>
  );
}
