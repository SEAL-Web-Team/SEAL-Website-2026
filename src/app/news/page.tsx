import { getNews } from "@/data/intake-content";
import pageCopy from "@/data/page-copy.json";
import { NewsGrid } from "@/components/NewsGrid";

// Reads published /intake submissions from SQLite at request time, so this
// page must not be prerendered — a static build would freeze the list at
// build time and never show anything members post.
export const dynamic = "force-dynamic";

export default function NewsPage() {
  return (
    <div className="page-shell">
      <div className="page-container">

        <div className="page-header">
          <h1 className="page-title">{pageCopy.news.title}</h1>
          <p className="page-subtitle">{pageCopy.news.subtitle}</p>
        </div>

        <NewsGrid
          items={getNews()}
          actionLabel={pageCopy.news.actionLabel}
          expandListLabel={pageCopy.news.expandListLabel}
        />

      </div>
    </div>
  );
}
