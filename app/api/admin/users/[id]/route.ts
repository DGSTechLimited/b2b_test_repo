import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-auth";

const updateSchema = z.object({
  name: z.string().min(2),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  genuineTier: z.enum(["A", "B", "C", "D", "E", "F"]).optional(),
  aftermarketTier: z.enum(["A", "B", "C", "D", "E", "F"]).optional(),
  brandedTier: z.enum(["A", "B", "C", "D", "E", "F"]).optional()
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole("ADMIN");
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: { dealerProfile: true }
  });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const { name, status, genuineTier, aftermarketTier, brandedTier } = parsed.data;
  const cleanedName = name.trim();

  if (user.role === "DEALER" && user.dealerProfile) {
    const userStatus = status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { name: cleanedName, status: userStatus }
      }),
      prisma.dealerProfile.update({
        where: { id: user.dealerProfile.id },
        data: {
          dealerName: cleanedName,
          status,
          genuineTier: genuineTier ?? user.dealerProfile.genuineTier,
          aftermarketTier: aftermarketTier ?? user.dealerProfile.aftermarketTier,
          brandedTier: brandedTier ?? user.dealerProfile.brandedTier
        }
      })
    ]);
  } else {
    if (status === "SUSPENDED") {
      return NextResponse.json({ message: "Invalid status for admin user." }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { name: cleanedName, status }
    });
  }

  return NextResponse.json({ ok: true });
}
