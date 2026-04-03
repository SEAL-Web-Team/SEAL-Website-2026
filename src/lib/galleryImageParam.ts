export function parseGalleryImageParam(
  value: string | string[] | undefined,
  imageCount: number,
) {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  const index = parsed - 1;
  return index >= 0 && index < imageCount ? index : null;
}

export function formatGalleryImageParam(index: number) {
  return String(index + 1);
}
