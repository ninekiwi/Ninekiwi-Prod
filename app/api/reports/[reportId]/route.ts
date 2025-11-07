import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Report } from "@/models/Report";
import { Payment } from "@/models/Payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const role = (session.user as any)?.role || "user";
  const { reportId } = await params;
  await dbConnect();
  if (role !== "admin") {
    const email = String((session.user as any)?.email || "").toLowerCase();
    const paidCount = email ? await Payment.countDocuments({ email, status: "success" }) : 0;
    if (paidCount <= 0) return NextResponse.json({ error: "Payment required" }, { status: 402 });
  }
  const doc = await Report.findOne({ userId, reportId }).lean();
  if (!doc) return NextResponse.json({ item: null }, { status: 200 });
  return NextResponse.json({ item: doc });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const role = (session.user as any)?.role || "user";
  const { reportId } = await params;
  const body = await req.json();
  await dbConnect();
  if (role !== "admin") {
    const email = String((session.user as any)?.email || "").toLowerCase();
    const paidCount = email ? await Payment.countDocuments({ email, status: "success" }) : 0;
    if (paidCount <= 0) return NextResponse.json({ error: "Payment required" }, { status: 402 });
  }
  const update: any = {};
  if (body?.data) update.data = body.data;
  if (typeof body?.signatureData !== "undefined") update.signatureData = body.signatureData;
  if (typeof body?.status === "string") update.status = body.status;
  const doc = await Report.findOneAndUpdate({ userId, reportId }, { $set: update }, { new: true }).lean();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item: doc });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const role = (session.user as any)?.role || "user";
  const { reportId } = await params;
  await dbConnect();
  if (role !== "admin") {
    const email = String((session.user as any)?.email || "").toLowerCase();
    const paidCount = email ? await Payment.countDocuments({ email, status: "success" }) : 0;
    if (paidCount <= 0) return NextResponse.json({ error: "Payment required" }, { status: 402 });
  }
  await Report.findOneAndDelete({ userId, reportId });
  return NextResponse.json({ ok: true });
}
