import luckySealData from "@/data/galleries/lucky-seal-story.json";
import GalleryLightbox from "@/components/GalleryLightbox";

export default async function LuckySealPage({
  searchParams,
}: {
  searchParams: Promise<{ image?: string | string[] }>;
}) {
  await searchParams;

  return (
    <div className="page-shell">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{luckySealData.title}</h1>
          <div className="gallery-album-intro">
            {luckySealData.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <GalleryLightbox
          albumTitle={luckySealData.title}
          images={luckySealData.images}
        />
      </div>
    </div>
  );
}
