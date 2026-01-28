import { NextResponse } from "next/server";
import { requireSession } from "@/lib/require-auth";
import { getUserProfileById } from "@/lib/db/me";

export async function GET() {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const user = await getUserProfileById(userId);

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.role === "DEALER" ? user.dealerProfile?.status ?? user.status : user.status,
    mustChangePassword: user.mustChangePassword,
    dealerProfile: user.dealerProfile
      ? {
          dealerName: user.dealerProfile.dealerName,
          accountNo: user.dealerProfile.accountNo,
          status: user.dealerProfile.status,
          genuineTier: user.dealerProfile.genuineTier,
          aftermarketTier: user.dealerProfile.aftermarketTier,
          brandedTier: user.dealerProfile.brandedTier,
          dispatchMethodDefault: user.dealerProfile.dispatchMethodDefault ?? null
        }
      : null
  });
}
