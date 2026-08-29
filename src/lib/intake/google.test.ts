import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_REDIRECT_URI,
  canonicalHost,
  canonicalHosts,
  canonicalOrigin,
  canonicalOriginFor,
  checkDriveAccess,
  createAuthorizationUrl,
  getOAuthConfig,
  resolveRedirectUri,
  signState,
  verifyState,
} from "./google";

const saved = { ...process.env };

afterEach(() => {
  process.env = { ...saved };
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function configureOAuth() {
  process.env.AUTH_GOOGLE_ID = "client-id";
  process.env.AUTH_GOOGLE_SECRET = "client-secret";
  process.env.INTAKE_GOOGLE_REDIRECT_URI = "https://seal.test/auth/google/callback";
}

describe("getOAuthConfig", () => {
  it("is not configured without a client id and secret", () => {
    delete process.env.AUTH_GOOGLE_ID;
    delete process.env.GOOGLE_CLIENT_ID;
    expect(getOAuthConfig().configured).toBe(false);
  });

  it("is not configured with an id but no secret", () => {
    process.env.AUTH_GOOGLE_ID = "client-id";
    delete process.env.AUTH_GOOGLE_SECRET;
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(getOAuthConfig().configured).toBe(false);
  });

  it("is configured when id, secret and redirect are all set", () => {
    configureOAuth();
    expect(getOAuthConfig().configured).toBe(true);
  });

  it("defaults the redirect URI to TaskDeck's exact registered URI", () => {
    process.env.AUTH_GOOGLE_ID = "client-id";
    process.env.AUTH_GOOGLE_SECRET = "client-secret";
    delete process.env.INTAKE_GOOGLE_REDIRECT_URI;
    delete process.env.GOOGLE_REDIRECT_URI;

    const cfg = getOAuthConfig();
    expect(cfg.redirectUri).toBe(DEFAULT_REDIRECT_URI);
    // "127.0.0.1", NOT localhost — Google matches the redirect byte-for-byte and
    // treats the two hosts as different URIs. Verified against the real client.
    expect(cfg.redirectUri).toBe("http://127.0.0.1:3000/auth/google/callback");
    expect(cfg.configured).toBe(true);
  });

  it("prefers GOOGLE_CLIENT_ID over AUTH_GOOGLE_ID, matching TaskDeck", () => {
    process.env.GOOGLE_CLIENT_ID = "google-client";
    process.env.AUTH_GOOGLE_ID = "auth-client";
    process.env.GOOGLE_CLIENT_SECRET = "google-secret";
    process.env.AUTH_GOOGLE_SECRET = "auth-secret";

    const cfg = getOAuthConfig();
    expect(cfg.clientId).toBe("google-client");
    expect(cfg.clientSecret).toBe("google-secret");
  });

  it("falls back to the AUTH_* names when the GOOGLE_* ones are absent", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    process.env.AUTH_GOOGLE_ID = "auth-client";
    process.env.AUTH_GOOGLE_SECRET = "auth-secret";

    const cfg = getOAuthConfig();
    expect(cfg.clientId).toBe("auth-client");
    expect(cfg.clientSecret).toBe("auth-secret");
  });

  it("lets an explicit redirect URI override the default", () => {
    configureOAuth();
    expect(getOAuthConfig().redirectUri).toBe("https://seal.test/auth/google/callback");
  });

  it("accepts TaskDeck's GOOGLE_REDIRECT_URI name as a fallback", () => {
    process.env.AUTH_GOOGLE_ID = "client-id";
    process.env.AUTH_GOOGLE_SECRET = "client-secret";
    delete process.env.INTAKE_GOOGLE_REDIRECT_URI;
    process.env.GOOGLE_REDIRECT_URI = "https://other.test/auth/google/callback";

    expect(getOAuthConfig().redirectUri).toBe("https://other.test/auth/google/callback");
  });

  it("only requests read-only Drive metadata (least privilege)", () => {
    expect(getOAuthConfig().scopes).toContain(
      "https://www.googleapis.com/auth/drive.metadata.readonly",
    );
    expect(getOAuthConfig().scopes.join(" ")).not.toContain("drive.file");
    expect(getOAuthConfig().scopes.join(" ")).not.toContain("spreadsheets");
  });
});

describe("signState / verifyState — OAuth CSRF binding", () => {
  it("round-trips a nonce", () => {
    const state = signState({ issuedAt: Date.now(), nonce: "n1" }, "s");
    expect(verifyState(state, "s").nonce).toBe("n1");
  });

  it("rejects a state signed with another secret", () => {
    const state = signState({ issuedAt: Date.now(), nonce: "n1" }, "secret-a");
    expect(() => verifyState(state, "secret-b")).toThrow(/verification failed/i);
  });

  it("rejects a tampered payload", () => {
    const state = signState({ issuedAt: Date.now(), nonce: "n1" }, "s");
    const [, sig] = state.split(".");
    const forged = Buffer.from(JSON.stringify({ issuedAt: Date.now(), nonce: "attacker" }))
      .toString("base64url");
    expect(() => verifyState(`${forged}.${sig}`, "s")).toThrow(/verification failed/i);
  });

  it.each([
    ["empty", ""],
    ["no signature", "abc"],
    ["null", null],
  ])("rejects a %s state", (_l, v) => {
    expect(() => verifyState(v as string, "s")).toThrow(/missing/i);
  });

  it("rejects a state older than 15 minutes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const state = signState({ issuedAt: Date.now(), nonce: "n1" }, "s");

    vi.setSystemTime(new Date("2026-01-01T00:15:01Z"));
    expect(() => verifyState(state, "s")).toThrow(/expired/i);
  });

  it("accepts a state just inside the window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const state = signState({ issuedAt: Date.now(), nonce: "n1" }, "s");

    vi.setSystemTime(new Date("2026-01-01T00:14:00Z"));
    expect(verifyState(state, "s").nonce).toBe("n1");
  });

  it("rejects a state with no issuedAt", () => {
    expect(() => verifyState(signState({ nonce: "n" }, "s"), "s")).toThrow(/expired/i);
  });
});

