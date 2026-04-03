import Link from "next/link";
import { notFound } from "next/navigation";
import news from "@/data/news.json";

export function generateStaticParams() {
  return news.map((item) => ({ id: String(item.id) }));
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = news.find((entry) => String(entry.id) === id);

  if (!item) {
    notFound();
  }

  return (
    <div className="page-shell">
      <div className="page-container-tight">
        <div className="mb-4">
          <Link
            href="/news"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            ← Back to News
          </Link>
        </div>

        <article className="surface-card overflow-hidden">
          {item.image ? (
            <div className="media-frame h-56 sm:h-80 bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
            </div>
          ) : null}

          <div className="p-5 sm:p-8">
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">{item.date}</p>
            <h1 className="text-white text-3xl sm:text-4xl font-semibold leading-tight mb-3">
              {item.title}
            </h1>

            {item.people.length > 0 ? (
              <p className="text-sm text-slate-400 mb-6">{item.people.join(", ")}</p>
            ) : null}

            <div className="border-t border-white/[0.06] pt-6 text-slate-300 text-base leading-relaxed space-y-4">
              {item.body.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {item.links.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/[0.06]">
                {item.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/30 px-4 py-2 rounded-lg transition-all"
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
