import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Report } from "@/models/Report";
import { Payment } from "@/models/Payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const role = (session.user as any)?.role || "user";
  const { searchParams } = new URL(req.url);
  const reportId = searchParams.get("reportId");
  await dbConnect();
  // Enforce payment for non-admin users
  if (role !== "admin") {
    const email = String((session.user as any)?.email || "").toLowerCase();
    const paidCount = email ? await Payment.countDocuments({ email, status: "success" }) : 0;
    if (paidCount <= 0) return NextResponse.json({ error: "Payment required" }, { status: 402 });
  }
  const query: any = { userId };
  if (reportId) query.reportId = reportId;
  const items = await Report.find(query).sort({ updatedAt: -1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const role = (session.user as any)?.role || "user";

  try {
    const body = await req.json();
    const reportId = String(body?.reportId || "").trim();
    const data = body?.data ?? {};
    const status = body?.status ? String(body.status) : undefined;
    const signatureData = body?.signatureData ?? null;
    if (!reportId || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    await dbConnect();
    // Enforce payment for non-admin users
    if (role !== "admin") {
      const email = String((session.user as any)?.email || "").toLowerCase();
      const paidCount = email ? await Payment.countDocuments({ email, status: "success" }) : 0;
      if (paidCount <= 0) return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }
    const doc = await Report.findOneAndUpdate(
      { userId, reportId },
      {
        $set: {
          data,
          signatureData,
          ...(status ? { status } : {}),
        },
        $setOnInsert: { userId, reportId },
      },
      { upsert: true, new: true }
    ).lean();
    return NextResponse.json({ item: doc });
  } catch (e) {
    console.error("Save report error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