describe("createAuthorizationUrl", () => {
  it("throws when OAuth is not configured", () => {
    delete process.env.AUTH_GOOGLE_ID;
    delete process.env.GOOGLE_CLIENT_ID;
    expect(() => createAuthorizationUrl({ stateNonce: "n" })).toThrow(/not configured/i);
  });

  it("builds a Google consent URL carrying the signed state", () => {
    configureOAuth();
    const url = new URL(createAuthorizationUrl({ stateNonce: "nonce-123" }));

    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://seal.test/auth/google/callback",
    );
    expect(url.searchParams.get("response_type")).toBe("code");

    const state = url.searchParams.get("state")!;
    expect(verifyState(state).nonce).toBe("nonce-123");
  });

  it("never puts the client secret in the URL", () => {
    configureOAuth();
    expect(createAuthorizationUrl({ stateNonce: "n" })).not.toContain("client-secret");
  });
});

describe("checkDriveAccess — the SEAL membership probe", () => {
  it("returns false with no file id, without calling Google", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect(checkDriveAccess("", "token")).resolves.toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns true on a 200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    await expect(checkDriveAccess("file-1", "token")).resolves.toBe(true);
  });

  it.each([403, 404, 401, 500])("returns false on a %i", async (status) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status }));
    await expect(checkDriveAccess("file-1", "token")).resolves.toBe(false);
  });

  it("fails closed when the network throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    await expect(checkDriveAccess("file-1", "token")).resolves.toBe(false);
  });

  it("sends the user's bearer token and escapes the file id", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    await checkDriveAccess("a/b?c", "user-token");

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(encodeURIComponent("a/b?c"));
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer user-token");
  });
});

// The one host Google will ever redirect back to. Sign-in reached at any other
// host has to be sent here first, and the login page warns rather than letting
// the browser bounce to an address it may not be able to reach.
describe("canonicalHost / canonicalOrigin", () => {
  it("reads the host and origin out of the default redirect URI", () => {
    expect(canonicalHost()).toBe("127.0.0.1:3000");
    expect(canonicalOrigin()).toBe("http://127.0.0.1:3000");
  });

  it("follows an overridden redirect URI, port and all", () => {
    process.env.INTAKE_GOOGLE_REDIRECT_URI = "https://seal.uw.edu:8443/auth/google/callback";
    expect(canonicalHost()).toBe("seal.uw.edu:8443");
    expect(canonicalOrigin()).toBe("https://seal.uw.edu:8443");
  });

  it("omits the port when it is the scheme default", () => {
    process.env.INTAKE_GOOGLE_REDIRECT_URI = "https://seal.uw.edu/auth/google/callback";
    expect(canonicalHost()).toBe("seal.uw.edu");
  });

  it("returns empty rather than throwing on a malformed redirect URI", () => {
    process.env.INTAKE_GOOGLE_REDIRECT_URI = "not a url";
    expect(canonicalHost()).toBe("");
  });

  it("distinguishes localhost from 127.0.0.1 — they are different hosts to a browser", () => {
    process.env.INTAKE_GOOGLE_REDIRECT_URI = "http://localhost:3000/auth/google/callback";
    expect(canonicalHost()).toBe("localhost:3000");
    expect(canonicalHost()).not.toBe("127.0.0.1:3000");
  });

  it("canonicalOrigin falls back to the request URL when the config is unusable", () => {
    process.env.INTAKE_GOOGLE_REDIRECT_URI = "not a url";
    expect(canonicalOrigin("http://example.test:3000/x?y=1")).toBe("http://example.test:3000");
  });
});

