"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

type GalleryImage = {
  title: string;
  description?: string;
  full: string;
  thumb: string;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function clampZoom(v: number) {
  return clamp(Number(v.toFixed(3)), MIN_ZOOM, MAX_ZOOM);
}

/**
 * Given a zoom level and image/viewport dimensions, compute the maximum pan
 * offset (symmetric around 0) that keeps the image edge flush with the
 * viewport edge. When the image is smaller than the viewport the max is 0
 * (image stays centered).
 */
function maxPan(zoom: number, imgDim: number, vpDim: number) {
  return Math.max(0, (imgDim * zoom - vpDim) / 2);
}

function clampPan(
  px: number, py: number,
  zoom: number,
  imgW: number, imgH: number,
  vpW: number, vpH: number,
) {
  return {
    x: clamp(px, -maxPan(zoom, imgW, vpW), maxPan(zoom, imgW, vpW)),
    y: clamp(py, -maxPan(zoom, imgH, vpH), maxPan(zoom, imgH, vpH)),
  };
}

/**
 * Compute the new zoom + pan that keeps the point at (pivotX, pivotY)
 * — expressed relative to the container center — fixed under the cursor.
 *
 * Works because the transform layer fills the container with
 * transform-origin: center, so:
 *   newPan = pivot * (1 - ratio) + oldPan * ratio
 */
function zoomToward(
  targetZoom: number,
  pivotX: number, pivotY: number,
  currentZoom: number,
  currentPanX: number, currentPanY: number,
  imgW: number, imgH: number,
  vpW: number, vpH: number,
) {
  const newZoom = clampZoom(targetZoom);
  const r = newZoom / currentZoom;
  const rawX = pivotX * (1 - r) + currentPanX * r;
  const rawY = pivotY * (1 - r) + currentPanY * r;
  const { x, y } = clampPan(rawX, rawY, newZoom, imgW, imgH, vpW, vpH);
  return { zoom: newZoom, panX: x, panY: y };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function GalleryLightbox({
  albumTitle,
  images,
}: {
  albumTitle: string;
  images: GalleryImage[];
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);

  // Refs so the imperative wheel listener always reads fresh values.
  const zoomRef       = useRef(1);
  const panRef        = useRef({ x: 0, y: 0 });
  const baseSizeRef   = useRef({ w: 0, h: 0 });
  const containerRef2 = useRef({ w: 0, h: 0 }); // container size ref

  // ── Derived: base image size that fits the container at zoom=1 ─────────────

  const baseSize = useMemo(() => {
    const { w: nw, h: nh } = naturalSize;
    const { w: cw, h: ch } = containerSize;
    if (!nw || !nh || !cw || !ch) return { w: 0, h: 0 };
    const ratio = Math.min(cw / nw, ch / nh);
    return { w: Math.round(nw * ratio), h: Math.round(nh * ratio) };
  }, [naturalSize, containerSize]);

  // Keep refs current so imperative handlers always see latest values.
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { baseSizeRef.current = baseSize; }, [baseSize]);
  useEffect(() => { containerRef2.current = containerSize; }, [containerSize]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const commitZoom = (newZoom: number, pivotX: number, pivotY: number) => {
    const base = baseSizeRef.current;
    const vp   = containerRef2.current;
    if (!base.w || !vp.w) return;

    const result = zoomToward(
      newZoom, pivotX, pivotY,
      zoomRef.current, panRef.current.x, panRef.current.y,
      base.w, base.h, vp.w, vp.h,
    );

    zoomRef.current = result.zoom;
    panRef.current  = { x: result.panX, y: result.panY };
    setZoom(result.zoom);
    setPan({ x: result.panX, y: result.panY });
  };

  const resetView = () => {
    zoomRef.current = 1;
    panRef.current  = { x: 0, y: 0 };
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const pivotFromEvent = (e: { clientX: number; clientY: number }) => {
    const el = containerRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
  };

  // ── Open / close / navigate ────────────────────────────────────────────────

  const openImage = (index: number) => {
    dragRef.current = null;
    resetView();
    setNaturalSize({ w: 0, h: 0 });
    setActiveIndex(index);
  };

  const closeLightbox = () => {
    dragRef.current = null;
    resetView();
    setActiveIndex(null);
  };

  const showPrev = () => {
    dragRef.current = null;
    resetView();
    setNaturalSize({ w: 0, h: 0 });
    setActiveIndex((i) => (i === null ? images.length - 1 : (i - 1 + images.length) % images.length));
  };

  const showNext = () => {
    dragRef.current = null;
    resetView();
    setNaturalSize({ w: 0, h: 0 });
    setActiveIndex((i) => (i === null ? 0 : (i + 1) % images.length));
  };

  // ── Non-passive wheel → zoom toward cursor ─────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el || activeIndex === null) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!baseSizeRef.current.w) return;
      const r    = el.getBoundingClientRect();
      const pivX = e.clientX - r.left  - r.width  / 2;
      const pivY = e.clientY - r.top   - r.height / 2;
      const delta = e.deltaY < 0 ? 0.5 : -0.5;
      commitZoom(zoomRef.current + delta, pivX, pivY);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [activeIndex]);

  // ── ResizeObserver for container ───────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el || activeIndex === null) return;
    const update = () => setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeIndex]);

  // ── Keyboard + scroll lock ─────────────────────────────────────────────────

  const handleKey = useEffectEvent((e: KeyboardEvent) => {
    switch (e.key) {
      case "Escape":      closeLightbox(); break;
      case "ArrowLeft":   showPrev();      break;
      case "ArrowRight":  showNext();      break;
      case "+": case "=": commitZoom(zoomRef.current + 0.25, 0, 0); break;
      case "-":           commitZoom(zoomRef.current - 0.25, 0, 0); break;
      case "0":           resetView();     break;
    }
  });

  useEffect(() => {
    if (activeIndex === null) { document.body.style.overflow = ""; return; }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", handleKey); };
  }, [activeIndex]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const activeImage   = activeIndex === null ? null : images[activeIndex];
  const hasSize       = baseSize.w > 0;
  const counterCurrent = String(activeIndex === null ? 0 : activeIndex + 1).padStart(2, "0");
  const counterTotal   = String(images.length).padStart(2, "0");

  return (
    <>
      {/* ── Thumbnail wall ── */}
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

      {/* ── Lightbox ── */}
      {activeImage && (
        <div
          className="lightbox-backdrop"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
        >
          {images.length > 1 && (
            <>
              <button type="button" className="lightbox-nav lightbox-nav-left"
                onClick={(e) => { e.stopPropagation(); showPrev(); }} aria-label="Previous image">‹</button>
              <button type="button" className="lightbox-nav lightbox-nav-right"
                onClick={(e) => { e.stopPropagation(); showNext(); }} aria-label="Next image">›</button>
            </>
          )}

          <div className="lightbox-frame">
              <button type="button" className="lightbox-close" onClick={(e) => { e.stopPropagation(); closeLightbox(); }} aria-label="Close">×</button>
            {/* ── Image stage ── */}
            <div className="lightbox-stage">
              <div
                ref={containerRef}
                className={`lightbox-stage-viewport ${zoom > 1 ? "is-zoomed" : ""}`}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => {
                  if (!containerRef.current) return;
                  dragRef.current = {
                    pointerId: e.pointerId,
                    startX: e.clientX,
                    startY: e.clientY,
                    startPanX: panRef.current.x,
                    startPanY: panRef.current.y,
                  };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const drag = dragRef.current;
                  if (!drag || drag.pointerId !== e.pointerId) return;
                  const base = baseSizeRef.current;
                  const vp   = containerRef2.current;
                  const raw  = clampPan(
                    drag.startPanX + (e.clientX - drag.startX),
                    drag.startPanY + (e.clientY - drag.startY),
                    zoomRef.current, base.w, base.h, vp.w, vp.h,
                  );
                  panRef.current = raw;
                  setPan(raw);
                }}
                onPointerUp={(e) => {
                  if (dragRef.current?.pointerId === e.pointerId) {
                    dragRef.current = null;
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  }
                }}
                onPointerCancel={(e) => {
                  if (dragRef.current?.pointerId === e.pointerId) {
                    dragRef.current = null;
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  }
                }}
              >
                {/* Transform layer — fills the container, scales from its center */}
                <div
                  className="lightbox-transform-layer"
                  style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeImage.full}
                    alt={activeImage.title}
                    className="lightbox-image"
                    style={hasSize ? { width: baseSize.w, height: baseSize.h } : { opacity: 0 }}
                    draggable={false}
                    onLoad={(e) => setNaturalSize({
                      w: e.currentTarget.naturalWidth,
                      h: e.currentTarget.naturalHeight,
                    })}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (zoom > 1) {
                        resetView();
                      } else {
                        const p = pivotFromEvent(e);
                        commitZoom(2, p.x, p.y);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ── Sidebar ── */}
            <div className="lightbox-meta" onClick={(e) => e.stopPropagation()}>
              <p className="lightbox-meta-label">Album</p>
              <h2 className="lightbox-meta-title">{albumTitle}</h2>

              <button type="button" className="lightbox-counter"
                onClick={(e) => { e.stopPropagation(); resetView(); }} aria-label="Reset zoom">
                <span className="lightbox-counter-label">Image</span>
                <span className="lightbox-counter-value">{counterCurrent} / {counterTotal}</span>
              </button>

              <div className="lightbox-controls">
                <button type="button" className="lightbox-control-button"
                  onClick={(e) => { e.stopPropagation(); commitZoom(zoom - 0.25, 0, 0); }}
                  aria-label="Zoom out">−</button>
                <button type="button" className="lightbox-control-readout lightbox-control-button"
                  onClick={(e) => { e.stopPropagation(); resetView(); }}
                  aria-label="Reset zoom">{Math.round(zoom * 100)}%</button>
                <button type="button" className="lightbox-control-button"
                  onClick={(e) => { e.stopPropagation(); commitZoom(zoom + 0.25, 0, 0); }}
                  aria-label="Zoom in">+</button>
              </div>

              {activeImage.description && (
                <p className="lightbox-image-description">{activeImage.description}</p>
              )}

              <p className="lightbox-meta-hint">
                Scroll to zoom · Double-click to zoom in/out · Drag to pan
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
