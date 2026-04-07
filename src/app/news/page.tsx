import news from "@/data/news.json";
import pageCopy from "@/data/page-copy.json";
import { NewsGrid } from "@/components/NewsGrid";

export default function NewsPage() {
  return (
    <div className="page-shell">
      <div className="page-container">

        <div className="page-header">
          <h1 className="page-title">{pageCopy.news.title}</h1>
          <p className="page-subtitle">{pageCopy.news.subtitle}</p>
        </div>

        <NewsGrid
          items={news}
          actionLabel={pageCopy.news.actionLabel}
          expandListLabel={pageCopy.news.expandListLabel}
        />

      </div>
    </div>
  );
}