// One deployment, several addresses: the lab box on loopback and the same box
// over Tailscale. Every entry has to be registered on the OAuth client, and a
// request must be answered with the entry matching the host the browser used —
// mixing them up is the cross-host cookie bug all over again.
describe("multiple redirect URIs", () => {
  const LOOPBACK = "http://127.0.0.1:3000/auth/google/callback";
  const TAILNET = "https://bestop.tail0ff8e.ts.net/auth/google/callback";

  const configureBoth = () => {
    process.env.AUTH_GOOGLE_ID = "client-id";
    process.env.AUTH_GOOGLE_SECRET = "client-secret";
    process.env.INTAKE_GOOGLE_REDIRECT_URI = `${LOOPBACK},${TAILNET}`;
  };

  it("parses a comma-separated list", () => {
    configureBoth();
    expect(getOAuthConfig().redirectUris).toEqual([LOOPBACK, TAILNET]);
    expect(canonicalHosts()).toEqual(["127.0.0.1:3000", "bestop.tail0ff8e.ts.net"]);
  });

  it("tolerates stray whitespace and empty entries", () => {
    configureBoth();
    process.env.INTAKE_GOOGLE_REDIRECT_URI = `  ${LOOPBACK} , , ${TAILNET},`;
    expect(getOAuthConfig().redirectUris).toEqual([LOOPBACK, TAILNET]);
  });

  it("treats the first entry as the canonical one", () => {
    configureBoth();
    expect(getOAuthConfig().redirectUri).toBe(LOOPBACK);
    expect(canonicalHost()).toBe("127.0.0.1:3000");
    expect(canonicalOrigin()).toBe("http://127.0.0.1:3000");
  });

  it("answers each host with its own registered URI", () => {
    configureBoth();
    expect(resolveRedirectUri("127.0.0.1:3000")).toBe(LOOPBACK);
    expect(resolveRedirectUri("bestop.tail0ff8e.ts.net")).toBe(TAILNET);
  });

  it("falls back to the canonical URI for an unregistered host", () => {
    configureBoth();
    expect(resolveRedirectUri("evil.example")).toBe(LOOPBACK);
    expect(resolveRedirectUri(null)).toBe(LOOPBACK);
    expect(resolveRedirectUri("")).toBe(LOOPBACK);
  });

  it("sends Google the redirect_uri for the host in play", () => {
    configureBoth();
    const url = new URL(
      createAuthorizationUrl({ stateNonce: "n", redirectUri: resolveRedirectUri("bestop.tail0ff8e.ts.net") }),
    );
    expect(url.searchParams.get("redirect_uri")).toBe(TAILNET);
  });

  it("defaults to the canonical URI when none is passed", () => {
    configureBoth();
    const url = new URL(createAuthorizationUrl({ stateNonce: "n" }));
    expect(url.searchParams.get("redirect_uri")).toBe(LOOPBACK);
  });

  it("anchors post-auth redirects to the origin of the host in play", () => {
    configureBoth();
    // Landing the user on the other origin is what makes the session cookie
    // invisible and bounces them back to the login page.
    expect(canonicalOriginFor("bestop.tail0ff8e.ts.net")).toBe("https://bestop.tail0ff8e.ts.net");
    expect(canonicalOriginFor("127.0.0.1:3000")).toBe("http://127.0.0.1:3000");
    expect(canonicalOriginFor("evil.example")).toBe("http://127.0.0.1:3000");
  });

  it("falls back to the request URL when nothing is configured", () => {
    process.env.INTAKE_GOOGLE_REDIRECT_URI = "not a url";
    expect(canonicalOriginFor("anything", "http://example.test:3000/x")).toBe(
      "http://example.test:3000",
    );
  });

  it("still works with a single URI and no commas", () => {
    process.env.AUTH_GOOGLE_ID = "client-id";
    process.env.AUTH_GOOGLE_SECRET = "client-secret";
    delete process.env.INTAKE_GOOGLE_REDIRECT_URI;
    delete process.env.GOOGLE_REDIRECT_URI;
    expect(getOAuthConfig().redirectUris).toEqual([DEFAULT_REDIRECT_URI]);
    expect(resolveRedirectUri("127.0.0.1:3000")).toBe(DEFAULT_REDIRECT_URI);
  });
});
