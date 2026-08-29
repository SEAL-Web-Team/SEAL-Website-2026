import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  canonicalHost,
  canonicalHosts,
  canonicalOrigin,
  createAuthorizationUrl,
  getOAuthConfig,
  resolveRedirectUri,
} from "@/lib/intake/google";
import {
  PRE_COOKIE,
  cookieMaxAge,
  requestHost,
  requestIsSecure,
  safeReturnTo,
  signSession,
} from "@/lib/intake/session";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const cfg = getOAuthConfig();
  if (!cfg.configured) {
    return NextResponse.redirect(
      new URL(
        `/intake/login?error=${encodeURIComponent(
          "Google sign-in isn't configured on this server. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.",
        )}`,
        canonicalOrigin(request.url) || request.url,
      ),
    );
  }

  // Cookies are scoped per host, and "localhost" and "127.0.0.1" are different
  // hosts to the browser. If sign-in starts on one but Google returns to the
  // other, the pre-session cookie is simply not sent and every login fails with
  // a bogus "tampered with" error. Bounce to the callback's own host first so
  // the cookie is written where the callback will actually read it.
  // Read the Host header rather than nextUrl.host: the latter is normalized
  // (127.0.0.1 can surface as localhost), which would hide the very mismatch
  // we're looking for. x-forwarded-host wins behind a proxy.
  const viewingHost = requestHost(request);
  const callbackHost = canonicalHost();

  if (callbackHost && viewingHost && !canonicalHosts().includes(viewingHost)) {
    const target = new URL(request.nextUrl.toString());
    target.host = callbackHost;
    target.protocol = new URL(cfg.redirectUri).protocol;
    return NextResponse.redirect(target);
  }

  // CSRF defense: bind the state we send Google to a nonce held in a short-lived
  // cookie on THIS client. The callback rejects a state whose nonce doesn't match,
  // so an attacker can't complete OAuth in a victim's browser with their own code.
  const stateNonce = crypto.randomBytes(16).toString("hex");
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("return"));

  const response = NextResponse.redirect(
    createAuthorizationUrl({ stateNonce, redirectUri: resolveRedirectUri(viewingHost) }),
  );
  response.cookies.set(PRE_COOKIE, signSession({ returnTo, stateNonce, __pre: true }), {
    httpOnly: true,
    sameSite: "lax",
    secure: requestIsSecure(request),
    path: "/",
    maxAge: cookieMaxAge.pre,
  });
  return response;
}
