import Link from "next/link";
import { notFound } from "next/navigation";
import newsJson from "@/data/news.json";
import { getNews } from "@/data/intake-content";

export function generateStaticParams() {
  // Only the static archive is prerendered; submitted posts render on
  // demand (dynamicParams defaults to true).
  return newsJson.map((item) => ({ id: String(item.id) }));
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getNews().find((entry) => String(entry.id) === id);

  if (!item) {
    notFound();
  }

  return (
    <div className="page-shell">
      <div className="page-container-tight">
        <div className="mb-4">
          <Link
            href="/news"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-[#f1f3f9]"
          >
            ← Back to News
          </Link>
        </div>

        <article className="surface-card overflow-hidden">
          {item.image ? (
            <div className="media-frame h-56 sm:h-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
            </div>
          ) : null}

          <div className="p-5 sm:p-8">
            <p className="text-xs uppercase tracking-widest text-[#e0b563] mb-2">{item.date}</p>
            <h1 className="text-[#f1f3f9] text-3xl sm:text-4xl font-semibold leading-tight mb-3">
              {item.title}
            </h1>

            {item.people.length > 0 ? (
              <p className="text-sm text-slate-500 mb-6">{item.people.join(", ")}</p>
            ) : null}

            {/* One rendering path for every body: getNews() has already turned
                editor HTML, hand-written Markdown, and the legacy plain-text
                bodies into sanitized HTML. */}
            <div
              className="border-t border-white/[0.06] pt-6 intake-prose"
              dangerouslySetInnerHTML={{ __html: item.bodyHtml }}
            />

            {item.links.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/[0.06]">
                {item.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-400 hover:text-[#f1f3f9] border border-white/10 hover:border-white/30 px-4 py-2 rounded-lg transition-all"
                  >
                    {link.label} →
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </article>
      </div>
    </div>
  );
}
