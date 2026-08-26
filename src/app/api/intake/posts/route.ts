import type { NextRequest } from "next/server";
import { jsonError, withUser } from "@/lib/intake/auth";
import { validateSubmission } from "@/lib/intake/schema";
import { getStore } from "@/lib/intake/store";

export const dynamic = "force-dynamic";

/** The signed-in member's own posts, drafts included. */
export function GET() {
  return withUser(async (user) => Response.json({ posts: getStore().listByAuthor(user.email) }));
}

export function POST(request: NextRequest) {
  return withUser(async (user) => {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return jsonError("Request body must be JSON.", 400);
    }

    const parsed = validateSubmission(payload);
    if (!parsed.success) return jsonError(parsed.error, 422);

    const post = getStore().create(parsed.data, { email: user.email, name: user.name });
    return Response.json({ post }, { status: 201 });
  });
}
