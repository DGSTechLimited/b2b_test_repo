"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Tag from "lucide-react/dist/esm/icons/tag";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";
import type { CartSummary } from "@/types/cart";

type CartItemRow = {
  id: string;
  partStkNo: string;
  description: string | null;
  qty: number;
  lineTotal: string;
};

type CartClientProps = {
  items: CartItemRow[];
  total: string;
  onUpdateCartItem: (formData: FormData) => Promise<CartSummary>;
};

function QuantityStepper({ name, initialQty }: { name: string; initialQty: number }) {
  const [qty, setQty] = useState(initialQty);

  return (
    <div className="flex items-center overflow-hidden rounded-xl border border-surface-200 bg-white">
      <button
        type="button"
        onClick={() => setQty((value) => Math.max(1, value - 1))}
        className="px-3 py-2 text-sm text-brand-700 hover:bg-surface-100"
      >
        −
      </button>
      <input
        readOnly
        name={name}
        value={qty}
        className="w-10 border-0 bg-transparent text-center text-sm font-medium focus:ring-0"
      />
      <button
        type="button"
        onClick={() => setQty((value) => value + 1)}
        className="px-3 py-2 text-sm text-brand-700 hover:bg-surface-100"
      >
        +
      </button>
    </div>
  );
}

export function CartClient({ items, total, onUpdateCartItem }: CartClientProps) {
  const searchParams = useSearchParams();
  const showEmptyNotice = searchParams.get("notice") === "empty";
  return (
    <div className="space-y-10">
      <div className="rounded-3xl border border-surface-200 bg-white px-7 py-7 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">Dealer Portal</p>
        <h2 className="mt-2 text-3xl font-extrabold text-brand-950">Shopping Cart</h2>
        <p className="mt-2 text-sm text-brand-700">
          Review parts, adjust quantities, and complete your order.
        </p>
        {showEmptyNotice ? (
          <div className="mt-4 rounded-2xl border border-accent-600/20 bg-accent-600/10 px-4 py-3 text-sm font-semibold text-accent-600">
            Your cart is empty. Add parts before checking out.
          </div>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border border-surface-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Cart Items</CardTitle>
              <span className="text-sm text-brand-600">{items.length} items</span>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-surface-200 bg-surface-50 p-6 text-center">
                <p className="text-brand-700">Your cart is empty.</p>
                <Button asChild variant="accent" className="mt-4">
                  <Link href="/portal/parts">
                    Browse parts to build your order
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-[minmax(0,1fr)_220px_120px] gap-4 text-xs uppercase tracking-[0.2em] text-brand-500">
                  <span>Product</span>
                  <span>Quantity</span>
                  <span className="text-right">Price</span>
                </div>
                {items.map((item) => (
                  <form
                    key={item.id}
                    action={onUpdateCartItem}
                    className="grid grid-cols-[minmax(0,1fr)_220px_120px] items-center gap-5 rounded-2xl border border-surface-200 bg-white px-5 py-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-brand-950">{item.partStkNo}</p>
                        <p className="text-sm text-brand-700">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="hidden" name="itemId" value={item.id} />
                      <QuantityStepper name="qty" initialQty={item.qty} />
                      <Button type="submit" variant="accent" className="h-10 rounded-full px-5">
                        Update
                      </Button>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <p className="text-base font-semibold text-brand-900">
                        {formatMoney(item.lineTotal)}
                      </p>
                      <button
                        type="submit"
                        name="removeItem"
                        value={item.id}
                        className="text-brand-600 hover:text-status-error"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5 lg:sticky lg:top-32">
          <Card className="border border-surface-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-brand-600" />
              Coupon Code
            </CardTitle>
          </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Enter your coupon code" className="h-11" />
              <Button variant="outline" className="w-full">
                Apply your coupon
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-surface-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
            <CardContent className="space-y-3 text-sm text-brand-700">
              <div className="flex items-center justify-between">
                <span>Discount</span>
                <span>£0.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tax</span>
                <span>£0.00</span>
              </div>
              <div className="flex items-center justify-between border-t border-surface-200 pt-3 text-base font-semibold text-brand-950">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>
              <Button asChild variant="accent" disabled={items.length === 0} className="w-full">
                <Link href="/portal/checkout">Proceed to checkout</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full text-brand-700">
                <Link href="/portal/parts">Continue shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
