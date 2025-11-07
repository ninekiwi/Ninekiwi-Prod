import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { getEnv } from "@/lib/env";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").toLowerCase().trim();
    const password = String(body?.password || "").trim();
    const token = body?.token ? String(body.token) : "";

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await dbConnect();
    const adminExists = await User.exists({ role: "admin" });
    if (adminExists) {
      if (!getEnv("ADMIN_SIGNUP_TOKEN")) {
        return NextResponse.json({ error: "Admin signup disabled. Set ADMIN_SIGNUP_TOKEN in env." }, { status: 403 });
      }
      if (token !== getEnv("ADMIN_SIGNUP_TOKEN")) {
        return NextResponse.json({ error: "Invalid admin token" }, { status: 403 });
      }
    }

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const doc = await User.create({ name, email, password: hash, role: "admin" });

    return NextResponse.json({
      user: { id: String(doc._id), name: doc.name, email: doc.email, role: doc.role },
      firstAdmin: !adminExists,
    });
  } catch (e) {
    console.error("Admin signup error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
