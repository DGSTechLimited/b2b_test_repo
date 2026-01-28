import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/require-auth";
import { getCatalogPartById, updateCatalogPart } from "@/lib/db/admin-uploads";

const updateSchema = z.object({
  description: z.string().nullable().optional(),
  supplier: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  freeStock: z.number().int().nonnegative(),
  isActive: z.boolean()
});

function cleanText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

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

  const part = await getCatalogPartById(params.id);
  if (!part) {
    return NextResponse.json({ message: "Part not found" }, { status: 404 });
  }

  await updateCatalogPart(part.id, {
    description: cleanText(parsed.data.description),
    supplier: cleanText(parsed.data.supplier),
    brand: cleanText(parsed.data.brand),
    freeStock: parsed.data.freeStock,
    isActive: parsed.data.isActive
  });

  return NextResponse.json({ ok: true });
}
