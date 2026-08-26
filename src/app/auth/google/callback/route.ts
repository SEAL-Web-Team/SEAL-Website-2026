import { NextResponse, type NextRequest } from "next/server";
import { evaluateAccessGate, getAccessConfig } from "@/lib/intake/access-gate";
import {
  canonicalOriginFor,
  checkDriveAccess,
  exchangeCodeForTokens,
  fetchUserProfile,
  getOAuthConfig,
  resolveRedirectUri,
  verifyState,
} from "@/lib/intake/google";
import {
  PRE_COOKIE,
  SESSION_COOKIE,
  cookieMaxAge,
  readPreSession,
  requestHost,
  requestIsSecure,
  safeReturnTo,
  signSession,
} from "@/lib/intake/session";

export const dynamic = "force-dynamic";

function deny(request: NextRequest, message: string) {
  const response = NextResponse.redirect(
    new URL(
      `/intake/login?error=${encodeURIComponent(message)}`,
      canonicalOriginFor(requestHost(request), request.url) || request.url,
    ),
  );
  response.cookies.delete(PRE_COOKIE);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  // Google sends ?error=access_denied when the user cancels the consent screen.
  const oauthError = params.get("error");
  if (oauthError) {
    return deny(
      request,
      oauthError === "access_denied" ? "Sign-in cancelled." : `Google sign-in failed: ${oauthError}`,
    );
  }

  const code = params.get("code");
  if (!code) return deny(request, "Google sign-in failed: no authorization code.");
  if (!getOAuthConfig().configured) return deny(request, "Google sign-in isn't configured.");

  const pre = readPreSession(request.cookies.get(PRE_COOKIE)?.value);

  try {
    // The signed state must be intact, unexpired, AND carry the nonce we planted
    // in this browser at /start. Unlike TaskDeck we require the pre-cookie —
    // it round-trips fine here because start and callback share one origin.
    const state = verifyState(params.get("state"));
    if (!pre || state.nonce !== pre.stateNonce) {
      return deny(request, "Sign-in expired or was tampered with. Please try again.");
    }

    // Must match the redirect_uri the start route sent to Google. It resolved
    // that from the host the browser used, and Google just sent the browser
    // back to that same host, so resolving again here yields the same value.
    const tokens = await exchangeCodeForTokens(code, resolveRedirectUri(requestHost(request)));
    const accessToken = tokens.access_token;
    if (!accessToken) return deny(request, "Google did not return an access token.");

    const profile = await fetchUserProfile(accessToken);
    const email = String(profile.email || "").toLowerCase();
    if (!email) return deny(request, "Google did not share an email address for this account.");

    // Authorization: can this account read the Clan Life gate file? Sharing the
    // sheet IS the grant. Allowlist and admin list are additional allow paths and
    // never independently block someone the sheet lets in.
    const access = getAccessConfig();
    const canReadGate = access.gateFileId
      ? await checkDriveAccess(access.gateFileId, accessToken)
      : false;

    const gate = evaluateAccessGate({
      gateFileConfigured: Boolean(access.gateFileId),
      canReadGate,
      allowlistConfigured: access.allowlist.size > 0,
      onAllowlist: access.isAllowed(email),
      isAdmin: access.isAdmin(email),
      adminCount: access.admins.size,
      strict: access.strict,
      email,
    });

    console.log(
      `[intake] gate — email=${email} policy=${gate.policy} canReadGate=${canReadGate} → ${
        gate.admitted ? "ADMITTED" : `DENIED (${gate.denyReason})`
      }`,
    );

    if (!gate.admitted) return deny(request, `Access denied. ${gate.denyReason}`);

    // Anchor to the origin registered for THIS host, not request.url and not
    // the first configured URI. Getting this wrong sets the session cookie on
    // one host and lands the user on another, so they bounce straight back to
    // the login page — see canonicalOriginFor.
    const response = NextResponse.redirect(
      new URL(
        safeReturnTo(pre.returnTo),
        canonicalOriginFor(requestHost(request), request.url) || request.url,
      ),
    );
    response.cookies.set(
      SESSION_COOKIE,
      signSession({ email, name: profile.name || "", picture: profile.picture || "" }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: requestIsSecure(request),
        path: "/",
        maxAge: cookieMaxAge.session,
      },
    );
    response.cookies.delete(PRE_COOKIE);
    return response;
  } catch (error) {
    console.error("[intake] OAuth callback failed:", error);
    return deny(request, error instanceof Error ? error.message : "OAuth callback failed.");
  }
}
