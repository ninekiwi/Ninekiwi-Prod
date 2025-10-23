import { NextResponse } from "next/server";

export async function POST() {
  // Clear NextAuth session cookies to log out
  const res = NextResponse.json({ ok: true });
  // Common cookie names in NextAuth v4
  const cookieNames = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.callback-url",
    "next-auth.csrf-token",
    // App-specific entitlement hint
    "nk_has_paid",
  ];
  for (const name of cookieNames) {
    res.cookies.set({ name, value: "", path: "/", expires: new Date(0) });
  }
  return res;
}
