import { describe, expect, it } from "vitest";
import { sniffImageType } from "./image-type";

const pad = (head: number[], length = 32) =>
  Buffer.concat([Buffer.from(head), Buffer.alloc(Math.max(0, length - head.length))]);

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const GIF = [...Buffer.from("GIF89a", "latin1")];

const riff = (tag: string) =>
  Buffer.concat([
    Buffer.from("RIFF", "latin1"),
    Buffer.alloc(4),
    Buffer.from(tag, "latin1"),
    Buffer.alloc(20),
  ]);

const ftyp = (brand: string) =>
  Buffer.concat([
    Buffer.alloc(4),
    Buffer.from("ftyp", "latin1"),
    Buffer.from(brand, "latin1"),
    Buffer.alloc(20),
  ]);

describe("sniffImageType — accepts real image signatures", () => {
  it.each([
    ["PNG", pad(PNG), "image/png"],
    ["JPEG", pad(JPEG), "image/jpeg"],
    ["GIF", pad(GIF), "image/gif"],
    ["WebP", riff("WEBP"), "image/webp"],
    ["AVIF", ftyp("avif"), "image/avif"],
    ["AVIF sequence", ftyp("avis"), "image/avif"],
  ])("detects %s", (_label, buf, expected) => {
    expect(sniffImageType(buf)).toBe(expected);
  });
});

describe("sniffImageType — rejects everything else", () => {
  it.each([
    ["HTML", Buffer.from("<html><script>alert(1)</script></html>".padEnd(32))],
    ["SVG", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'.padEnd(32))],
    ["PDF", Buffer.from("%PDF-1.7".padEnd(32))],
    ["plain text", Buffer.from("just some text here padded out".padEnd(32))],
    ["zip", pad([0x50, 0x4b, 0x03, 0x04])],
    ["ELF binary", pad([0x7f, 0x45, 0x4c, 0x46])],
    ["mp4 video (same container as AVIF)", ftyp("isom")],
    ["RIFF that is not WebP (wav)", riff("WAVE")],
  ])("rejects %s", (_label, buf) => {
    expect(sniffImageType(buf)).toBeNull();
  });

  it("rejects a too-short buffer", () => {
    expect(sniffImageType(Buffer.from(PNG.slice(0, 4)))).toBeNull();
    expect(sniffImageType(Buffer.alloc(0))).toBeNull();
  });

  it("rejects a non-buffer", () => {
    expect(sniffImageType("not a buffer" as unknown as Buffer)).toBeNull();
  });

  it("rejects HTML that merely contains a PNG signature later in the file", () => {
    const smuggled = Buffer.concat([Buffer.from("<html>".padEnd(16)), Buffer.from(PNG)]);
    expect(sniffImageType(smuggled)).toBeNull();
  });
});
