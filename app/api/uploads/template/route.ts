import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { requireRole } from "@/lib/require-auth";

const templateMap: Record<string, string> = {
  parts_aftermarket: "parts_aftermarket_sample.csv",
  parts_genuine: "parts_genuine_sample.csv",
  supersession: "supersession_template.csv",
  order_status: "order_status_template.csv"
};

export async function GET(request: Request) {
  try {
    await requireRole("ADMIN");
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "";
  const filename = templateMap[type];
  if (!filename) {
    return NextResponse.json({ message: "Invalid template type" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "samples", filename);
  let fileContents: string;
  try {
    fileContents = await fs.readFile(filePath, "utf8");
  } catch {
    return NextResponse.json({ message: "Template not found" }, { status: 404 });
  }

  return new NextResponse(fileContents, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=${filename}`,
      "Cache-Control": "no-store"
    }
  });
}
