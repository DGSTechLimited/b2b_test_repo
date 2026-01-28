import { NextResponse } from "next/server";
import { requireRole } from "@/lib/require-auth";
import { getCartSummaryForUser } from "@/lib/db/cart";

export async function GET() {
  let session;
  try {
    session = await requireRole("DEALER");
  } catch {
    return NextResponse.json({ count: 0, total: "0", items: [] }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const summary = await getCartSummaryForUser(userId);
  return NextResponse.json(summary);
}
