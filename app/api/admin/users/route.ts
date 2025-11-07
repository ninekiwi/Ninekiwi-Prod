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
  const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 }).lean();
  // Attach report counts per user
  try {
    const counts = await Report.aggregate([
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>(counts.map((c: any) => [String(c._id), c.count]));
    const withCounts = users.map((u: any) => ({
      ...u,
      reportsCount: countMap.get(String(u._id)) || 0,
    }));
    return NextResponse.json({ users: withCounts });
  } catch {
    return NextResponse.json({ users });
  }
}
