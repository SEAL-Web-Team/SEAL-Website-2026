import Link from "next/link";
import news from "@/data/news.json";
import pageCopy from "@/data/page-copy.json";

export default function NewsPage() {
  return (
    <div className="page-shell">
      <div className="page-container">

        <div className="page-header">
          <h1 className="page-title">{pageCopy.news.title}</h1>
          <p className="page-subtitle">{pageCopy.news.subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.id}`}
              className="surface-card surface-card-hover group overflow-hidden flex flex-col text-left cursor-pointer"
            >
              {/* Fixed-height image box */}
              <div className="media-frame h-44 sm:h-48 shrink-0">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>

              {/* Card content */}
              <div className="flex flex-col flex-1 p-5 sm:p-6">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2 shrink-0">{item.date}</p>
                <h2 className="text-white text-sm font-semibold leading-snug mb-3 line-clamp-3 flex-1">
                  {item.title}
                </h2>
                {item.people.length > 0 && (
                  <p className="text-xs text-slate-500 line-clamp-1 mb-4 shrink-0">{item.people.join(", ")}</p>
                )}
                <span className="action-chip mt-auto self-start text-xs shrink-0">
                  <span>{pageCopy.news.actionLabel}</span>
                  <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
