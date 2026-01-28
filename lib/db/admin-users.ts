import { prisma } from "@/lib/db/prisma";

export async function listUsers(where: any, page: number, pageSize: number) {
  return Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { dealerProfile: true, createdBy: true }
    })
  ]);
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findDealerProfileByAccountNo(accountNo: string) {
  return prisma.dealerProfile.findUnique({ where: { accountNo } });
}

export async function createUserWithProfile(data: any) {
  // LLID: L-API-ADMIN-007-create-user
  return prisma.user.create({ data });
}

export async function getUserWithProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { dealerProfile: true }
  });
}

export async function updateDealerUserAndProfile(userId: string, profileId: string, data: any) {
  return prisma.$transaction([
    // LLID: L-API-ADMIN-004-update-dealer-user
    prisma.user.update({ where: { id: userId }, data: data.user }),
    // LLID: L-API-ADMIN-005-update-dealer-profile
    prisma.dealerProfile.update({ where: { id: profileId }, data: data.profile })
  ]);
}

export async function updateAdminUser(userId: string, data: any) {
  // LLID: L-API-ADMIN-006-update-admin-user
  return prisma.user.update({ where: { id: userId }, data });
}

export async function resetUserPassword(userId: string, passwordHash: string) {
  // LLID: L-API-ADMIN-003-reset-user-password
  return prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword: true,
      passwordUpdatedAt: null
    }
  });
}
