import Link from "next/link";
import { notFound } from "next/navigation";
import galleryData from "@/data/gallery.json";
import GalleryLightbox from "@/components/GalleryLightbox";

type Album = (typeof galleryData.albums)[number];

export function generateStaticParams() {
  return galleryData.albums
    .filter((album) => album.internal)
    .map((album) => ({ slug: album.slug }));
}

export default async function GalleryAlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = galleryData.albums.find(
    (entry) => entry.slug === slug && entry.internal,
  ) as Album | undefined;

  if (!album || !album.images) {
    notFound();
  }

  return (
    <div className="page-shell">
      <div className="page-container">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="mb-4">
              <Link
                href="/gallery"
                className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
              >
                ← Back to Gallery
              </Link>
            </div>
            <h1 className="page-title">{album.title}</h1>
          </div>
          <p className="text-sm text-slate-400 whitespace-nowrap">
            {album.count} photos
          </p>
        </div>

        <GalleryLightbox albumTitle={album.title} images={album.images} />
      </div>
    </div>
  );
}
