import Link from "next/link";
import { getGalleryAlbums } from "@/data/galleries";
import pageCopy from "@/data/page-copy.json";

export default function GalleryPage() {
  const albums = getGalleryAlbums();

  return (
    <div className="page-shell">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{pageCopy.gallery.title}</h1>
          <p className="page-subtitle">{pageCopy.gallery.subtitle}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            album.internal ? (
              <Link
                key={album.title}
                href={album.href}
                className="surface-card surface-card-hover flex flex-col overflow-hidden"
              >
                <div className="media-frame h-44 sm:h-52 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={album.image}
                    alt={album.title}
                    className={`h-full w-full object-cover transition-transform duration-500 hover:scale-105`}
                  />
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h2 className="mb-3 text-xl font-semibold text-white">{album.title}</h2>
                  <p className="mb-6 text-sm text-slate-400">
                    <strong className="text-slate-200">{album.count}</strong> photos
                  </p>
                  <span className="action-chip self-start">
                    <span>{pageCopy.gallery.actionLabel}</span>
                    <span aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            ) : (
              <a
                key={album.title}
                href={album.href}
                target="_blank"
                rel="noopener noreferrer"
                className="surface-card surface-card-hover flex flex-col overflow-hidden"
              >
                <div className="media-frame h-44 sm:h-52 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={album.image}
                    alt={album.title}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h2 className="mb-3 text-xl font-semibold text-white">{album.title}</h2>
                  <p className="mb-6 text-sm text-slate-400">
                    <strong className="text-slate-200">{album.count}</strong> photos
                  </p>
                  <span className="action-chip self-start">
                    <span>{pageCopy.gallery.actionLabel}</span>
                    <span aria-hidden="true">→</span>
                  </span>
                </div>
              </a>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
