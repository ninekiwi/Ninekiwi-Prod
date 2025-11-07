import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
    await dbConnect();
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return NextResponse.json({ ok: true });
    const token = crypto.randomBytes(24).toString("hex");
    const exp = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    user.resetToken = token;
    user.resetTokenExp = exp as any;
    await user.save();
    console.log("Password reset token for", user.email, token);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("forgot error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
