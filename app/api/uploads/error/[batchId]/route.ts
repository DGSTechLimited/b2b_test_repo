import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-auth";

export async function GET(
  _request: Request,
  { params }: { params: { batchId: string } }
) {
  try {
    await requireRole("ADMIN");
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const batch = await prisma.uploadBatch.findUnique({ where: { id: params.batchId } });
  if (!batch?.errorCsvPath) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const content = await fs.readFile(batch.errorCsvPath, "utf8");
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${batch.id}-errors.csv"`
      }
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
