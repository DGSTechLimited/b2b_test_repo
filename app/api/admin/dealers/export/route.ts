import { NextResponse } from "next/server";
import { stringify } from "csv-stringify/sync";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-auth";

export async function GET() {
  try {
    await requireRole("ADMIN");
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const dealers = await prisma.user.findMany({
    where: { role: "DEALER" },
    include: { dealerProfile: true },
    orderBy: { createdAt: "desc" }
  });

  const rows = dealers.map((dealer) => ({
    "Dealer ID": dealer.id,
    "Company Name": dealer.dealerProfile?.dealerName ?? dealer.name ?? "",
    Email: dealer.email,
    "Dealer Status": dealer.dealerProfile?.status ?? "ACTIVE",
    "Default Shipping Method": dealer.dealerProfile?.dispatchMethodDefault ?? "",
    "Created Date": dealer.createdAt.toISOString()
  }));

  const csv = stringify(rows, { header: true });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=dealers.csv"
    }
  });
}
