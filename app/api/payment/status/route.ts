import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Payment } from "@/models/Payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Default to unpaid
  let paid = false;
  let hasSession = false;
  try {
    const session = await getServerSession(authOptions);
    const email = (session?.user as any)?.email;
    hasSession = !!email;
    if (email) {
      await dbConnect();
      const count = await Payment.countDocuments({ email: String(email).toLowerCase(), status: "success" });
      paid = count > 0;
    }
  } catch {}

  // If no session, fall back to cookie hint
  if (!hasSession) {
    paid = req.cookies.get("nk_has_paid")?.value === "true";
  }

  const res = NextResponse.json({ paid });
  try {
    const isHttps = req.nextUrl.protocol === "https:";
    if (paid) {
      // Persist paid hint for faster checks when logged-out
      res.cookies.set("nk_has_paid", "true", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        secure: isHttps,
      });
    } else {
      // Clear any stale cookie to prevent false positives
      res.cookies.set("nk_has_paid", "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        expires: new Date(0),
        secure: isHttps,
      });
    }
  } catch {}
  return res;
}
