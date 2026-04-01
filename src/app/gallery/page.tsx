const albums = [
  {
    title: "Spring17 Group Photo",
    href: "https://www.uwseal.org/gallery/nggallery/spring17-group-photo/Spring17-Group-Photo",
    image:
      "https://www.uwseal.org/wp-content/gallery/spring17-group-photo/cache/IMG_7009.jpg-nggid0228-ngg0dyn-240x160x100-00f0w010c010r110f110r010t010.jpg",
    count: 19,
  },
  {
    title: "Spring18 Group Photo",
    href: "https://www.uwseal.org/gallery/nggallery/spring18-group-photo-1/Spring18-Group-Photo",
    image:
      "https://www.uwseal.org/wp-content/gallery/spring18-group-photo/cache/IMG_9075.JPG-nggid0247-ngg0dyn-240x160x100-00f0w010c010r110f110r010t010.JPG",
    count: 27,
  },
  {
    title: "Spring19 Group Photo",
    href: "https://www.uwseal.org/gallery/nggallery/spring-19-group-photo/spring19-group-photo",
    image:
      "https://www.uwseal.org/wp-content/gallery/spring19-group-photo/cache/SEAL_2019_Spring_Photo.jpeg-nggid0290-ngg0dyn-240x160x100-00f0w010c010r110f110r010t010.jpeg",
    count: 1,
  },
  {
    title: "Summer21 Social Photo",
    href: "https://www.uwseal.org/gallery/nggallery/summer21-social/summer21-social-photo",
    image:
      "https://www.uwseal.org/wp-content/gallery/summer21-social-photo/cache/Volleyball_1.jpg-nggid0277-ngg0dyn-240x160x100-00f0w010c010r110f110r010t010.jpg",
    count: 2,
  },
  {
    title: "Lucky Seal Story",
    href: "https://www.uwseal.org/gallery-lucky-seal-story/",
    image:
      "https://www.uwseal.org/wp-content/gallery/lucky-seal-story/cache/Newton-Tree-2.png-nggid0279-ngg0dyn-240x160x100-00f0w010c010r110f110r010t010.png",
    count: 4,
  },
];

export default function GalleryPage() {
  return (
    <div className="page-shell">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Gallery</h1>
          <p className="page-subtitle">
            Photo albums and visual snapshots from SEAL events, group photos, and lab culture.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <a
              key={album.title}
              href={album.href}
              target="_blank"
              rel="noopener noreferrer"
              className="surface-card surface-card-hover flex flex-col overflow-hidden"
            >
              <div className="media-frame h-52 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={album.image}
                  alt={album.title}
                  className="h-full w-full object-contain transition-transform duration-500 hover:scale-105"
                />
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h2 className="mb-3 text-xl font-semibold text-white">{album.title}</h2>
                <p className="mb-6 text-sm text-slate-400">
                  <strong className="text-slate-200">{album.count}</strong> photos
                </p>
                <span className="action-chip self-start">
                  <span>Open album</span>
                  <span aria-hidden="true">→</span>
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
