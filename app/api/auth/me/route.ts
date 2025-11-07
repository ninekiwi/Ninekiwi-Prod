import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user
    ? { _id: (session.user as any).id, name: session.user.name, email: session.user.email, role: (session.user as any).role }
    : null;
  return NextResponse.json({ user });
}
