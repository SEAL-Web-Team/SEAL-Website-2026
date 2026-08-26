"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/intake/auth/logout", { method: "POST" });
        router.replace("/intake/login");
        router.refresh();
      }}
      className="text-sm text-slate-500 hover:text-[#f1f3f9] transition-colors disabled:opacity-50"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
