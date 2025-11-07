import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { amount, currency = "INR", receipt, description } = await req.json();

    const key_id = getEnv("RAZORPAY_KEY_ID");
    const key_secret = getEnv("RAZORPAY_KEY_SECRET");
    if (!key_id || !key_secret) {
      return NextResponse.json(
        { error: "Razorpay keys not configured on server" },
        { status: 500 }
      );
    }

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const instance = new Razorpay({ key_id, key_secret });

    const order = await instance.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt: receipt || `nk_${Date.now()}`,
      notes: { description: description || "NineKiwi Tool Access" },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: key_id,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
