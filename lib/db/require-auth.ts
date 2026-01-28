import { prisma } from "@/lib/db/prisma";

export async function getDealerStatusByUserId(userId: string) {
  return prisma.dealerProfile.findUnique({
    where: { userId },
    select: { status: true }
  });
}
