import luckySealData from "@/data/galleries/lucky-seal-story.json";

export default function LuckySealPage() {
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

        <div className="lucky-seal-photos">
          {luckySealData.images.map((image) => (
            <figure key={image.title} className="lucky-seal-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.full} alt={image.title} className="lucky-seal-photo-image" />
              {image.description && (
                <figcaption className="lucky-seal-photo-caption">{image.description}</figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
