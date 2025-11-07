import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();
    const n = String(name || "").trim();
    const e = String(email || "").trim();
    const s = String(subject || "").trim();
    const m = String(message || "").trim();
    if (!n || !e || !s || !m) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const to = getEnv("SUPPORT_EMAIL") || getEnv("EMAIL_USER") || "";
    if (!to) return NextResponse.json({ error: "Email not configured" }, { status: 500 });
    const text = `From: ${n} <${e}>\nSubject: ${s}\n\n${m}`;
    const html = `<p><b>From:</b> ${n} &lt;${e}&gt;</p><p><b>Subject:</b> ${s}</p><p style="white-space:pre-line">${m}</p>`;
    await sendEmail(to, `Contact: ${s}`, text, html);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
