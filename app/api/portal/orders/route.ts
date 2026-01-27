import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/require-auth";
import { placeOrder } from "@/app/actions/portal";

const shippingOptions = ["Air", "Sea", "FedEx", "DHL", "Others"] as const;

const orderSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  shippingMethod: z.enum(shippingOptions),
  poNumber: z.string().optional().nullable(),
  orderNote: z.string().optional().nullable(),
  saveDefaultShipping: z.boolean().optional()
});

export async function POST(request: Request) {
  try {
    await requireRole("DEALER");
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid payload", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const result = await placeOrder(parsed.data);
    return NextResponse.json({ orderId: result.orderId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Unable to place order.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
