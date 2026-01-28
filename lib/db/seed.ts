import bcrypt from "bcrypt";
import { prisma } from "@/lib/db/prisma";

export async function runSeed() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD are required to seed the initial admin.");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Super admin already exists.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  // LLID: L-SEED-001-create-superadmin
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      name: "Super Admin",
      mustChangePassword: false,
      passwordUpdatedAt: new Date()
    }
  });

  console.log("Super admin created.");
}

export async function disconnectSeedDb() {
  await prisma.$disconnect();
}
