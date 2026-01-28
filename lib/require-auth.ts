import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDealerStatusByUserId } from "@/lib/db/require-auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(role: "ADMIN" | "DEALER") {
  const session = await requireSession();
  if ((session.user as any).role !== role) {
    throw new Error("Forbidden");
  }
  if (role === "DEALER") {
    const userId = (session.user as any).id as string | undefined;
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const dealerProfile = await getDealerStatusByUserId(userId);
    if (!dealerProfile || dealerProfile.status !== "ACTIVE") {
      throw new Error("DealerInactive");
    }
  }
  return session;
}
