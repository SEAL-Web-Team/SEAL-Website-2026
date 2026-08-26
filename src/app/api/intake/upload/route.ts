import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { jsonError, withUser } from "@/lib/intake/auth";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, extensionForType } from "@/lib/intake/schema";
import { sniffImageType } from "@/lib/intake/image-type";

export const dynamic = "force-dynamic";

// Resolved per request, not at module load: an env override (or a test's cwd)
// set after this module is first imported must still be honoured.
const uploadDir = () =>
  process.env.INTAKE_UPLOAD_DIR || path.join(process.cwd(), "public", "uploads", "intake");

export function POST(request: NextRequest) {
  return withUser(async () => {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return jsonError("Expected a multipart form upload.", 400);
    }

    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("No file provided.", 400);
    if (file.size === 0) return jsonError("File is empty.", 400);
    if (file.size > MAX_UPLOAD_BYTES) {
      return jsonError(`File is too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB).`, 413);
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // Trust the magic bytes, not the Content-Type header or the filename — both
    // are attacker-controlled, and a mislabeled .html would be served from our
    // own origin as script.
    const sniffed = sniffImageType(bytes);
    if (!sniffed || !ALLOWED_IMAGE_TYPES.has(sniffed)) {
      return jsonError("Unsupported image type. Use PNG, JPEG, WebP, GIF or AVIF.", 415);
    }

    const ext = extensionForType(sniffed);
    if (!ext) return jsonError("Unsupported image type.", 415);

    // Random name: never derived from the client filename, so there's no path
    // traversal and no overwriting someone else's upload.
    const name = `${Date.now().toString(36)}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
    const dir = uploadDir();
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);

    return Response.json({ url: `/uploads/intake/${name}`, type: sniffed, size: bytes.length }, { status: 201 });
  });
}
