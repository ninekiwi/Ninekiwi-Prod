import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Report } from "@/models/Report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await dbConnect();
  const [usersCount, reportsCount, recentUsers, recentReports] = await Promise.all([
    User.countDocuments(),
    Report.countDocuments(),
    User.find({}, { password: 0 }).sort({ createdAt: -1 }).limit(5).lean(),
    Report.find({}).sort({ updatedAt: -1 }).limit(5).lean(),
  ]);
  return NextResponse.json({ usersCount, reportsCount, recentUsers, recentReports });
}
