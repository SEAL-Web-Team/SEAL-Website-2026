import crypto from "node:crypto";

// Minimal Google OAuth client + the Drive "gate file" access check that decides
// SEAL membership. Same mechanism as TaskDeck: an admin grants access simply by
// sharing the Clan Life sheet, so Drive itself is the source of truth rather
// than a hand-maintained list.

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";

// Read-only Drive is all we need: the gate check is a files.get, and we never
// write to the user's Drive. Fewer scopes = a less alarming consent screen.
export const OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
];

export type GoogleProfile = {
  email?: string;
  name?: string;
  picture?: string;
};

// Byte-for-byte the URI registered on the lab's OAuth client, verified by
// probing Google's authorize endpoint. Note "127.0.0.1" — Google matches the
// redirect EXACTLY and "localhost" is a *different* URI to it, which fails with
// redirect_uri_mismatch. (TaskDeck's own .env says localhost and is stale.)
// Any non-local deployment must override this AND register the new value.
export const DEFAULT_REDIRECT_URI = "http://127.0.0.1:3000/auth/google/callback";

export function getOAuthConfig() {
  // Same precedence as TaskDeck's google/config.js, so its .env block can be
  // copied over verbatim and resolve to the same client.
  const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || "").trim();
  const clientSecret = (
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.AUTH_GOOGLE_SECRET ||
    ""
  ).trim();
  // Comma-separated, so one deployment can serve several addresses — a lab
  // machine on 127.0.0.1 and the same box over Tailscale, say. Google matches
  // redirect_uri byte-for-byte and every entry must be registered on the OAuth
  // client, but a request is answered with whichever entry matches the host the
  // browser actually used, so no cross-host cookie bounce is needed.
  const redirectUris = (
    process.env.INTAKE_GOOGLE_REDIRECT_URI ||
    process.env.GOOGLE_REDIRECT_URI ||
    DEFAULT_REDIRECT_URI
  )
    .split(",")
    .map((uri) => uri.trim())
    .filter(Boolean);
  const redirectUri = redirectUris[0] ?? "";
  return {
    clientId,
    clientSecret,
    redirectUri,
    redirectUris,
    scopes: OAUTH_SCOPES,
    configured: Boolean(clientId && clientSecret && redirectUri),
  };
}

function stateSecret(): string {
  return (
    process.env.INTAKE_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    getOAuthConfig().clientSecret ||
    "dev-unsafe-intake-state-secret"
  );
}

export function signState(payload: Record<string, unknown>, secret = stateSecret()): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

/** Throws on a tampered, malformed, or >15min-old state. */
export function verifyState(
  state: string | undefined | null,
  secret = stateSecret(),
): { issuedAt: number; nonce: string } {
  const [encoded, signature] = String(state || "").split(".");
  if (!encoded || !signature) throw new Error("OAuth state is missing.");

  const expected = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    throw new Error("OAuth state verification failed.");
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  if (!payload?.issuedAt || Date.now() - payload.issuedAt > 15 * 60_000) {
    throw new Error("OAuth state expired.");
  }
  return payload;
}

/**
 * Origin that post-auth redirects must target.
 *
 * NextRequest normalizes `request.url` to the server's own bind address, so on a
 * request to 127.0.0.1 it reports "localhost". Redirecting to that origin after
 * setting a cookie on 127.0.0.1 sends the browser to a DIFFERENT host, which
 * therefore sends no cookie — the user lands back on the login page. Anchoring
 * to the configured callback's origin keeps the cookie host and the landing host
 * identical.
 */
export function canonicalOriginFor(host: string | null | undefined, fallbackUrl?: string): string {
  try {
    return new URL(resolveRedirectUri(host)).origin;
  } catch {
    /* fall through */
  }
  try {
    return new URL(String(fallbackUrl)).origin;
  } catch {
    return "";
  }
}

export function canonicalOrigin(fallbackUrl?: string): string {
  try {
    return new URL(getOAuthConfig().redirectUri).origin;
  } catch {
    /* fall through */
  }
  try {
    return new URL(String(fallbackUrl)).origin;
  } catch {
    return "";
  }
}

export function createAuthorizationUrl({
  stateNonce,
  redirectUri,
}: {
  stateNonce: string;
  redirectUri?: string;
}): string {
  const cfg = getOAuthConfig();
  if (!cfg.configured) throw new Error("Google OAuth is not configured.");

  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri || cfg.redirectUri,
    response_type: "code",
    access_type: "online",
    prompt: "select_account",
    scope: cfg.scopes.join(" "),
    state: signState({ issuedAt: Date.now(), nonce: stateNonce }),
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

// redirectUri must be byte-identical to the one sent to the authorize endpoint,
// or Google rejects the exchange — hence passing it explicitly rather than
// re-reading the default.
export async function exchangeCodeForTokens(
  code: string,
  redirectUri?: string,
): Promise<{
  access_token: string;
  expires_in?: number;
  scope?: string;
}> {
  const cfg = getOAuthConfig();
  const body = new URLSearchParams({
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: redirectUri || cfg.redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Google token exchange failed: ${response.status} ${text}`);
  return JSON.parse(text);
}

export async function fetchUserProfile(accessToken: string): Promise<GoogleProfile> {
  try {
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return {};
    return (await response.json()) as GoogleProfile;
  } catch {
    return {};
  }
}

/**
 * Can THIS user's token read the gate file? A Drive files.get returning OK means
 * an admin has shared it with them, which is exactly what "is in SEAL" means here.
 * Any failure is treated as "no" — we fail closed.
 */
export async function checkDriveAccess(fileId: string, accessToken: string): Promise<boolean> {
  if (!fileId) return false;
  try {
    const response = await fetch(
      `${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}?fields=id&supportsAllDrives=true`,
      { headers: { authorization: `Bearer ${accessToken}` } },
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Host (including port) of the configured callback URI, or "" if it isn't a
 * valid URL.
 *
 * Google matches redirect_uri byte-for-byte, so sign-in can only ever complete
 * on this one host. Anything reaching the site at a different host (a LAN or
 * Tailscale name, say) has to be sent here first, or Google's redirect lands
 * somewhere the browser may not even be able to reach.
 */
export function canonicalHost(): string {
  return canonicalHosts()[0] ?? "";
}

/** Every host sign-in can complete on, in configured order. */
export function canonicalHosts(): string[] {
  return getOAuthConfig()
    .redirectUris.map((uri) => {
      try {
        return new URL(uri).host;
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}

/**
 * The callback URI to use for a browser that reached us at `host`.
 *
 * Falls back to the first configured URI, which is what the start route then
 * bounces an unrecognised host to.
 */
export function resolveRedirectUri(host: string | null | undefined): string {
  const cfg = getOAuthConfig();
  const match = cfg.redirectUris.find((uri) => {
    try {
      return new URL(uri).host === host;
    } catch {
      return false;
    }
  });
  return match ?? cfg.redirectUri;
}
