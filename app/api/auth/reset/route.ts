import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    await dbConnect();
    const user = await User.findOne({ resetToken: token }).exec();
    if (!user || (user.resetTokenExp && user.resetTokenExp.getTime() < Date.now())) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }
    user.password = await bcrypt.hash(String(password), 10);
    user.resetToken = null;
    user.resetTokenExp = null as any;
    await user.save();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("reset error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
