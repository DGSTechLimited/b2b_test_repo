import { prisma } from "@/lib/db/prisma";

export async function getUserProfileById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { dealerProfile: true }
  });
}

export async function updateUserPassword(
  userId: string,
  passwordHash: string,
  mustChangePassword: boolean,
  passwordUpdatedAt: Date | null
) {
  // LLID: L-API-ME-001-change-password
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword,
      passwordUpdatedAt
    }
  });
}
