import Link from "next/link";
import { notFound } from "next/navigation";
import { getGalleryAlbumBySlug, getInternalGalleryAlbumSlugs } from "@/data/galleries";
import GalleryLightbox from "@/components/GalleryLightbox";

export function generateStaticParams() {
  return getInternalGalleryAlbumSlugs().map((slug) => ({ slug }));
}

export default async function GalleryAlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = await getGalleryAlbumBySlug(slug);

  if (!album) {
    notFound();
  }

  return (
    <div className="page-shell">
      <div className="page-container">
        <div className="mb-4">
          <Link
            href="/gallery"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            ← Back to Gallery
          </Link>
        </div>

        <div className="gallery-album-header">
          <div className="gallery-album-header-main">
            <h1 className="page-title">{album.title}</h1>
            {album.intro?.length ? (
              <div className="gallery-album-intro">
                {album.intro.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}
          </div>

          <p className="gallery-album-count">
            {album.count} photos
          </p>
        </div>

        <GalleryLightbox albumTitle={album.title} images={album.images} />
      </div>
    </div>
  );
}
