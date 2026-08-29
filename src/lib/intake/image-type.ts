// Magic-byte sniffing for the image formats we accept. The upload route must not
// trust the browser-supplied Content-Type or filename: both are attacker
// controlled, and a file we serve back from our own origin as text/html would be
// stored XSS. Only these signatures are ever written to disk.

const startsWith = (buf: Buffer, bytes: number[], offset = 0) =>
  buf.length >= offset + bytes.length && bytes.every((b, i) => buf[offset + i] === b);

/** @returns a MIME type, or null when the bytes match no format we allow. */
export function sniffImageType(buf: Buffer): string | null {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;

  // PNG: \x89PNG\r\n\x1a\n
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";

  // JPEG: FF D8 FF
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return "image/jpeg";

  // GIF: "GIF87a" / "GIF89a"
  if (startsWith(buf, [0x47, 0x49, 0x46, 0x38])) return "image/gif";

  // RIFF....WEBP
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "image/webp";
  }

  // ISO-BMFF: ....ftyp<brand>. AVIF brands only — the same container also holds
  // video (mp4/mov), which we don't accept.
  if (startsWith(buf, [0x66, 0x74, 0x79, 0x70], 4)) {
    const brand = buf.subarray(8, 12).toString("latin1");
    if (brand === "avif" || brand === "avis") return "image/avif";
  }

  return null;
}
