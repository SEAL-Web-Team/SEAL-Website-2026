import crypto from "node:crypto";

// HMAC-signed stateless session cookie. Ported from TaskDeck's src/auth/session.js
// so both apps gate on the same mechanism; kept as pure functions here so the
// signing rules can be unit-tested without a server or a real OAuth round-trip.

export const SESSION_COOKIE = "seal_intake_session";
export const PRE_COOKIE = "seal_intake_pre";

const DEFAULT_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days
const SESSION_MAX_AGE_MS = DEFAULT_MAX_AGE_SEC * 1000;
const PRE_MAX_AGE_SEC = 600; // 10 min — only needs to survive the OAuth redirect

const DEV_FALLBACK_SECRET = "dev-unsafe-intake-secret-set-INTAKE_SESSION_SECRET";

export type SessionPayload = {
  email: string;
  name?: string;
  picture?: string;
  iat?: number;
};

export type PrePayload = {
  returnTo?: string;
  stateNonce: string;
  __pre: true;
  iat?: number;
};

function getSecret(): string {
  const explicit =
    process.env.INTAKE_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.AUTH_GOOGLE_SECRET ||
    "";
  if (explicit) return explicit;
  // Never fall back to the well-known dev secret in production — anyone could
  // forge a session cookie. Fail loudly instead.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "INTAKE_SESSION_SECRET (or AUTH_SECRET / AUTH_GOOGLE_SECRET) must be set in production. " +
        "Refusing to use the dev fallback secret — sessions would be forgeable.",
    );
  }
  return DEV_FALLBACK_SECRET;
}

function sign(body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("base64url");
}

export function signSession(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString("base64url");
  return `${body}.${sign(body, getSecret())}`;
}

export function verifySession<T = SessionPayload>(
  value: string | undefined | null,
  { maxAgeMs = SESSION_MAX_AGE_MS }: { maxAgeMs?: number } = {},
): T | null {
  if (!value || typeof value !== "string") return null;
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;

  const expected = sign(body, getSecret());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  // Length check first: timingSafeEqual throws on mismatched lengths.
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  // Reject tokens older than the max age even if the browser still presents
  // them — defense in depth against a stolen cookie being replayed.
  const iat = parsed?.iat;
  if (typeof iat !== "number" || iat <= 0) return null;
  if (Date.now() - iat > maxAgeMs) return null;

  return parsed as T;
}

/** Read an authenticated session. Pre-OAuth cookies can never be promoted into one. */
export function readSession(cookieValue: string | undefined | null): SessionPayload | null {
  const session = verifySession<SessionPayload & { __pre?: boolean }>(cookieValue);
  if (!session || session.__pre) return null;
  if (!session.email) return null;
  return session;
}

/** Read the short-lived pre-OAuth cookie (returnTo + CSRF state nonce). */
export function readPreSession(cookieValue: string | undefined | null): PrePayload | null {
  const pre = verifySession<PrePayload>(cookieValue, { maxAgeMs: PRE_MAX_AGE_SEC * 1000 });
  if (!pre || pre.__pre !== true || !pre.stateNonce) return null;
  return pre;
}

export const cookieMaxAge = {
  session: DEFAULT_MAX_AGE_SEC,
  pre: PRE_MAX_AGE_SEC,
};

/**
 * Only same-origin absolute paths may be used as a post-login redirect.
 *
 * Rejects anything whose second character is a slash OR a backslash: browsers
 * normalize `/\evil.com` (and `\\evil.com`) to the protocol-relative
 * `//evil.com` and navigate off-site, so checking for `//` alone is not enough.
 */
export function safeReturnTo(value: string | undefined | null, fallback = "/intake"): string {
  const v = String(value || "");
  if (!v.startsWith("/")) return fallback;
  if (v[1] === "/" || v[1] === "\\") return fallback;
  // A backslash anywhere in the authority position is normalized by browsers;
  // legitimate app paths never contain one.
  if (v.includes("\\")) return fallback;
  return v;
}

/**
 * Host (incl. port) the browser actually used, honouring a reverse proxy.
 *
 * `nextUrl.host` is normalized to the server's bind address (127.0.0.1 can
 * surface as localhost), which would hide exactly the mismatch callers look
 * for — read the headers instead.
 */
export function requestHost(request: {
  headers: { get(name: string): string | null };
  nextUrl: { host: string };
}): string {
  return (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host
  );
}

/**
 * Whether the browser reached us over HTTPS.
 *
 * Behind a TLS-terminating proxy (`tailscale serve`, a load balancer) the app
 * itself only ever sees plain HTTP, so trusting the local protocol would drop
 * the Secure flag from session cookies on a site the user is browsing over
 * HTTPS. x-forwarded-proto may be a comma-separated chain; the first entry is
 * the original client.
 */
export function requestIsSecure(request: {
  headers: { get(name: string): string | null };
  nextUrl: { protocol: string };
}): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0].trim().toLowerCase() === "https";
  return request.nextUrl.protocol === "https:";
}
