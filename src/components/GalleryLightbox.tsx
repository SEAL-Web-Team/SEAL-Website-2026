"use client";

import { type ReactNode, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatGalleryImageParam, parseGalleryImageParam } from "@/lib/galleryImageParam";

export type GalleryImage = {
  title: string;
  description?: string;
  full: string;
  thumb: string;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const MINIMAP_MAX = 120;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function clampZoom(v: number) {
  return clamp(Number(v.toFixed(3)), MIN_ZOOM, MAX_ZOOM);
}

function maxPan(zoom: number, imgDim: number, vpDim: number) {
  return Math.max(0, (imgDim * zoom - vpDim) / 2);
}

function clampPan(
  px: number,
  py: number,
  zoom: number,
  imgW: number,
  imgH: number,
  vpW: number,
  vpH: number,
) {
  return {
    x: clamp(px, -maxPan(zoom, imgW, vpW), maxPan(zoom, imgW, vpW)),
    y: clamp(py, -maxPan(zoom, imgH, vpH), maxPan(zoom, imgH, vpH)),
  };
}

function zoomToward(
  targetZoom: number,
  pivotX: number,
  pivotY: number,
  currentZoom: number,
  currentPanX: number,
  currentPanY: number,
  imgW: number,
  imgH: number,
  vpW: number,
  vpH: number,
) {
  const newZoom = clampZoom(targetZoom);
  const r = newZoom / currentZoom;
  const rawX = pivotX * (1 - r) + currentPanX * r;
  const rawY = pivotY * (1 - r) + currentPanY * r;
  const { x, y } = clampPan(rawX, rawY, newZoom, imgW, imgH, vpW, vpH);
  return { zoom: newZoom, panX: x, panY: y };
}

function Minimap({
  zoom,
  pan,
  baseSize,
  containerSize,
}: {
  zoom: number;
  pan: { x: number; y: number };
  baseSize: { w: number; h: number };
  containerSize: { w: number; h: number };
}) {
  if (zoom <= 1 || !baseSize.w || !containerSize.w) {
    return null;
  }

  const { w: bw, h: bh } = baseSize;
  const { w: vw, h: vh } = containerSize;
  const scale = bw >= bh ? MINIMAP_MAX / bw : MINIMAP_MAX / bh;
  const mmW = Math.round(bw * scale);
  const mmH = Math.round(bh * scale);
  const visW = Math.min(1, vw / (zoom * bw));
  const visH = Math.min(1, vh / (zoom * bh));
  const visLeft = Math.max(0, 0.5 - pan.x / (zoom * bw) - vw / (2 * zoom * bw));
  const visTop = Math.max(0, 0.5 - pan.y / (zoom * bh) - vh / (2 * zoom * bh));
  const hlLeft = Math.round(visLeft * mmW);
  const hlTop = Math.round(visTop * mmH);
  const hlW = Math.round(visW * mmW);
  const hlH = Math.round(visH * mmH);

  return (
    <div
      style={{
        position: "absolute",
        bottom: "0.75rem",
        right: "0.75rem",
        width: mmW,
        height: mmH,
        background: "rgb(0 0 0 / 0.52)",
        border: "1px solid rgb(255 255 255 / 0.18)",
        borderRadius: "0.4rem",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 10,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: hlLeft,
          top: hlTop,
          width: hlW,
          height: hlH,
          border: "1.5px solid rgb(168 85 247 / 0.9)",
          background: "rgb(168 85 247 / 0.18)",
          borderRadius: "0.2rem",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function GalleryLightboxOverlay({
  albumTitle,
  image,
  imageCount,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: {
  albumTitle: string;
  image: GalleryImage;
  imageCount: number;
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);
  const pinchRef = useRef<{
    startDistance: number;
    startZoom: number;
    startPanX: number;
    startPanY: number;
    startCenterX: number;
    startCenterY: number;
  } | null>(null);
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const baseSizeRef = useRef({ w: 0, h: 0 });
  const containerSizeRef = useRef({ w: 0, h: 0 });

  const baseSize = useMemo(() => {
    const { w: nw, h: nh } = naturalSize;
    const { w: cw, h: ch } = containerSize;

    if (!nw || !nh || !cw || !ch) {
      return { w: 0, h: 0 };
    }

    const ratio = Math.min(cw / nw, ch / nh);
    return { w: Math.round(nw * ratio), h: Math.round(nh * ratio) };
  }, [containerSize, naturalSize]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    baseSizeRef.current = baseSize;
  }, [baseSize]);

  useEffect(() => {
    containerSizeRef.current = containerSize;
  }, [containerSize]);

  const commitZoom = (newZoom: number, pivotX: number, pivotY: number) => {
    const base = baseSizeRef.current;
    const viewport = containerSizeRef.current;

    if (!base.w || !viewport.w) {
      return;
    }

    const result = zoomToward(
      newZoom,
      pivotX,
      pivotY,
      zoomRef.current,
      panRef.current.x,
      panRef.current.y,
      base.w,
      base.h,
      viewport.w,
      viewport.h,
    );

    zoomRef.current = result.zoom;
    panRef.current = { x: result.panX, y: result.panY };
    setZoom(result.zoom);
    setPan({ x: result.panX, y: result.panY });
  };

  const resetView = () => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const pivotFromEvent = (e: { clientX: number; clientY: number }) => {
    const el = containerRef.current;

    if (!el) {
      return { x: 0, y: 0 };
    }

    const rect = el.getBoundingClientRect();
    return {
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    };
  };

  const handleKey = useEffectEvent((e: KeyboardEvent) => {
    switch (e.key) {
      case "Escape":
        onClose();
        break;
      case "ArrowLeft":
        onPrev();
        break;
      case "ArrowRight":
        onNext();
        break;
      case "+":
      case "=":
        commitZoom(zoomRef.current + 0.25, 0, 0);
        break;
      case "-":
        commitZoom(zoomRef.current - 0.25, 0, 0);
        break;
      case "0":
        resetView();
        break;
    }
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;

    if (!el) {
      return;
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (!baseSizeRef.current.w) {
        return;
      }

      const rect = el.getBoundingClientRect();
      const pivotX = e.clientX - rect.left - rect.width / 2;
      const pivotY = e.clientY - rect.top - rect.height / 2;
      const delta = e.deltaY < 0 ? 0.5 : -0.5;
      commitZoom(zoomRef.current + delta, pivotX, pivotY);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const el = containerRef.current;

    if (!el) {
      return;
    }

    const update = () => setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const counterCurrent = String(currentIndex + 1).padStart(2, "0");
  const counterTotal = String(imageCount).padStart(2, "0");
  const hasSize = baseSize.w > 0;
  const overlay = (
    <div
      className="lightbox-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {imageCount > 1 && (
        <>
          <button
            type="button"
            className="lightbox-nav lightbox-nav-left"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            className="lightbox-nav lightbox-nav-right"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Next image"
          >
            ›
          </button>
        </>
      )}

      <div className="lightbox-frame">
        <button
          type="button"
          className="lightbox-close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
        >
          ×
        </button>

        <div className="lightbox-stage">
          <div
            ref={containerRef}
            className={`lightbox-stage-viewport ${zoom > 1 ? "is-zoomed" : ""}`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => {
              if (!containerRef.current) {
                return;
              }

              pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
              const pointers = Array.from(pointersRef.current.values());

              if (pointers.length === 2) {
                const [a, b] = pointers;
                const centerX = (a.x + b.x) / 2;
                const centerY = (a.y + b.y) / 2;
                pinchRef.current = {
                  startDistance: Math.hypot(b.x - a.x, b.y - a.y),
                  startZoom: zoomRef.current,
                  startPanX: panRef.current.x,
                  startPanY: panRef.current.y,
                  startCenterX: centerX,
                  startCenterY: centerY,
                };
                dragRef.current = null;
              } else if (pointers.length === 1) {
                pinchRef.current = null;
                dragRef.current = {
                  pointerId: e.pointerId,
                  startX: e.clientX,
                  startY: e.clientY,
                  startPanX: panRef.current.x,
                  startPanY: panRef.current.y,
                };
              }

              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
              const pinch = pinchRef.current;
              const pointers = Array.from(pointersRef.current.values());

              if (pinch && pointers.length >= 2) {
                const [a, b] = pointers;
                const currentDistance = Math.hypot(b.x - a.x, b.y - a.y);

                if (currentDistance > 0 && pinch.startDistance > 0) {
                  const centerX = (a.x + b.x) / 2;
                  const centerY = (a.y + b.y) / 2;
                  const pivot = pivotFromEvent({ clientX: centerX, clientY: centerY });
                  const nextZoom = pinch.startZoom * (currentDistance / pinch.startDistance);
                  const result = zoomToward(
                    nextZoom,
                    pivot.x,
                    pivot.y,
                    pinch.startZoom,
                    pinch.startPanX,
                    pinch.startPanY,
                    baseSizeRef.current.w,
                    baseSizeRef.current.h,
                    containerSizeRef.current.w,
                    containerSizeRef.current.h,
                  );

                  const deltaCenterX = centerX - pinch.startCenterX;
                  const deltaCenterY = centerY - pinch.startCenterY;
                  const panned = clampPan(
                    result.panX + deltaCenterX,
                    result.panY + deltaCenterY,
                    result.zoom,
                    baseSizeRef.current.w,
                    baseSizeRef.current.h,
                    containerSizeRef.current.w,
                    containerSizeRef.current.h,
                  );

                  zoomRef.current = result.zoom;
                  panRef.current = { x: panned.x, y: panned.y };
                  setZoom(result.zoom);
                  setPan({ x: panned.x, y: panned.y });
                }

                return;
              }

              const drag = dragRef.current;

              if (!drag || drag.pointerId !== e.pointerId) {
                return;
              }

              const base = baseSizeRef.current;
              const viewport = containerSizeRef.current;
              const raw = clampPan(
                drag.startPanX + (e.clientX - drag.startX),
                drag.startPanY + (e.clientY - drag.startY),
                zoomRef.current,
                base.w,
                base.h,
                viewport.w,
                viewport.h,
              );

              panRef.current = raw;
              setPan(raw);
            }}
            onPointerUp={(e) => {
              pointersRef.current.delete(e.pointerId);

              if (dragRef.current?.pointerId === e.pointerId) {
                dragRef.current = null;
                e.currentTarget.releasePointerCapture(e.pointerId);
              }

              if (pointersRef.current.size < 2) {
                pinchRef.current = null;
              }
            }}
            onPointerCancel={(e) => {
              pointersRef.current.delete(e.pointerId);

              if (dragRef.current?.pointerId === e.pointerId) {
                dragRef.current = null;
                e.currentTarget.releasePointerCapture(e.pointerId);
              }

              if (pointersRef.current.size < 2) {
                pinchRef.current = null;
              }
            }}
          >
            <div
              className="lightbox-transform-layer"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={image.full}
                src={image.full}
                alt={image.title}
                className="lightbox-image"
                style={hasSize ? { width: baseSize.w, height: baseSize.h } : undefined}
                draggable={false}
                onLoad={(e) => {
                  setNaturalSize({
                    w: e.currentTarget.naturalWidth,
                    h: e.currentTarget.naturalHeight,
                  });
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();

                  if (zoom > 1) {
                    resetView();
                    return;
                  }

                  const pivot = pivotFromEvent(e);
                  commitZoom(2, pivot.x, pivot.y);
                }}
              />
            </div>

            <Minimap
              zoom={zoom}
              pan={pan}
              baseSize={baseSize}
              containerSize={containerSize}
            />
          </div>
        </div>

        <div className="lightbox-meta" onClick={(e) => e.stopPropagation()}>
          <p className="lightbox-meta-label">Album</p>
          <h2 className="lightbox-meta-title">{albumTitle}</h2>

          <button
            type="button"
            className="lightbox-counter"
            onClick={(e) => {
              e.stopPropagation();
              resetView();
            }}
            aria-label="Reset zoom"
          >
            <span className="lightbox-counter-label">Image</span>
            <span className="lightbox-counter-value">{counterCurrent} / {counterTotal}</span>
          </button>

          <div className="lightbox-controls">
            <button
              type="button"
              className="lightbox-control-button"
              onClick={(e) => {
                e.stopPropagation();
                commitZoom(zoom - 0.25, 0, 0);
              }}
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              type="button"
              className="lightbox-control-readout lightbox-control-button"
              onClick={(e) => {
                e.stopPropagation();
                resetView();
              }}
              aria-label="Reset zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              className="lightbox-control-button"
              onClick={(e) => {
                e.stopPropagation();
                commitZoom(zoom + 0.25, 0, 0);
              }}
              aria-label="Zoom in"
            >
              +
            </button>
          </div>

          {image.description && (
            <p className="lightbox-image-description">{image.description}</p>
          )}

          <p className="lightbox-meta-hint">
            Scroll to zoom · Double-click to zoom in/out · Drag to pan
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

export function SingleImageLightboxTrigger({
  albumTitle,
  image,
  className,
  children,
}: {
  albumTitle: string;
  image: GalleryImage;
  className?: string;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setIsOpen(true)}
        aria-label={`Open image for ${image.title}`}
      >
        {children}
      </button>

      {isOpen ? (
        <GalleryLightboxOverlay
          key={image.full}
          albumTitle={albumTitle}
          image={image}
          imageCount={1}
          currentIndex={0}
          onClose={() => setIsOpen(false)}
          onPrev={() => {}}
          onNext={() => {}}
        />
      ) : null}
    </>
  );
}

export default function GalleryLightbox({
  albumTitle,
  images,
}: {
  albumTitle: string;
  images: GalleryImage[];
  initialIndex?: number | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const imageParam = searchParams.get("image");
  const activeIndex = parseGalleryImageParam(imageParam ?? undefined, images.length);
  const activeImage = activeIndex === null ? null : images[activeIndex];

  const setImageQueryParam = (index: number, historyMode: "push" | "replace" = "push") => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("image", formatGalleryImageParam(index));
    const nextUrl = `${pathname}?${nextParams.toString()}`;

    if (historyMode === "replace") {
      router.replace(nextUrl, { scroll: false });
      return;
    }

    router.push(nextUrl, { scroll: false });
  };

  const clearImageQueryParam = (historyMode: "push" | "replace" = "replace") => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("image");
    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    if (historyMode === "replace") {
      router.replace(nextUrl, { scroll: false });
      return;
    }

    router.push(nextUrl, { scroll: false });
  };

  const openImage = (index: number) => {
    setImageQueryParam(index);
  };

  const closeLightbox = () => {
    clearImageQueryParam();
  };

  const showPrev = () => {
    const nextIndex = activeIndex === null ? images.length - 1 : (activeIndex - 1 + images.length) % images.length;
    setImageQueryParam(nextIndex);
  };

  const showNext = () => {
    const nextIndex = activeIndex === null ? 0 : (activeIndex + 1) % images.length;
    setImageQueryParam(nextIndex);
  };

  return (
    <>
      <div className="gallery-wall">
        {images.map((image, index) => (
          <button
            key={image.title}
            type="button"
            className="gallery-tile text-left"
            onClick={() => openImage(index)}
            aria-label={`Open image ${index + 1}`}
          >
            <div className="gallery-tile-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.thumb} alt={image.title} className="gallery-tile-image" />
            </div>
          </button>
        ))}
      </div>

      {activeImage && activeIndex !== null && (
        <GalleryLightboxOverlay
          key={`${activeIndex}-${activeImage.full}`}
          albumTitle={albumTitle}
          image={activeImage}
          imageCount={images.length}
          currentIndex={activeIndex}
          onClose={closeLightbox}
          onPrev={showPrev}
          onNext={showNext}
        />
      )}
    </>
  );
}
