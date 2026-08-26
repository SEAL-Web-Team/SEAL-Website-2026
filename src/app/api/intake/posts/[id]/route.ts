import type { NextRequest } from "next/server";
import { getAccessConfig } from "@/lib/intake/access-gate";
import { jsonError, withUser } from "@/lib/intake/auth";
import { validateSubmission } from "@/lib/intake/schema";
import { getStore, type Post } from "@/lib/intake/store";
import type { SessionPayload } from "@/lib/intake/session";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Resolve a post the caller is allowed to act on. Someone else's post reports
 * "not found" rather than "forbidden" so drafts can't be enumerated.
 */
function ownedPost(id: number, user: SessionPayload): Post | null {
  const post = getStore().get(id);
  if (!post) return null;
  const isAdmin = getAccessConfig().isAdmin(user.email);
  if (post.authorEmail !== user.email.toLowerCase() && !isAdmin) return null;
  return post;
}

async function parseId(ctx: Ctx): Promise<number | null> {
  const { id } = await ctx.params;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function GET(_request: NextRequest, ctx: Ctx) {
  return withUser(async (user) => {
    const id = await parseId(ctx);
    if (id === null) return jsonError("Not found.", 404);
    const post = ownedPost(id, user);
    return post ? Response.json({ post }) : jsonError("Not found.", 404);
  });
}

export function PATCH(request: NextRequest, ctx: Ctx) {
  return withUser(async (user) => {
    const id = await parseId(ctx);
    if (id === null) return jsonError("Not found.", 404);
    const existing = ownedPost(id, user);
    if (!existing) return jsonError("Not found.", 404);

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return jsonError("Request body must be JSON.", 400);
    }

    const parsed = validateSubmission(payload, {
      partial: true,
      existingSection: existing.section,
      existing: { status: existing.status, fields: existing.fields },
    });
    if (!parsed.success) return jsonError(parsed.error, 422);

    return Response.json({ post: getStore().update(id, parsed.data) });
  });
}

export function DELETE(_request: NextRequest, ctx: Ctx) {
  return withUser(async (user) => {
    const id = await parseId(ctx);
    if (id === null) return jsonError("Not found.", 404);
    if (!ownedPost(id, user)) return jsonError("Not found.", 404);
    getStore().remove(id);
    return Response.json({ ok: true });
  });
}
