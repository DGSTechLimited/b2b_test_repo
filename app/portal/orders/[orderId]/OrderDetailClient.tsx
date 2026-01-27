"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Hash from "lucide-react/dist/esm/icons/hash";
import PackageCheck from "lucide-react/dist/esm/icons/package-check";
import BadgeDollarSign from "lucide-react/dist/esm/icons/badge-dollar-sign";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/format";

type OrderItemRow = {
  id: string;
  partStkNo: string;
  description: string | null;
  status: string;
  trackingNo: string | null;
  qty: number;
  lineTotal: string;
};

type OrderDetailClientProps = {
  orderNumber: string;
  status: string;
  items: OrderItemRow[];
};

export function OrderDetailClient({ orderNumber, status, items }: OrderDetailClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const orderToastShownRef = useRef(false);
  const total = useMemo(
    () =>
      items.reduce((sum, item) => sum + Number(item.lineTotal), 0),
    [items]
  );

  useEffect(() => {
    const notice = searchParams.get("notice");
    if (notice === "order-placed" && !orderToastShownRef.current) {
      orderToastShownRef.current = true;
      toast({ title: "Order Placed Successfully" });
      router.replace(pathname);
    }
  }, [pathname, router, searchParams, toast]);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-surface-200 bg-white px-7 py-7 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">Order Detail</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-brand-950">{orderNumber}</h2>
            <p className="mt-2 text-sm text-brand-700">Track line items, status updates, and fulfillment notes.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-surface-200 bg-[#EEF2FF] px-4 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#4338CA]">
                <PackageCheck className="h-4 w-4" />
                Status
              </div>
              <div className="mt-1">
                <Badge variant={getStatusVariant(status)}>{status}</Badge>
              </div>
            </div>
            <div className="rounded-2xl border border-surface-200 bg-[#ECFDF3] px-4 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#16794C]">
                <Hash className="h-4 w-4" />
                Items
              </div>
              <p className="mt-1 text-lg font-semibold text-brand-950">{items.length}</p>
            </div>
            <div className="rounded-2xl border border-surface-200 bg-[#FFF7ED] px-4 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#B45309]">
                <BadgeDollarSign className="h-4 w-4" />
                Total
              </div>
              <p className="mt-1 text-lg font-semibold text-brand-950">{formatMoney(total)}</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="border border-surface-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-surface-200 bg-white px-5 py-4"
              >
                <div>
                  <p className="text-base font-semibold text-brand-950">{item.partStkNo}</p>
                  <p className="text-sm text-brand-700">{item.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-brand-600">
                    <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
                    <span>Qty {item.qty}</span>
                    {item.trackingNo ? <span>Tracking {item.trackingNo}</span> : null}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-500">Line total</p>
                  <p className="text-lg font-semibold text-brand-900">{formatMoney(item.lineTotal)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusVariant(status: string) {
  switch (status) {
    case "PROCESSING":
      return "accent" as const;
    case "PENDING":
    case "FULFILLED":
    case "SHIPPED":
    case "COMPLETED":
      return "success" as const;
    case "PARTIALLY_FULFILLED":
      return "accent" as const;
    case "OPEN":
    case "ON_HOLD":
    case "SUSPENDED":
    case "BACKORDERED":
      return "warning" as const;
    case "CANCELLED":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}
