import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/intake/auth";
import { canonicalHost, canonicalHosts, canonicalOrigin } from "@/lib/intake/google";

export const dynamic = "force-dynamic";

export default async function IntakeLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; return?: string }>;
}) {
  const { error, return: returnTo } = await searchParams;
  if (await currentUser()) redirect("/intake");

  const query = returnTo ? `?return=${encodeURIComponent(returnTo)}` : "";
  const startHref = `/auth/google/start${query}`;

  // Google only ever redirects back to the one registered callback host. If
  // you're reading this page at some other host — a LAN IP, a Tailscale name —
  // signing in from here bounces the browser to that callback host, which may
  // not even resolve from where you are. That failure looks like an
  // unexplained "page not found" halfway through the flow, so say it here
  // instead and hand over a link that works.
  const requestHeaders = await headers();
  const viewingHost =
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
  const callbackHost = canonicalHost();
  const wrongHost = Boolean(
    callbackHost && viewingHost && !canonicalHosts().includes(viewingHost),
  );
  const canonicalLoginHref = `${canonicalOrigin()}/intake/login${query}`;

  return (
    <div className="page-shell">
      <div className="page-container-tight">
        <div className="page-header">
          <h1 className="page-title">Intake</h1>
          <p className="page-subtitle">
            Post updates, writeups, and announcements to the SEAL site. Sign in with the Google
            account that has access to the lab&apos;s Clan Life sheet.
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="surface-card border-red-500/30 bg-red-500/[0.06] p-4 mb-6 text-sm text-red-200"
          >
            {error}
          </div>
        ) : null}

        {wrongHost ? (
          <div
            role="alert"
            className="surface-card border-[#e0b563]/30 bg-[#e0b563]/[0.06] p-6 mb-6"
          >
            <p className="text-sm text-[#edc98a] font-semibold mb-2">Sign in from a different address</p>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              You&apos;re viewing this at{" "}
              <code className="text-slate-200">{viewingHost}</code>, but Google will only return
              sign-ins to <code className="text-slate-200">{callbackHost}</code>{" "}
              — the one address
              registered on the lab&apos;s OAuth client. Open the intake there instead; you&apos;ll
              need to be on the machine running the server.
            </p>
            <a href={canonicalLoginHref} className="action-chip">
              <span>Continue at {callbackHost}</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>
        ) : null}

        <div className="surface-card p-6 sm:p-8">
          <p className="text-slate-400 leading-relaxed mb-6">
            Access is granted by the lab admins sharing the Clan Life sheet with you — there&apos;s
            no separate account to create.
          </p>
          <a href={startHref} className="action-chip">
            <span>Sign in with Google</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          Not a lab member?{" "}
          <Link href="/contact" className="text-[#ab9ffa] hover:text-[#f1f3f9] transition-colors">
            Get in touch
          </Link>{" "}
          instead.
        </p>
      </div>
    </div>
  );
}
