import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { requireRole } from "@/lib/require-auth";
import { getUploadBatchErrorPath } from "@/lib/db/uploads";

export async function GET(
  _request: Request,
  { params }: { params: { batchId: string } }
) {
  try {
    await requireRole("ADMIN");
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const errorCsvPath = await getUploadBatchErrorPath(params.batchId);
  if (!errorCsvPath) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const content = await fs.readFile(errorCsvPath, "utf8");
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${params.batchId}-errors.csv"`
      }
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
