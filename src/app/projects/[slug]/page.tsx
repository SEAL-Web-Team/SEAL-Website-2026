import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug, getInternalProjectSlugs } from "@/data/projects";
import { SingleImageLightboxTrigger } from "@/components/GalleryLightbox";

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
            className="text-sm font-medium text-slate-500 transition-colors hover:text-[#f1f3f9]"
          >
            ← Back to Projects
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl mb-8 sm:mb-12 border border-white/[0.1] shadow-[0_24px_60px_rgb(2_6_23_/_0.4)]">
          <div className="bg-[linear-gradient(135deg,var(--seal-purple),color-mix(in_srgb,var(--seal-purple)_72%,black))] px-6 py-10 sm:px-10 sm:py-14">
            <div className="page-container">
              <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight">
                {project.name}
              </h1>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-start">
          <div className="space-y-12">
            <section>
              <h2 className="text-[var(--seal-purple-light)] text-3xl sm:text-4xl font-bold leading-tight mb-5 tracking-tight">
                Project Overview
              </h2>
              <div className="space-y-4">
                {project.overview.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-slate-300 text-base sm:text-lg leading-8"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>

            {project.longTermGoals?.length ? (
              <section>
                <h2 className="text-[var(--seal-purple-light)] text-3xl sm:text-4xl font-bold leading-tight mb-5 tracking-tight">
                  Long-Term Goals
                </h2>
                <ul className="list-disc pl-6 space-y-3 text-slate-300 text-base sm:text-lg leading-8 marker:text-[var(--seal-purple-light)]">
                  {project.longTermGoals.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {project.skills?.length ? (
              <section>
                <h2 className="text-[var(--seal-purple-light)] text-3xl sm:text-4xl font-bold leading-tight mb-5 tracking-tight">
                  Skills You Will Develop
                </h2>
                <ul className="list-disc pl-6 space-y-3 text-slate-300 text-base sm:text-lg leading-8 marker:text-[var(--seal-purple-light)]">
                  {project.skills.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {project.quickPoints?.length ? (
              <section>
                <h2 className="text-[var(--seal-purple-light)] text-3xl sm:text-4xl font-bold leading-tight mb-5 tracking-tight">
                  Quick Points
                </h2>
                <ul className="list-disc pl-6 space-y-3 text-slate-300 text-base sm:text-lg leading-8 marker:text-[var(--seal-purple-light)]">
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
                <SingleImageLightboxTrigger
                  albumTitle={project.name}
                  image={{
                    title: image.alt,
                    description: image.caption,
                    full: image.src,
                    thumb: image.src,
                  }}
                  className="block w-full cursor-zoom-in"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-auto object-contain rounded-xl"
                  />
                </SingleImageLightboxTrigger>
                {image.caption ? (
                  <figcaption className="text-slate-400 text-sm sm:text-[0.95rem] font-medium text-center mt-4 leading-relaxed">
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
