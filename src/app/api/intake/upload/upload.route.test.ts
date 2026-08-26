import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { MAX_UPLOAD_BYTES } from "@/lib/intake/schema";
import { cookieJar, signIn, signOut } from "@/lib/intake/__tests__/helpers";

vi.mock("next/headers", () => import("@/lib/intake/__tests__/next-headers-mock"));

// Redirect writes to a temp dir so tests never touch the real public/ tree.
let workDir: string;

const { POST: upload } = await import("./route");

const uploadDir = () => workDir;

beforeEach(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), "intake-upload-"));
  process.env.INTAKE_UPLOAD_DIR = workDir;
  cookieJar.clear();
  signIn("member@uw.edu");
});

afterEach(async () => {
  delete process.env.INTAKE_UPLOAD_DIR;
  await rm(workDir, { recursive: true, force: true });
});

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function imageBytes(header: number[], size = 64) {
  return Buffer.concat([Buffer.from(header), Buffer.alloc(Math.max(0, size - header.length))]);
}

function uploadRequest(body: BodyInit | FormData) {
  return new NextRequest("https://seal.test/api/intake/upload", {
    method: "POST",
    body: body as BodyInit,
  });
}

function fileForm(bytes: Buffer, filename = "pic.png", type = "image/png") {
  const form = new FormData();
  form.append("file", new File([new Uint8Array(bytes)], filename, { type }));
  return form;
}

describe("POST /api/intake/upload", () => {
  it("requires a signed-in member", async () => {
    signOut();
    expect((await upload(uploadRequest(fileForm(imageBytes(PNG_HEADER))))).status).toBe(401);
  });

  it("stores a valid PNG and returns its public URL", async () => {
    const response = await upload(uploadRequest(fileForm(imageBytes(PNG_HEADER))));
    expect(response.status).toBe(201);

    const { url, type } = await response.json();
    expect(type).toBe("image/png");
    expect(url).toMatch(/^\/uploads\/intake\/[a-z0-9-]+\.png$/);

    // The bytes really landed on disk under the temp cwd.
    const written = await readdir(uploadDir());
    expect(written).toHaveLength(1);
    expect(await readFile(path.join(uploadDir(), written[0]))).toHaveLength(64);
  });

  it("returns a URL the post schema will accept as a banner", async () => {
    const { url } = await (await upload(uploadRequest(fileForm(imageBytes(PNG_HEADER))))).json();
    const { postInputSchema } = await import("@/lib/intake/schema");
    expect(postInputSchema.safeParse({ title: "t", bannerUrl: url }).success).toBe(true);
  });

  it("names files randomly rather than from the client filename", async () => {
    const { url } = await (
      await upload(uploadRequest(fileForm(imageBytes(PNG_HEADER), "../../evil.png")))
    ).json();

    expect(url).not.toContain("evil");
    expect(url).not.toContain("..");
    // Nothing escaped the upload directory.
    expect(await readdir(uploadDir())).toHaveLength(1);
  });

  it("gives two uploads of identical bytes distinct names", async () => {
    const a = await (await upload(uploadRequest(fileForm(imageBytes(PNG_HEADER))))).json();
    const b = await (await upload(uploadRequest(fileForm(imageBytes(PNG_HEADER))))).json();

    expect(a.url).not.toBe(b.url);
    expect(await readdir(uploadDir())).toHaveLength(2);
  });

  it("derives the extension from the sniffed bytes, not the filename", async () => {
    // JPEG magic bytes but a .png name and a lying content-type.
    const jpeg = imageBytes([0xff, 0xd8, 0xff, 0xe0]);
    const { url, type } = await (
      await upload(uploadRequest(fileForm(jpeg, "lying.png", "image/png")))
    ).json();

    expect(type).toBe("image/jpeg");
    expect(url.endsWith(".jpg")).toBe(true);
  });

  describe("rejects dangerous or malformed uploads", () => {
    it("rejects HTML disguised as an image", async () => {
      const html = Buffer.from("<html><script>alert(1)</script></html>".padEnd(64));
      const response = await upload(uploadRequest(fileForm(html, "x.png", "image/png")));

      expect(response.status).toBe(415);
      expect(await readdir(uploadDir()).catch(() => [])).toHaveLength(0);
    });

    it("rejects an SVG (scriptable)", async () => {
      const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'.padEnd(64));
      const response = await upload(uploadRequest(fileForm(svg, "x.svg", "image/svg+xml")));
      expect(response.status).toBe(415);
    });

    it("rejects an empty file", async () => {
      const response = await upload(uploadRequest(fileForm(Buffer.alloc(0))));
      expect(response.status).toBe(400);
    });

    it("rejects a file over the size cap", async () => {
      const tooBig = imageBytes(PNG_HEADER, MAX_UPLOAD_BYTES + 1);
      const response = await upload(uploadRequest(fileForm(tooBig)));

      expect(response.status).toBe(413);
      expect(await readdir(uploadDir()).catch(() => [])).toHaveLength(0);
    });

    it("rejects a form with no file field", async () => {
      const form = new FormData();
      form.append("notafile", "hello");
      expect((await upload(uploadRequest(form))).status).toBe(400);
    });

    it("rejects a non-multipart body", async () => {
      const request = new NextRequest("https://seal.test/api/intake/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ file: "nope" }),
      });
      expect((await upload(request)).status).toBe(400);
    });
  });
});
