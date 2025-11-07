import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getEnv } from "@/lib/env";
import { dbConnect } from "@/lib/mongodb";
import { Payment } from "@/models/Payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, paymentId, signature } = body || {};
    const key_secret = getEnv("RAZORPAY_KEY_SECRET");
    if (!key_secret) {
      return NextResponse.json(
        { error: "Razorpay secret not configured" },
        { status: 500 }
      );
    }
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const expected = crypto
      .createHmac("sha256", key_secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const valid = expected === signature;
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

<<<<<<< HEAD
    // Enforce server-side minimum: reject payments below 499
    const paidAmount = Number((body as any)?.amount) || 0;
    if (paidAmount < 499) {
      return NextResponse.json({ error: "Minimum payable amount is 499" }, { status: 400 });
    }

=======
>>>>>>> test
    // Persist payment record
    try {
      await dbConnect();
      await Payment.create({
        orderId,
        paymentId,
        signature,
<<<<<<< HEAD
        amount: paidAmount,
=======
        amount: Number((body as any)?.amount) || 0,
>>>>>>> test
        currency: String((body as any)?.currency || "INR"),
        description: String((body as any)?.description || ""),
        name: String((body as any)?.name || ""),
        email: String((body as any)?.email || ""),
        phone: String((body as any)?.phone || ""),
        status: "success",
        meta: { source: "razorpay" },
      });
    } catch {}

    const res = NextResponse.json({ success: true });
    const isHttps = req.nextUrl.protocol === "https:";
    res.cookies.set("nk_has_paid", "true", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: isHttps,
    });
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Verification failed" },
      { status: 500 }
    );
  }
}
