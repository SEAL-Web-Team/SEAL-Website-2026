import { cookies } from "next/headers";
import { readSession, SESSION_COOKIE, type SessionPayload } from "./session";

/** The signed-in SEAL member, or null. Route handlers gate on this. */
export async function currentUser(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value);
}

export class Unauthorized extends Error {
  constructor(message = "Sign in with your SEAL Google account.") {
    super(message);
    this.name = "Unauthorized";
  }
}

export async function requireUser(): Promise<SessionPayload> {
  const user = await currentUser();
  if (!user) throw new Unauthorized();
  return user;
}

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/**
 * Wraps a handler so an Unauthorized throw becomes a 401 and anything else a 500,
 * keeping internal error text out of the response body.
 */
export async function withUser(
  handler: (user: SessionPayload) => Promise<Response>,
): Promise<Response> {
  try {
    return await handler(await requireUser());
  } catch (error) {
    if (error instanceof Unauthorized) return jsonError(error.message, 401);
    console.error("[intake] handler failed:", error);
    return jsonError("Something went wrong.", 500);
  }
}
