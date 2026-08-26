// Pure access-control policy, ported from TaskDeck's src/access/access-gate.js.
// Defined once and unit-tested so the gate can't drift between the OAuth
// callback and any other caller.

export type GateInput = {
  gateFileConfigured?: boolean;
  canReadGate?: boolean;
  allowlistConfigured?: boolean;
  onAllowlist?: boolean;
  isAdmin?: boolean;
  adminCount?: number;
  strict?: boolean;
  email?: string;
};

export type GateResult = {
  admitted: boolean;
  policy: "gate-file" | "allowlist" | "strict" | "open";
  denyReason: string;
};

/**
 * Layered gate, highest precedence first:
 *   1. gate file configured  → must read the Clan Life file (OR allowlist OR admin)
 *   2. allowlist configured  → must be on the allowlist (OR admin)
 *   3. admins + strict       → admins only
 *   4. otherwise             → open to any Google account
 *
 * `policy` is independent of the user, so callers can report the effective
 * policy for the deployment without leaking who is admitted.
 */
export function evaluateAccessGate({
  gateFileConfigured = false,
  canReadGate = false,
  allowlistConfigured = false,
  onAllowlist = false,
  isAdmin = false,
  adminCount = 0,
  strict = false,
  email = "",
}: GateInput = {}): GateResult {
  const who = email || "this account";

  if (gateFileConfigured) {
    const admitted = canReadGate || onAllowlist || isAdmin;
    return {
      admitted,
      policy: "gate-file",
      denyReason: admitted
        ? ""
        : `${who} is not in SEAL — ask a lab admin to share the Clan Life sheet with you.`,
    };
  }

  if (allowlistConfigured) {
    const admitted = onAllowlist || isAdmin;
    return {
      admitted,
      policy: "allowlist",
      denyReason: admitted ? "" : `${who} is not on the allowed users list.`,
    };
  }

  if (adminCount > 0 && strict) {
    const admitted = isAdmin;
    return {
      admitted,
      policy: "strict",
      denyReason: admitted ? "" : `${who} is not authorized yet — ask an admin to add you.`,
    };
  }

  return { admitted: true, policy: "open", denyReason: "" };
}

function emailList(raw: string | undefined): Set<string> {
  return new Set(
    String(raw || "")
      .split(/[,\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Config for the gate, read from env. Exposed so tests can assert env wiring. */
export function getAccessConfig() {
  const admins = emailList(process.env.INTAKE_ADMIN_EMAILS);
  const allowlist = emailList(process.env.INTAKE_ALLOWED_EMAILS);
  return {
    gateFileId:
      process.env.INTAKE_ACCESS_DRIVE_FILE_ID ||
      process.env.CLAN_LIFE_ID ||
      process.env.AUTH_GOOGLE_ACCESS_SHEET_ID ||
      "",
    admins,
    allowlist,
    strict: process.env.INTAKE_STRICT_ACCESS === "true",
    isAdmin: (email: string) => admins.has(String(email || "").toLowerCase()),
    isAllowed: (email: string) => allowlist.has(String(email || "").toLowerCase()),
  };
}
