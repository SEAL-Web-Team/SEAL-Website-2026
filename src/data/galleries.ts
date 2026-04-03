import { promises as fs } from "node:fs";
import path from "node:path";
import indexData from "@/data/galleries/index.json";
import spring17GroupPhoto from "@/data/galleries/spring17-group-photo.json";
import spring18GroupPhoto from "@/data/galleries/spring18-group-photo.json";
import spring19GroupPhoto from "@/data/galleries/spring19-group-photo.json";
import summer21SocialPhoto from "@/data/galleries/summer21-social-photo.json";
import luckySealStory from "@/data/galleries/lucky-seal-story.json";

export type GalleryAlbumIndexEntry = (typeof indexData.albums)[number];
export type GalleryImage = {
  title: string;
  description?: string;
  full: string;
  thumb: string;
};

export type GalleryAlbumDetail = GalleryAlbumIndexEntry & {
  intro?: string[];
  images: GalleryImage[];
};

const internalAlbumModules: Record<string, GalleryAlbumDetail> = {
  "spring17-group-photo": {
    ...indexData.albums.find((album) => album.slug === "spring17-group-photo")!,
    images: spring17GroupPhoto.images,
  },
  "spring18-group-photo": {
    ...indexData.albums.find((album) => album.slug === "spring18-group-photo")!,
    images: spring18GroupPhoto.images,
  },
  "spring19-group-photo": {
    ...indexData.albums.find((album) => album.slug === "spring19-group-photo")!,
    images: spring19GroupPhoto.images,
  },
  "summer21-social-photo": {
    ...indexData.albums.find((album) => album.slug === "summer21-social-photo")!,
    images: summer21SocialPhoto.images,
  },
  "lucky-seal-story": {
    ...indexData.albums.find((album) => album.slug === "lucky-seal-story")!,
    intro: luckySealStory.intro,
    images: luckySealStory.images,
  },
};

export function getGalleryAlbums() {
  return indexData.albums;
}

export function getInternalGalleryAlbumSlugs() {
  return indexData.albums
    .filter((album) => album.internal)
    .map((album) => album.slug);
}

export async function getGalleryAlbumBySlug(slug: string) {
  const indexedAlbum = indexData.albums.find((album) => album.slug === slug);

  if (!indexedAlbum || !indexedAlbum.internal) {
    return null;
  }

  const album = internalAlbumModules[slug];

  if (album) {
    return album;
  }

  const filePath = path.join(process.cwd(), "src/data/galleries", `${slug}.json`);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as { images: GalleryImage[] };
    return {
      ...indexedAlbum,
      images: parsed.images,
    };
  } catch {
    return null;
  }
}
