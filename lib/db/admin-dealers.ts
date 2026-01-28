import { prisma } from "@/lib/db/prisma";

export async function getAllDealers() {
  return prisma.user.findMany({
    where: { role: "DEALER" },
    include: { dealerProfile: true },
    orderBy: { createdAt: "desc" }
  });
}
