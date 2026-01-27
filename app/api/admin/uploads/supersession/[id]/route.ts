import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-auth";

const updateSchema = z.object({
  newPartNo: z.string().min(1),
  effectiveDate: z.string().nullable().optional()
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

  const supersession = await prisma.supersession.findUnique({ where: { id: params.id } });
  if (!supersession) {
    return NextResponse.json({ message: "Supersession not found" }, { status: 404 });
  }

  const cleanedNewPart = parsed.data.newPartNo.trim();
  const effectiveDateValue = parsed.data.effectiveDate?.trim()
    ? new Date(parsed.data.effectiveDate)
    : null;
  if (effectiveDateValue && Number.isNaN(effectiveDateValue.getTime())) {
    return NextResponse.json({ message: "Invalid effective date" }, { status: 400 });
  }

  await prisma.supersession.update({
    where: { id: supersession.id },
    data: {
      newPartNo: cleanedNewPart,
      effectiveDate: effectiveDateValue
    }
  });

  return NextResponse.json({ ok: true });
}
