import { prisma } from "@/lib/db/prisma";

export async function getUserForAuth(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { dealerProfile: true }
  });
}

export async function touchUserLastLogin(userId: string) {
  // LLID: L-LIB-001-update-last-login
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() }
  });
}
