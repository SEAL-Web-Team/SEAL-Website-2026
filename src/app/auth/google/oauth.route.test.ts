import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  PRE_COOKIE,
  SESSION_COOKIE,
  readSession,
  signSession,
} from "@/lib/intake/session";
import { signState } from "@/lib/intake/google";
import { cookieJar } from "@/lib/intake/__tests__/next-headers-mock";

vi.mock("next/headers", () => import("@/lib/intake/__tests__/next-headers-mock"));

// The network-touching parts of the Google client are stubbed; the state
// signing/verifying stays real so the CSRF binding is genuinely exercised.
vi.mock("@/lib/intake/google", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/intake/google")>();
  return {
    ...actual,
    exchangeCodeForTokens: vi.fn(),
    fetchUserProfile: vi.fn(),
    checkDriveAccess: vi.fn(),
  };
});

const google = await import("@/lib/intake/google");
const { GET: start } = await import("./start/route");
const { GET: callback } = await import("./callback/route");
// logout + me stay under /api/intake — only the OAuth dance moved to /auth/google.
const { POST: logout } = await import("@/app/api/intake/auth/logout/route");
const { GET: me } = await import("@/app/api/intake/me/route");

const GATE_FILE = "clan-life-sheet-id";
const saved = { ...process.env };

beforeEach(() => {
  process.env = { ...saved };
  process.env.AUTH_GOOGLE_ID = "client-id";
  process.env.AUTH_GOOGLE_SECRET = "client-secret";
  process.env.INTAKE_GOOGLE_REDIRECT_URI = "https://seal.test/auth/google/callback";
  process.env.INTAKE_ACCESS_DRIVE_FILE_ID = GATE_FILE;
  cookieJar.clear();
  vi.mocked(google.exchangeCodeForTokens).mockResolvedValue({ access_token: "at" });
  vi.mocked(google.fetchUserProfile).mockResolvedValue({
    email: "member@uw.edu",
    name: "Member",
  });
  vi.mocked(google.checkDriveAccess).mockResolvedValue(true);
});

afterEach(() => {
  process.env = { ...saved };
  vi.clearAllMocks();
});

/** Build a callback request whose state nonce matches its pre-session cookie. */
function callbackRequest({
  nonce = "nonce-1",
  cookieNonce = nonce as string | null,
  code = "auth-code",
  returnTo = "/intake",
  error,
}: {
  nonce?: string;
  cookieNonce?: string | null;
  code?: string | null;
  returnTo?: string;
  error?: string;
} = {}) {
  const url = new URL("https://seal.test/auth/google/callback");
  if (code) url.searchParams.set("code", code);
  if (error) url.searchParams.set("error", error);
  if (!error) url.searchParams.set("state", signState({ issuedAt: Date.now(), nonce }));

  const request = new NextRequest(url);
  if (cookieNonce !== null) {
    request.cookies.set(
      PRE_COOKIE,
      signSession({ stateNonce: cookieNonce, returnTo, __pre: true }),
    );
  }
  return request;
}

const locationOf = (response: Response) => new URL(response.headers.get("location")!);
const errorParam = (response: Response) => locationOf(response).searchParams.get("error") ?? "";
const sessionCookie = (response: Response) =>
  // NextResponse cookies land in Set-Cookie; read them via the typed accessor.
  (response as unknown as { cookies: { get(n: string): { value: string } | undefined } }).cookies.get(
    SESSION_COOKIE,
  );

