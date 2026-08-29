import { describe, expect, it, afterEach } from "vitest";
import { evaluateAccessGate, getAccessConfig } from "./access-gate";

describe("evaluateAccessGate — gate-file policy (the SEAL membership check)", () => {
  const base = { gateFileConfigured: true, email: "a@uw.edu" };

  it("admits someone who can read the Clan Life file", () => {
    const r = evaluateAccessGate({ ...base, canReadGate: true });
    expect(r).toMatchObject({ admitted: true, policy: "gate-file", denyReason: "" });
  });

  it("denies someone who cannot read it", () => {
    const r = evaluateAccessGate({ ...base, canReadGate: false });
    expect(r.admitted).toBe(false);
    expect(r.policy).toBe("gate-file");
    expect(r.denyReason).toContain("not in SEAL");
  });

  it("names the account in the deny reason", () => {
    expect(evaluateAccessGate({ ...base, canReadGate: false }).denyReason).toContain("a@uw.edu");
  });

  it("falls back to a generic subject with no email", () => {
    const r = evaluateAccessGate({ gateFileConfigured: true, canReadGate: false });
    expect(r.denyReason).toContain("this account");
  });

  it("admits via allowlist even without gate-file access", () => {
    expect(
      evaluateAccessGate({ ...base, canReadGate: false, onAllowlist: true }).admitted,
    ).toBe(true);
  });

  it("admits an admin even without gate-file access", () => {
    expect(evaluateAccessGate({ ...base, canReadGate: false, isAdmin: true }).admitted).toBe(true);
  });

  it("gate-file takes precedence over allowlist policy", () => {
    const r = evaluateAccessGate({
      ...base,
      canReadGate: true,
      allowlistConfigured: true,
      onAllowlist: false,
    });
    expect(r.policy).toBe("gate-file");
    expect(r.admitted).toBe(true);
  });
});

describe("evaluateAccessGate — allowlist policy", () => {
  it("admits a listed email", () => {
    const r = evaluateAccessGate({ allowlistConfigured: true, onAllowlist: true });
    expect(r).toMatchObject({ admitted: true, policy: "allowlist" });
  });

  it("denies an unlisted email", () => {
    const r = evaluateAccessGate({ allowlistConfigured: true, onAllowlist: false });
    expect(r.admitted).toBe(false);
    expect(r.denyReason).toContain("not on the allowed users list");
  });

  it("admits an admin who is not on the list", () => {
    expect(
      evaluateAccessGate({ allowlistConfigured: true, onAllowlist: false, isAdmin: true }).admitted,
    ).toBe(true);
  });
});

describe("evaluateAccessGate — strict policy", () => {
  it("admits only admins", () => {
    expect(evaluateAccessGate({ adminCount: 2, strict: true, isAdmin: true }).admitted).toBe(true);
    expect(evaluateAccessGate({ adminCount: 2, strict: true, isAdmin: false }).admitted).toBe(false);
  });

  it("is inactive when strict is off — falls through to open", () => {
    const r = evaluateAccessGate({ adminCount: 2, strict: false, isAdmin: false });
    expect(r).toMatchObject({ admitted: true, policy: "open" });
  });

  it("is inactive when no admins are configured", () => {
    expect(evaluateAccessGate({ adminCount: 0, strict: true }).policy).toBe("open");
  });
});

describe("evaluateAccessGate — open policy", () => {
  it("admits anyone when nothing is configured", () => {
    expect(evaluateAccessGate()).toMatchObject({ admitted: true, policy: "open", denyReason: "" });
  });
});

describe("getAccessConfig", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it("reads the gate file id from INTAKE_ACCESS_DRIVE_FILE_ID first", () => {
    process.env.INTAKE_ACCESS_DRIVE_FILE_ID = "primary";
    process.env.CLAN_LIFE_ID = "secondary";
    expect(getAccessConfig().gateFileId).toBe("primary");
  });

  it("falls back to CLAN_LIFE_ID", () => {
    delete process.env.INTAKE_ACCESS_DRIVE_FILE_ID;
    process.env.CLAN_LIFE_ID = "secondary";
    expect(getAccessConfig().gateFileId).toBe("secondary");
  });

  it("parses admin/allowlist emails case-insensitively and ignores blanks", () => {
    process.env.INTAKE_ADMIN_EMAILS = "Boss@UW.edu,  , second@uw.edu";
    process.env.INTAKE_ALLOWED_EMAILS = "guest@uw.edu";
    const cfg = getAccessConfig();

    expect(cfg.admins.size).toBe(2);
    expect(cfg.isAdmin("BOSS@uw.EDU")).toBe(true);
    expect(cfg.isAdmin("nobody@uw.edu")).toBe(false);
    expect(cfg.isAllowed("Guest@uw.edu")).toBe(true);
  });

  it("treats an unset admin list as empty rather than a single blank entry", () => {
    delete process.env.INTAKE_ADMIN_EMAILS;
    expect(getAccessConfig().admins.size).toBe(0);
    expect(getAccessConfig().isAdmin("")).toBe(false);
  });

  it("only enables strict when the flag is exactly 'true'", () => {
    process.env.INTAKE_STRICT_ACCESS = "yes";
    expect(getAccessConfig().strict).toBe(false);
    process.env.INTAKE_STRICT_ACCESS = "true";
    expect(getAccessConfig().strict).toBe(true);
  });
});
