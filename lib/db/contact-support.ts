import { prisma } from "@/lib/db/prisma";

export async function getDealerAccountNoForSupport(userId: string) {
  const dealerProfile = await prisma.dealerProfile.findUnique({
    where: { userId },
    select: { accountNo: true }
  });
  return dealerProfile?.accountNo ?? null;
}

export async function createSupportAuditLog(userId: string, metadata: Record<string, unknown>) {
  // LLID: L-API-SUPPORT-001-audit-support-contact
  await prisma.auditLog.create({
    data: {
      userId,
      action: "SUPPORT_CONTACT",
      metadata
    }
  });
}
