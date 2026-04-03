import Link from "next/link";
import { notFound } from "next/navigation";
import { getGalleryAlbumBySlug, getInternalGalleryAlbumSlugs } from "@/data/galleries";
import GalleryLightbox from "@/components/GalleryLightbox";
import { parseGalleryImageParam } from "@/lib/galleryImageParam";

export function generateStaticParams() {
  return getInternalGalleryAlbumSlugs().map((slug) => ({ slug }));
}

export default async function GalleryAlbumPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ image?: string | string[] }>;
}) {
  const { slug } = await params;
  const album = await getGalleryAlbumBySlug(slug);

  if (!album) {
    notFound();
  }

  const requestedImageIndex = parseGalleryImageParam((await searchParams).image, album.images.length);

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

        <div className="page-header">
          <h1 className="page-title">{album.title}</h1>
          <p className="page-subtitle" style={{ marginTop: "0.5rem" }}>{album.count} photos</p>
          {album.intro?.length ? (
            <div className="gallery-album-intro">
              {album.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : null}
        </div>

        <GalleryLightbox
          albumTitle={album.title}
          images={album.images}
          initialIndex={requestedImageIndex}
        />
      </div>
    </div>
  );
}
