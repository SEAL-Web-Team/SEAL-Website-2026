import { NextResponse } from "next/server";
import { PRE_COOKIE, SESSION_COOKIE } from "@/lib/intake/session";

export const dynamic = "force-dynamic";

export function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(PRE_COOKIE);
  return response;
}