describe("GET /auth/google/start", () => {
  it("redirects to Google and plants a pre-session cookie", () => {
    const response = start(new NextRequest("https://seal.test/auth/google/start"));

    expect(response.status).toBe(307);
    expect(locationOf(response).host).toBe("accounts.google.com");
    expect(response.cookies.get(PRE_COOKIE)?.value).toBeTruthy();
  });

  it("binds the state nonce to the cookie so the callback can verify it", () => {
    const response = start(new NextRequest("https://seal.test/auth/google/start"));

    const stateNonce = google.verifyState(locationOf(response).searchParams.get("state")).nonce;
    const cookieNonce = (
      JSON.parse(
        Buffer.from(response.cookies.get(PRE_COOKIE)!.value.split(".")[0], "base64url").toString(),
      ) as { stateNonce: string }
    ).stateNonce;

    expect(stateNonce).toBe(cookieNonce);
  });

  it("marks the pre cookie httpOnly", () => {
    const response = start(new NextRequest("https://seal.test/auth/google/start"));
    expect(response.cookies.get(PRE_COOKIE)?.httpOnly).toBe(true);
  });

  it("keeps a same-origin return path", () => {
    const response = start(
      new NextRequest("https://seal.test/auth/google/start?return=%2Fintake%2Fnew"),
    );
    const pre = JSON.parse(
      Buffer.from(response.cookies.get(PRE_COOKIE)!.value.split(".")[0], "base64url").toString(),
    );
    expect(pre.returnTo).toBe("/intake/new");
  });

  it("discards an off-site return path (open redirect)", () => {
    const response = start(
      new NextRequest("https://seal.test/auth/google/start?return=https%3A%2F%2Fevil.com"),
    );
    const pre = JSON.parse(
      Buffer.from(response.cookies.get(PRE_COOKIE)!.value.split(".")[0], "base64url").toString(),
    );
    expect(pre.returnTo).toBe("/intake");
  });

  it("sends the user to the login page when OAuth isn't configured", () => {
    delete process.env.AUTH_GOOGLE_ID;
    delete process.env.GOOGLE_CLIENT_ID;
    const response = start(new NextRequest("https://seal.test/auth/google/start"));

    expect(locationOf(response).pathname).toBe("/intake/login");
    expect(errorParam(response)).toMatch(/isn't configured/i);
  });

  // Cookies are per-host: starting on "localhost" while the registered callback
  // is on "127.0.0.1" silently drops the pre-session cookie and every login
  // fails with a bogus "tampered with" error. NextRequest normalizes 127.0.0.1
  // in nextUrl, so the Host header — what a browser really sends — is the thing
  // under test here.
  describe("canonical host bounce", () => {
    const startOn = (host: string, query = "") =>
      start(
        new NextRequest(`http://${host}:3000/auth/google/start${query}`, {
          headers: { host: `${host}:3000` },
        }),
      );

    beforeEach(() => {
      process.env.INTAKE_GOOGLE_REDIRECT_URI = "http://127.0.0.1:3000/auth/google/callback";
    });

    it("redirects to the callback's host instead of starting OAuth there", () => {
      const response = startOn("localhost");
      const location = locationOf(response);

      expect(location.host).toBe("127.0.0.1:3000");
      expect(location.pathname).toBe("/auth/google/start");
      // Must not have gone to Google yet — and must not have set a cookie on the
      // wrong host, where the callback could never read it.
      expect(location.hostname).not.toBe("accounts.google.com");
      expect(response.cookies.get(PRE_COOKIE)?.value).toBeFalsy();
    });

    it("preserves the return path across the bounce", () => {
      const response = startOn("localhost", "?return=%2Fintake%2Fnew");
      expect(locationOf(response).searchParams.get("return")).toBe("/intake/new");
    });

    it("proceeds straight to Google when already on the right host", () => {
      const response = startOn("127.0.0.1");

      expect(locationOf(response).host).toBe("accounts.google.com");
      expect(response.cookies.get(PRE_COOKIE)?.value).toBeTruthy();
    });

    it("honours x-forwarded-host behind a proxy", () => {
      process.env.INTAKE_GOOGLE_REDIRECT_URI = "https://uwseal.org/auth/google/callback";
      const response = start(
        new NextRequest("http://internal:3000/auth/google/start", {
          headers: { host: "internal:3000", "x-forwarded-host": "uwseal.org" },
        }),
      );
      // The proxy's public host already matches the callback — no bounce.
      expect(locationOf(response).host).toBe("accounts.google.com");
    });
  });
});

describe("GET /auth/google/callback — the SEAL gate", () => {
  it("admits a member who can read the Clan Life sheet", async () => {
    const response = await callback(callbackRequest());

    expect(locationOf(response).pathname).toBe("/intake");
    const cookie = sessionCookie(response);
    expect(readSession(cookie!.value)).toMatchObject({ email: "member@uw.edu", name: "Member" });
  });

  it("checks the gate with the caller's own access token", async () => {
    await callback(callbackRequest());
    expect(google.checkDriveAccess).toHaveBeenCalledWith(GATE_FILE, "at");
  });

  it("denies someone who cannot read the sheet, and issues no session", async () => {
    vi.mocked(google.checkDriveAccess).mockResolvedValue(false);

    const response = await callback(callbackRequest());

    expect(locationOf(response).pathname).toBe("/intake/login");
    expect(errorParam(response)).toMatch(/not in SEAL/i);
    expect(sessionCookie(response)?.value).toBeFalsy();
  });

  it("still admits a denied user who is on the allowlist", async () => {
    vi.mocked(google.checkDriveAccess).mockResolvedValue(false);
    process.env.INTAKE_ALLOWED_EMAILS = "member@uw.edu";

    const response = await callback(callbackRequest());
    expect(locationOf(response).pathname).toBe("/intake");
  });

  it("still admits a denied user who is an admin", async () => {
    vi.mocked(google.checkDriveAccess).mockResolvedValue(false);
    process.env.INTAKE_ADMIN_EMAILS = "member@uw.edu";

    const response = await callback(callbackRequest());
    expect(locationOf(response).pathname).toBe("/intake");
  });

  it("lowercases the session email so ownership checks line up", async () => {
    vi.mocked(google.fetchUserProfile).mockResolvedValue({ email: "MiXeD@UW.edu" });

    const response = await callback(callbackRequest());
    expect(readSession(sessionCookie(response)!.value)?.email).toBe("mixed@uw.edu");
  });

  it("honours the returnTo from the pre cookie", async () => {
    const response = await callback(callbackRequest({ returnTo: "/intake/new" }));
    expect(locationOf(response).pathname).toBe("/intake/new");
  });

  // Regression: request.url is normalized to the server's bind address, so it
  // can say "localhost" for a request that arrived on 127.0.0.1. Redirecting
  // there after setting the cookie on 127.0.0.1 crosses a host boundary, the
  // browser withholds the cookie, and the user bounces back to /intake/login.
  describe("lands the user on the same host the cookie was set for", () => {
    it("redirects to the callback's origin, not request.url's", async () => {
      process.env.INTAKE_GOOGLE_REDIRECT_URI = "http://127.0.0.1:3000/auth/google/callback";
      const request = callbackRequest();
      // Simulate the normalization: the request object reports localhost.
      expect(new URL(request.url).host).not.toBe("127.0.0.1:3000");

      const response = await callback(request);

      expect(locationOf(response).origin).toBe("http://127.0.0.1:3000");
      expect(sessionCookie(response)).toBeTruthy();
    });

    it("keeps the deny redirect on the same origin too", async () => {
      process.env.INTAKE_GOOGLE_REDIRECT_URI = "http://127.0.0.1:3000/auth/google/callback";
      vi.mocked(google.checkDriveAccess).mockResolvedValue(false);

      const response = await callback(callbackRequest());
      expect(locationOf(response).origin).toBe("http://127.0.0.1:3000");
    });
  });

  it("ignores an off-site returnTo smuggled into the pre cookie", async () => {
    const response = await callback(callbackRequest({ returnTo: "//evil.com" }));
    expect(locationOf(response).host).toBe("seal.test");
    expect(locationOf(response).pathname).toBe("/intake");
  });

  describe("CSRF and error handling", () => {
    it("rejects a state whose nonce doesn't match the cookie", async () => {
      const response = await callback(callbackRequest({ nonce: "attacker", cookieNonce: "victim" }));

      expect(errorParam(response)).toMatch(/expired or was tampered/i);
      expect(sessionCookie(response)?.value).toBeFalsy();
    });

    it("rejects a callback with no pre-session cookie at all", async () => {
      const response = await callback(callbackRequest({ cookieNonce: null }));
      expect(errorParam(response)).toMatch(/expired or was tampered/i);
    });

    it("rejects a state signed with the wrong secret", async () => {
      const url = new URL("https://seal.test/auth/google/callback");
      url.searchParams.set("code", "c");
      url.searchParams.set(
        "state",
        signState({ issuedAt: Date.now(), nonce: "n" }, "some-other-secret"),
      );
      const request = new NextRequest(url);
      request.cookies.set(PRE_COOKIE, signSession({ stateNonce: "n", __pre: true }));

      expect(errorParam(await callback(request))).toBeTruthy();
      expect(sessionCookie(await callback(request))?.value).toBeFalsy();
    });

    it("reports a cancelled consent screen", async () => {
      const response = await callback(callbackRequest({ error: "access_denied", code: null }));
      expect(errorParam(response)).toMatch(/cancelled/i);
    });

    it("reports a missing authorization code", async () => {
      const response = await callback(callbackRequest({ code: null }));
      expect(errorParam(response)).toMatch(/no authorization code/i);
    });

    it("denies when Google shares no email", async () => {
      vi.mocked(google.fetchUserProfile).mockResolvedValue({});

      const response = await callback(callbackRequest());
      expect(errorParam(response)).toMatch(/did not share an email/i);
      expect(sessionCookie(response)?.value).toBeFalsy();
    });

    it("denies when the token exchange fails", async () => {
      vi.mocked(google.exchangeCodeForTokens).mockRejectedValue(new Error("exchange boom"));

      const response = await callback(callbackRequest());
      expect(locationOf(response).pathname).toBe("/intake/login");
      expect(sessionCookie(response)?.value).toBeFalsy();
    });

    it("denies when Google returns no access token", async () => {
      vi.mocked(google.exchangeCodeForTokens).mockResolvedValue({ access_token: "" });

      const response = await callback(callbackRequest());
      expect(errorParam(response)).toMatch(/access token/i);
    });
  });
});

describe("POST /api/intake/auth/logout", () => {
  it("clears the session cookie", () => {
    const response = logout();
    expect(response.cookies.get(SESSION_COOKIE)?.value).toBeFalsy();
  });
});

describe("GET /api/intake/me", () => {
  it("reports signed out with no cookie", async () => {
    cookieJar.clear();
    expect(await (await me()).json()).toEqual({ signedIn: false });
  });

  it("reports the signed-in member", async () => {
    cookieJar.set(SESSION_COOKIE, signSession({ email: "member@uw.edu", name: "Member" }));
    expect(await (await me()).json()).toMatchObject({
      signedIn: true,
      email: "member@uw.edu",
      name: "Member",
    });
  });
});
