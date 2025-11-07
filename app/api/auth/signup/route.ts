import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").toLowerCase().trim();
    const password = String(body?.password || "").trim();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await dbConnect();
    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const doc = await User.create({ name, email, password: hash, role: "user" });

    // Fire-and-forget welcome email
    (async () => {
      try {
        const subject = "Welcome to NineKiwi";
        const origin = new URL(req.url).origin;
        const text = `Hi ${name},\n\nYour NineKiwi account was created successfully. You can now sign in and use the tool.\n\nLogin: ${origin + "/login"}`;
        await sendEmail(email, subject, text);
      } catch (e) { console.error("Signup welcome email failed", e); }
    })();

    return NextResponse.json({
      user: { id: String(doc._id), name: doc.name, email: doc.email, role: doc.role },
    });
  } catch (e) {
    console.error("Signup error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


