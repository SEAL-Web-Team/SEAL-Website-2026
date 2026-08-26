import { NextRequest } from "next/server";
import { SESSION_COOKIE, signSession } from "../session";
import { cookieJar } from "./next-headers-mock";

export { cookieJar };

export function signIn(email: string, name = "Test User") {
  cookieJar.set(SESSION_COOKIE, signSession({ email, name }));
}

export function signOut() {
  cookieJar.clear();
}

export function jsonRequest(url: string, method: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** A body that is deliberately not valid JSON, to exercise the 400 path. */
export function malformedJsonRequest(url: string, method: string): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: "{not json",
  });
}

export const ctx = (id: string | number) => ({ params: Promise.resolve({ id: String(id) }) });
