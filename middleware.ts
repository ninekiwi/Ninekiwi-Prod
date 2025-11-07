// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
// Use compile-time inlined env for Edge runtime compatibility

const PUBLIC_PATHS = new Set([
  "/",              // optional, keep homepage public
  "/login",
  "/signup",
  "/admin/login",
  "/admin/signup",
]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow API auth endpoints
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // Payment page: require login; redirect admins or already-paid users directly to report
  if (pathname === "/pay") {
    let token: any = null;
    try { token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }); } catch {}
    if (!token) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", "/pay");
      return NextResponse.redirect(url);
    }
    const role = (token as any)?.role || "user";
    // Ask server to compute payment status (DB + cookie) to avoid trusting client state
    let alreadyPaid = false;
    try {
      const statusUrl = new URL("/api/payment/status", req.url);
      const r = await fetch(statusUrl.toString(), {
        headers: { cookie: req.headers.get("cookie") || "" },
        cache: "no-store",
      });
      if (r.ok) {
        const j: any = await r.json();
        alreadyPaid = !!j?.paid;
      }
    } catch {}
    if (role === "admin" || alreadyPaid) {
      return NextResponse.redirect(new URL("/report", req.url));
    }
    return NextResponse.next();
  }

  // Public pages bypass auth
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  // Access to report tool requires BOTH login and server-verified payment (admins bypass payment).
  if (pathname === "/report" || pathname.startsWith("/report/")) {
    let token: any = null;
    try { token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }); } catch {}
    if (!token) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", "/report");
      return NextResponse.redirect(url);
    }
    const role = (token as any)?.role || "user";
    if (role !== "admin") {
      // Ask server to compute payment status (DB + httpOnly cookie)
      let paid = false;
      try {
        const statusUrl = new URL("/api/payment/status", req.url);
        const r = await fetch(statusUrl.toString(), {
          headers: { cookie: req.headers.get("cookie") || "" },
          cache: "no-store",
        });
        if (r.ok) {
          const j: any = await r.json();
          paid = !!j?.paid;
        }
      } catch {}
      if (!paid) {
        return NextResponse.redirect(new URL("/pay", req.url));
      }
    }
  }

  // Require login for account page
  if (pathname === "/account" || pathname.startsWith("/account/")) {
    let token: any = null;
    try { token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }); } catch {}
    if (!token) return NextResponse.redirect(new URL("/login?callbackUrl=" + encodeURIComponent(req.nextUrl.pathname), req.url));
  }

  // Example: protect /admin only
  if (pathname.startsWith("/admin")) {
    let token: any = null;
    try { token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }); } catch {}
    if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));
    const role = (token as any).role || "user";
    if (role !== "admin") return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = { matcher: [
  "/admin/:path*",
  "/report",
  "/report/:path*",
  "/account",
  "/account/:path*",
  "/pay"
] };
