"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/format";

type CheckoutItemRow = {
  id: string;
  partStkNo: string;
  qty: number;
  lineTotal: string;
};

type CheckoutClientProps = {
  items: CheckoutItemRow[];
  total: string;
  defaultFirstName: string;
  defaultLastName: string;
  defaultEmail: string;
  defaultShippingMethod: string;
};

type FieldErrors = Partial<
  Record<"firstName" | "lastName" | "email" | "shippingMethod", string>
>;

const shippingOptions = ["Air", "Sea", "FedEx", "DHL", "Others"];

export function CheckoutClient({
  items,
  total,
  defaultFirstName,
  defaultLastName,
  defaultEmail,
  defaultShippingMethod,
}: CheckoutClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [firstName, setFirstName] = useState(defaultFirstName);
  const [lastName, setLastName] = useState(defaultLastName);
  const [email, setEmail] = useState(defaultEmail);
  const [shippingMethod, setShippingMethod] = useState(
    shippingOptions.includes(defaultShippingMethod)
      ? defaultShippingMethod
      : "",
  );
  const [poNumber, setPoNumber] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [saveDefaultShipping, setSaveDefaultShipping] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);

  const validate = () => {
    const nextErrors: FieldErrors = {};
    if (!firstName.trim()) {
      nextErrors.firstName = "First name is required.";
    }
    if (!lastName.trim()) {
      nextErrors.lastName = "Last name is required.";
    }
    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!emailRegex.test(email.trim())) {
      nextErrors.email = "Enter a valid email.";
    }
    if (!shippingMethod.trim()) {
      nextErrors.shippingMethod = "Shipping method is required.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    setSaving(true);
    const res = await fetch("/api/portal/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        shippingMethod,
        poNumber: poNumber.trim() || null,
        orderNote: orderNote.trim() || null,
        saveDefaultShipping,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (data?.fieldErrors) {
        const nextErrors: FieldErrors = {};
        (Object.keys(data.fieldErrors) as Array<keyof FieldErrors>).forEach(
          (key) => {
            const value = data.fieldErrors[key];
            if (Array.isArray(value) && value[0]) {
              nextErrors[key] = value[0];
            }
          },
        );
        setErrors(nextErrors);
      }
      toast({
        title: data?.message ?? "Failed to place order. Please try again",
        variant: "error",
      });
      setSaving(false);
      return;
    }
    router.push(`/portal/orders/${data.orderId}?notice=order-placed`);
  };

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-surface-200 bg-white px-7 py-7 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">
          Dealer Portal
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-brand-950">Checkout</h2>
            <p className="mt-2 text-sm text-brand-700">
              Review your order, confirm totals, and place the request for
              processing.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-surface-200 bg-surface-50 px-3 py-2 text-xs font-semibold text-brand-700">
            <span className="rounded-full bg-accent-600/10 px-2 py-1 text-accent-600">
              Step 2
            </span>
            Confirm order
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-7">
          <Card className="border border-surface-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4 text-sm text-brand-700">
                Orders are placed on hold for manual processing. Track updates
                in your orders list.
              </div>
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-surface-200 bg-surface-50 p-6 text-center text-brand-700">
                  Your cart is empty.
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-surface-200 bg-white px-5 py-4"
                    >
                      <div>
                        <p className="text-base font-semibold text-brand-950">
                          {item.partStkNo}
                        </p>
                        <p className="text-xs uppercase tracking-[0.2em] text-brand-500">
                          Qty {item.qty}
                        </p>
                      </div>
                      <p className="text-base font-semibold text-brand-900">
                        {formatMoney(item.lineTotal)}
                      </p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-surface-200 pt-4 text-base font-semibold">
                    <span>Total</span>
                    <span>{formatMoney(total)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-surface-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle>Contact & shipping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-brand-700">
                    First name
                  </label>
                  <Input
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    aria-invalid={Boolean(errors.firstName)}
                    className={
                      errors.firstName
                        ? "border-status-error focus:border-status-error"
                        : undefined
                    }
                  />
                  {errors.firstName ? (
                    <p className="mt-1 text-xs text-status-error">
                      {errors.firstName}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="text-sm font-semibold text-brand-700">
                    Last name
                  </label>
                  <Input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    aria-invalid={Boolean(errors.lastName)}
                    className={
                      errors.lastName
                        ? "border-status-error focus:border-status-error"
                        : undefined
                    }
                  />
                  {errors.lastName ? (
                    <p className="mt-1 text-xs text-status-error">
                      {errors.lastName}
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-brand-700">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  className={
                    errors.email
                      ? "border-status-error focus:border-status-error"
                      : undefined
                  }
                />
                {errors.email ? (
                  <p className="mt-1 text-xs text-status-error">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="text-sm font-semibold text-brand-700">
                  Shipping method
                </label>
                <Select
                  value={shippingMethod}
                  onChange={(event) => setShippingMethod(event.target.value)}
                  className={
                    errors.shippingMethod
                      ? "border-status-error focus:border-status-error"
                      : undefined
                  }
                >
                  <option value="">Select a method</option>
                  {shippingOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
                {errors.shippingMethod ? (
                  <p className="mt-1 text-xs text-status-error">
                    {errors.shippingMethod}
                  </p>
                ) : null}
                <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-brand-700">
                  <input
                    type="checkbox"
                    checked={saveDefaultShipping}
                    onChange={(event) =>
                      setSaveDefaultShipping(event.target.checked)
                    }
                    className="h-4 w-4 rounded border-surface-200 text-accent-600 focus:ring-accent-500/40"
                  />
                  Save as my default shipping method
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-brand-700">
                    PO Number
                  </label>
                  <Input
                    value={poNumber}
                    onChange={(event) => setPoNumber(event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-brand-700">
                    Order note
                  </label>
                  <textarea
                    value={orderNote}
                    onChange={(event) => setOrderNote(event.target.value)}
                    rows={3}
                    className="min-h-[90px] w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-brand-900 shadow-sm placeholder:text-brand-600 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32">
          <Card className="border border-surface-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle>Confirmation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between text-sm text-brand-700">
                <span>Items</span>
                <span>{items.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-brand-700">
                <span>Fulfillment</span>
                <span>Manual approval</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold text-brand-950">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>
              <form onSubmit={handleSubmit}>
                <Button
                  type="submit"
                  variant="accent"
                  className="w-full"
                  disabled={saving}
                >
                  {saving ? "Placing order..." : "Place order"}
                </Button>
              </form>
              <Button asChild variant="ghost" className="w-full text-brand-700">
                <Link href="/portal/cart">Back to cart</Link>
              </Button>
              <p className="text-xs text-brand-600">
                By placing an order you agree to dealer terms and availability
                checks.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
