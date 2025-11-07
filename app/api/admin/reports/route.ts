import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Report } from "@/models/Report";
import { Photo } from "@/models/Photo";
import { cloudinary } from "@/lib/cloudinary";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || undefined;
  const reportId = searchParams.get("reportId") || undefined;

  await dbConnect();
  const q: any = {};
  if (userId) q.userId = userId;
  if (reportId) q.reportId = reportId;
  const reports = await Report.find(q).sort({ updatedAt: -1 }).lean();
  const userIds = Array.from(new Set(reports.map((r) => r.userId)));
  const users = await User.find({ _id: { $in: userIds } }, { password: 0 }).lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const items = reports.map((r) => ({
    ...r,
    user: userMap.get(String(r.userId)) || null,
  }));
  return NextResponse.json({ items });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let payload: any = null;
  try {
    payload = await req.json();
  } catch {}
  const id = payload?.id ? String(payload.id) : undefined;
  const userId = payload?.userId ? String(payload.userId) : undefined;
  const reportId = payload?.reportId ? String(payload.reportId) : undefined;
  if (!id && !(userId && reportId)) {
    return NextResponse.json({ error: "Missing id or (userId, reportId)" }, { status: 400 });
  }

  await dbConnect();
  const doc = id
    ? await Report.findById(id).lean()
    : await Report.findOne({ userId, reportId }).lean();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await Report.deleteOne({ _id: doc._id });

  try {
    const photos = await Photo.find({ reportId: doc.reportId }).lean();
    for (const p of photos) {
      try {
        if ((p as any).publicId) await cloudinary.uploader.destroy((p as any).publicId);
      } catch {}
    }
    await Photo.deleteMany({ reportId: doc.reportId });
  } catch {}

  return NextResponse.json({ ok: true });
}
