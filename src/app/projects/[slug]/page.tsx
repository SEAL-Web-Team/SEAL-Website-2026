import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug, getInternalProjectSlugs } from "@/data/projects";

export function generateStaticParams() {
  return getInternalProjectSlugs().map((slug) => ({ slug }));
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="page-shell">
      <div className="page-container">
        <div className="mb-4">
          <Link
            href="/projects"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            ← Back to Projects
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl mb-8 sm:mb-12 border border-white/[0.08]">
          <div className="bg-[var(--seal-purple)] px-6 py-10 sm:px-10 sm:py-14">
            <div className="page-container">
              <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight">
                {project.name}
              </h1>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-start">
          <div className="space-y-12">
            <section>
              <h2 className="text-[var(--seal-purple-light)] text-3xl sm:text-4xl font-semibold leading-tight mb-5">
                Project Overview
              </h2>
              <div className="space-y-4">
                {project.overview.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-slate-200 text-base sm:text-lg leading-relaxed"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>

            {project.longTermGoals?.length ? (
              <section>
                <h2 className="text-[var(--seal-purple-light)] text-3xl sm:text-4xl font-semibold leading-tight mb-5">
                  Long-Term Goals
                </h2>
                <ul className="list-disc pl-6 space-y-3 text-slate-200 text-base sm:text-lg leading-relaxed">
                  {project.longTermGoals.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {project.skills?.length ? (
              <section>
                <h2 className="text-[var(--seal-purple-light)] text-3xl sm:text-4xl font-semibold leading-tight mb-5">
                  Skills You Will Develop
                </h2>
                <ul className="list-disc pl-6 space-y-3 text-slate-200 text-base sm:text-lg leading-relaxed">
                  {project.skills.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {project.quickPoints?.length ? (
              <section>
                <h2 className="text-[var(--seal-purple-light)] text-3xl sm:text-4xl font-semibold leading-tight mb-5">
                  Quick Points
                </h2>
                <ul className="list-disc pl-6 space-y-3 text-slate-200 text-base sm:text-lg leading-relaxed">
                  {project.quickPoints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <div className="space-y-8">
            {project.images?.map((image) => (
              <figure
                key={`${image.src}-${image.caption ?? image.alt}`}
                className="surface-card overflow-hidden p-4 sm:p-5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-auto object-contain rounded-xl"
                />
                {image.caption ? (
                  <figcaption className="text-slate-400 text-sm text-center mt-4">
                    {image.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}