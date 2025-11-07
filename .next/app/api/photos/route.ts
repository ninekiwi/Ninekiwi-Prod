import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Photo } from "@/models/Photo";
import { Report } from "@/models/Report";
import { Payment } from "@/models/Payment";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { getEnv } from "@/lib/env";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any)?.role || "user";
  const { searchParams } = new URL(req.url);
  const reportId = searchParams.get("reportId");
  const section = searchParams.get("section");
  if (!reportId) {
    return NextResponse.json({ error: "Missing reportId" }, { status: 400 });
  }
  await dbConnect();
  if (role !== "admin") {
    const email = String((session.user as any)?.email || "").toLowerCase();
    const paidCount = email ? await Payment.countDocuments({ email, status: "success" }) : 0;
    if (paidCount <= 0) return NextResponse.json({ error: "Payment required" }, { status: 402 });
  }
  // Ensure this report belongs to the current user (unless admin)
  if (role !== "admin") {
    const owner = await Report.exists({ userId: (session.user as any).id, reportId });
    if (!owner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const query: any = { reportId };
  if (section) query.section = section;
  const items = await Photo.find(query).sort({ createdAt: 1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  // Require auth for create
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any)?.role || "user";

  try {
    const body = await req.json();
    const reportId = String(body?.reportId || "").trim();
    const section = String(body?.section || "").trim();
    const data = String(body?.data || "");
    const name = String(body?.name || "Photo").trim();
    const includeInSummary = !!body?.includeInSummary;
    const caption = body?.caption ? String(body.caption) : undefined;
    const description = body?.description ? String(body.description) : undefined;
    const figureNumber = typeof body?.figureNumber === "number" ? body.figureNumber : undefined;

    if (!reportId || !section || !data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();
    if (role !== "admin") {
      const email = String((session.user as any)?.email || "").toLowerCase();
      const paidCount = email ? await Payment.countDocuments({ email, status: "success" }) : 0;
      if (paidCount <= 0) return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }
    // Auto-create or verify ownership of the report for this user
    const owner = await Report.findOneAndUpdate(
      { userId: (session.user as any).id, reportId },
      { $setOnInsert: { userId: (session.user as any).id, reportId } },
      { upsert: true, new: true }
    ).lean();

    if (!isCloudinaryConfigured) {
      return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
    }
    const uploadRes = await cloudinary.uploader.upload(data, {
      folder: getEnv("CLOUDINARY_FOLDER") || "ninekiwi",
      resource_type: "auto",
    });

    const doc = await Photo.create({
      reportId,
      section,
      name,
      src: uploadRes.secure_url,
      publicId: uploadRes.public_id,
      includeInSummary,
      caption,
      description,
      figureNumber,
    });

    return NextResponse.json({
      item: {
        _id: String(doc._id),
        name: doc.name,
        src: doc.src,
        reportId: doc.reportId,
        section: doc.section,
        includeInSummary: doc.includeInSummary,
        caption: doc.caption,
        description: doc.description,
        figureNumber: doc.figureNumber,
      },
    });
  } catch (e) {
    console.error("Create photo error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
