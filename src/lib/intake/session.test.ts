import { describe, expect, it, vi, afterEach } from "vitest";
import {
  readPreSession,
  readSession,
  requestHost,
  requestIsSecure,
  safeReturnTo,
  signSession,
  verifySession,
} from "./session";

afterEach(() => {
  vi.useRealTimers();
});

describe("signSession / verifySession", () => {
  it("round-trips a payload", () => {
    const token = signSession({ email: "a@uw.edu", name: "A" });
    expect(verifySession(token)).toMatchObject({ email: "a@uw.edu", name: "A" });
  });

  it("stamps iat", () => {
    expect(verifySession(signSession({ email: "a@uw.edu" }))?.iat).toBeTypeOf("number");
  });

  it.each([
    ["empty string", ""],
    ["null", null],
    ["undefined", undefined],
    ["no separator", "notoken"],
    ["missing signature", "eyJhIjoxfQ"],
    ["empty signature", "eyJhIjoxfQ."],
  ])("rejects %s", (_label, value) => {
    expect(verifySession(value as string)).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const [, sig] = signSession({ email: "a@uw.edu" }).split(".");
    const forged = Buffer.from(JSON.stringify({ email: "attacker@evil.com", iat: Date.now() }))
      .toString("base64url");
    expect(verifySession(`${forged}.${sig}`)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const [body] = signSession({ email: "a@uw.edu" }).split(".");
    expect(verifySession(`${body}.${"A".repeat(43)}`)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = signSession({ email: "a@uw.edu" });
    const original = process.env.INTAKE_SESSION_SECRET;
    process.env.INTAKE_SESSION_SECRET = "some-other-secret";
    try {
      expect(verifySession(token)).toBeNull();
    } finally {
      process.env.INTAKE_SESSION_SECRET = original;
    }
  });

  it("rejects a token whose body is valid base64 but not JSON", () => {
    const body = Buffer.from("not json").toString("base64url");
    // Sign it properly so only the JSON parse can fail.
    const token = signSession({ x: 1 });
    const [, realSig] = token.split(".");
    expect(verifySession(`${body}.${realSig}`)).toBeNull();
  });

  it("rejects a token past max age", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = signSession({ email: "a@uw.edu" });

    vi.setSystemTime(new Date("2026-01-31T00:00:01Z")); // 30 days + 1s
    expect(verifySession(token)).toBeNull();
  });

  it("accepts a token just inside max age", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = signSession({ email: "a@uw.edu" });

    vi.setSystemTime(new Date("2026-01-30T23:59:00Z"));
    expect(verifySession(token)).toMatchObject({ email: "a@uw.edu" });
  });

  it("rejects a payload with a forged future iat", () => {
    // iat must be a positive number; 0 / negative / non-numeric are rejected
    // so a hand-built token can't claim to be ageless.
    for (const iat of [0, -1, "abc", null]) {
      const body = Buffer.from(JSON.stringify({ email: "a@uw.edu", iat })).toString("base64url");
      const token = signSession({});
      const [, sig] = token.split(".");
      expect(verifySession(`${body}.${sig}`)).toBeNull();
    }
  });
});

describe("readSession", () => {
  it("returns the session for a valid cookie", () => {
    expect(readSession(signSession({ email: "a@uw.edu" }))).toMatchObject({ email: "a@uw.edu" });
  });

  it("refuses to promote a pre-OAuth cookie into a session", () => {
    const pre = signSession({ stateNonce: "abc", __pre: true, email: "a@uw.edu" });
    expect(readSession(pre)).toBeNull();
  });

  it("rejects a session with no email", () => {
    expect(readSession(signSession({ name: "nobody" }))).toBeNull();
  });
});

describe("readPreSession", () => {
  it("reads a valid pre cookie", () => {
    const pre = signSession({ stateNonce: "n1", returnTo: "/intake", __pre: true });
    expect(readPreSession(pre)).toMatchObject({ stateNonce: "n1", returnTo: "/intake" });
  });

  it("rejects a normal session cookie", () => {
    expect(readPreSession(signSession({ email: "a@uw.edu" }))).toBeNull();
  });

  it("rejects a pre cookie with no nonce", () => {
    expect(readPreSession(signSession({ __pre: true }))).toBeNull();
  });

  it("expires after 10 minutes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const pre = signSession({ stateNonce: "n1", __pre: true });

    vi.setSystemTime(new Date("2026-01-01T00:10:01Z"));
    expect(readPreSession(pre)).toBeNull();
  });
});

describe("safeReturnTo", () => {
  it.each(["/intake", "/intake/new", "/intake/edit/3?x=1"])("allows %s", (p) => {
    expect(safeReturnTo(p)).toBe(p);
  });

  it.each([
    ["protocol-relative", "//evil.com"],
    ["absolute http", "http://evil.com"],
    ["absolute https", "https://evil.com"],
    ["scheme-less host", "evil.com"],
    ["javascript", "javascript:alert(1)"],
    ["empty", ""],
    ["undefined", undefined],
  ])("rejects %s", (_label, value) => {
    expect(safeReturnTo(value as string)).toBe("/intake");
  });

  it("honours a custom fallback", () => {
    expect(safeReturnTo("//evil.com", "/")).toBe("/");
  });
});

// Behind `tailscale serve` (and any other TLS-terminating proxy) the app only
// ever sees plain HTTP on 127.0.0.1, so both of these must read the forwarded
// headers or sign-in silently misbehaves: cookies lose Secure, and the
// wrong-host check compares against the proxy's backend address.
const req = (headers: Record<string, string>, url = "http://127.0.0.1:3000/x") => ({
  headers: { get: (n: string) => headers[n.toLowerCase()] ?? null },
  nextUrl: new URL(url),
});

describe("requestHost", () => {
  it("prefers x-forwarded-host over host", () => {
    expect(
      requestHost(req({ "x-forwarded-host": "bestop.tail0ff8e.ts.net", host: "127.0.0.1:3000" })),
    ).toBe("bestop.tail0ff8e.ts.net");
  });

  it("falls back to the Host header", () => {
    expect(requestHost(req({ host: "127.0.0.1:3000" }))).toBe("127.0.0.1:3000");
  });

  it("falls back to nextUrl.host when neither header is present", () => {
    expect(requestHost(req({}))).toBe("127.0.0.1:3000");
  });

  it("keeps the port, so :3000 and :443 are not conflated", () => {
    expect(requestHost(req({ host: "example.test:8443" }))).toBe("example.test:8443");
  });
});

describe("requestIsSecure", () => {
  it("trusts x-forwarded-proto over the local protocol", () => {
    expect(requestIsSecure(req({ "x-forwarded-proto": "https" }))).toBe(true);
  });

  it("takes the first hop of a proxy chain", () => {
    expect(requestIsSecure(req({ "x-forwarded-proto": "https, http" }))).toBe(true);
    expect(requestIsSecure(req({ "x-forwarded-proto": "http, https" }))).toBe(false);
  });

  it("is case- and whitespace-insensitive", () => {
    expect(requestIsSecure(req({ "x-forwarded-proto": "  HTTPS  " }))).toBe(true);
  });

  it("does not treat a lookalike scheme as secure", () => {
    expect(requestIsSecure(req({ "x-forwarded-proto": "httpsx" }))).toBe(false);
  });

  it("uses the request protocol when the header is absent", () => {
    expect(requestIsSecure(req({}))).toBe(false);
    expect(requestIsSecure(req({}, "https://example.test/x"))).toBe(true);
  });
});
