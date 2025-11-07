import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Photo } from "@/models/Photo";
import { Report } from "@/models/Report";
import { Payment } from "@/models/Payment";
import { cloudinary } from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any)?.role || "user";

  try {
    const { id } = await context.params;
    const body = await req.json();
    const update: any = {};
    if (typeof body?.caption === "string") update.caption = body.caption;
    if (typeof body?.description === "string") update.description = body.description;
    if (typeof body?.includeInSummary === "boolean") update.includeInSummary = body.includeInSummary;
    if (typeof body?.figureNumber === "number") update.figureNumber = body.figureNumber;

    await dbConnect();
    if (role !== "admin") {
      const email = String((session.user as any)?.email || "").toLowerCase();
      const paidCount = email ? await Payment.countDocuments({ email, status: "success" }) : 0;
      if (paidCount <= 0) return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }
    const existing = await Photo.findById(id).lean();
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (role !== "admin") {
      const owner = await Report.exists({ userId: (session.user as any).id, reportId: (existing as any).reportId });
      if (!owner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const doc = await Photo.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Update photo error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any)?.role || "user";

  try {
    const { id } = await context.params;
    await dbConnect();
    if (role !== "admin") {
      const email = String((session.user as any)?.email || "").toLowerCase();
      const paidCount = email ? await Payment.countDocuments({ email, status: "success" }) : 0;
      if (paidCount <= 0) return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }
    const doc = await Photo.findById(id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (role !== "admin") {
      const owner = await Report.exists({ userId: (session.user as any).id, reportId: (doc as any).reportId });
      if (!owner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if ((doc as any).publicId) {
      try { await cloudinary.uploader.destroy((doc as any).publicId); }
      catch (e) { console.warn("Cloudinary destroy failed", e); }
    }
    await Photo.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Delete photo error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
