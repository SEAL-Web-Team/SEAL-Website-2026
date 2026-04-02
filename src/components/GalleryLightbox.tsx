"use client";

import { useEffect, useState } from "react";

type GalleryImage = {
  title: string;
  full: string;
  thumb: string;
};

export default function GalleryLightbox({
  albumTitle,
  images,
}: {
  albumTitle: string;
  images: GalleryImage[];
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveIndex(null);
        return;
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) =>
          current === null ? 0 : (current + 1) % images.length,
        );
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) =>
          current === null ? images.length - 1 : (current - 1 + images.length) % images.length,
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, images.length]);

  const activeImage = activeIndex === null ? null : images[activeIndex];
  const displayIndex = activeIndex === null ? 0 : activeIndex + 1;
  const counterCurrent = String(displayIndex).padStart(2, "0");
  const counterTotal = String(images.length).padStart(2, "0");

  return (
    <>
      <div className="gallery-wall">
        {images.map((image, index) => (
          <button
            key={image.title}
            type="button"
            className="gallery-tile text-left"
            onClick={() => setActiveIndex(index)}
            aria-label={`Open image ${index + 1}`}
          >
            <div className="gallery-tile-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.thumb}
                alt={image.title}
                className="gallery-tile-image"
              />
            </div>
          </button>
        ))}
      </div>

      {activeImage && (
        <div
          className="lightbox-backdrop"
          onClick={() => setActiveIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setActiveIndex(null)}
            aria-label="Close image viewer"
          >
            ×
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                className="lightbox-nav lightbox-nav-left"
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveIndex((current) =>
                    current === null ? images.length - 1 : (current - 1 + images.length) % images.length,
                  );
                }}
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                className="lightbox-nav lightbox-nav-right"
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveIndex((current) =>
                    current === null ? 0 : (current + 1) % images.length,
                  );
                }}
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}

          <div className="lightbox-frame">
            <div className="lightbox-stage">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage.full}
                alt={activeImage.title}
                className="lightbox-image"
                onClick={(event) => event.stopPropagation()}
              />
            </div>

            <div className="lightbox-meta">
              <p className="lightbox-meta-label">Album</p>
              <h2 className="lightbox-meta-title">{albumTitle}</h2>

              <div className="lightbox-counter">
                <span className="lightbox-counter-label">Image</span>
                <span className="lightbox-counter-value">
                  {counterCurrent} / {counterTotal}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
