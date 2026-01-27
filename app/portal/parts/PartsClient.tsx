"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import Search from "lucide-react/dist/esm/icons/search";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/format";
import BannerCarousel from "@/components/BannerCarousel";
import type { CartSummary } from "@/types/cart";

/* =======================
   TYPES
======================= */

type PartType = "AFTERMARKET" | "GENUINE" | "BRANDED";

type PartRow = {
  id: string;
  manufacturer: string;
  partType: PartType;
  stkNo: string;
  description: string | null;
  oem: string | null;
  supplier: string | null;
  barcode: string | null;
  minimumPrice: string;
  bandA: string;
  bandB: string;
  bandC: string;
  bandD: string;
  bandE: string;
  bandF: string;
};

type PricingTier = "A" | "B" | "C" | "D" | "E" | "F";

type DealerTierSet = {
  genuineTier: PricingTier;
  aftermarketTier: PricingTier;
  brandedTier: PricingTier;
};

type FilterState = {
  q: string;
  manufacturer: string;
  supplier: string;
  brand: string;
  oem: string;
  partType: string;
  priceMin: number | null;
  priceMax: number | null;
};

type PartsClientProps = {
  dealerTiers: DealerTierSet;
  parts: PartRow[];
  filters: FilterState;
  initialCart: CartSummary;
  onAddToCart: (formData: FormData) => Promise<CartSummary>;
  onUpdateCartItem: (formData: FormData) => Promise<CartSummary>;
};

/* =======================
   CONSTANTS
======================= */

const PAGE_SIZE = 12;
const ENABLE_SEARCH_FILTERS = false;
const ENABLE_PRICING_FILTERS = false;

const BADGE_STYLE: Record<PartType, string> = {
  AFTERMARKET: "bg-blue-100 text-blue-800",
  GENUINE: "bg-green-100 text-green-800",
  BRANDED: "bg-purple-100 text-purple-800",
};

/* =======================
   QUANTITY STEPPER
======================= */

function QuantityStepper() {
  const [qty, setQty] = useState(1);

  return (
    <div className="flex items-center overflow-hidden rounded-xl border border-surface-200 bg-white">
      <button
        type="button"
        onClick={() => setQty((q) => Math.max(1, q - 1))}
        className="px-3 py-2 text-sm text-brand-700 hover:bg-surface-100"
      >
        −
      </button>

      <input
        readOnly
        name="qty"
        value={qty}
        className="w-10 border-0 bg-transparent text-center text-sm font-medium focus:ring-0"
      />

      <button
        type="button"
        onClick={() => setQty((q) => q + 1)}
        className="px-3 py-2 text-sm text-brand-700 hover:bg-surface-100"
      >
        +
      </button>
    </div>
  );
}

/* =======================
   FILTER FORM (STOCK REMOVED)
======================= */

type FilterFormProps = FilterState & {
  formRef: RefObject<HTMLFormElement>;
};

function FilterForm({
  q,
  manufacturer,
  supplier,
  brand,
  oem,
  partType,
  priceMin,
  priceMax,
  formRef,
}: FilterFormProps) {
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const nextQ = String(formData.get("q") ?? "").trim();
    if (nextQ) params.set("q", nextQ);
    if (ENABLE_SEARCH_FILTERS) {
      const nextManufacturer = String(formData.get("manufacturer") ?? "").trim();
      const nextSupplier = String(formData.get("supplier") ?? "").trim();
      const nextBrand = String(formData.get("brand") ?? "").trim();
      const nextOem = String(formData.get("oem") ?? "").trim();
      if (nextManufacturer) params.set("manufacturer", nextManufacturer);
      if (nextSupplier) params.set("supplier", nextSupplier);
      if (nextBrand) params.set("brand", nextBrand);
      if (nextOem) params.set("oem", nextOem);
    }
    if (ENABLE_PRICING_FILTERS) {
      const nextPriceMin = String(formData.get("priceMin") ?? "").trim();
      const nextPriceMax = String(formData.get("priceMax") ?? "").trim();
      if (nextPriceMin) params.set("priceMin", nextPriceMin);
      if (nextPriceMax) params.set("priceMax", nextPriceMax);
    }
    if (partType) params.set("partType", partType);
    const query = params.toString();
    router.push(query ? `/portal/parts?${query}` : "/portal/parts", { scroll: false });
  };

  return (
    <form ref={formRef} className="space-y-4" onSubmit={handleSubmit}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search by part no, description"
          className="h-11 pl-9 pr-12"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-[#0b4395] text-white shadow-sm transition hover:brightness-105"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Search Filters
        </p>

        <div className="mt-4 space-y-3">
          <Input
            name={ENABLE_SEARCH_FILTERS ? "manufacturer" : undefined}
            defaultValue={ENABLE_SEARCH_FILTERS ? manufacturer : ""}
            placeholder="Manufacturer"
            className="h-11"
            readOnly={!ENABLE_SEARCH_FILTERS}
            aria-disabled={!ENABLE_SEARCH_FILTERS}
            tabIndex={ENABLE_SEARCH_FILTERS ? 0 : -1}
          />

          <Input
            name={ENABLE_SEARCH_FILTERS ? "supplier" : undefined}
            defaultValue={ENABLE_SEARCH_FILTERS ? supplier : ""}
            placeholder="Supplier"
            className="h-11"
            readOnly={!ENABLE_SEARCH_FILTERS}
            aria-disabled={!ENABLE_SEARCH_FILTERS}
            tabIndex={ENABLE_SEARCH_FILTERS ? 0 : -1}
          />

          <Input
            name={ENABLE_SEARCH_FILTERS ? "brand" : undefined}
            defaultValue={ENABLE_SEARCH_FILTERS ? brand : ""}
            placeholder="Brand"
            className="h-11"
            readOnly={!ENABLE_SEARCH_FILTERS}
            aria-disabled={!ENABLE_SEARCH_FILTERS}
            tabIndex={ENABLE_SEARCH_FILTERS ? 0 : -1}
          />

          <Input
            name={ENABLE_SEARCH_FILTERS ? "oem" : undefined}
            defaultValue={ENABLE_SEARCH_FILTERS ? oem : ""}
            placeholder="OEM"
            className="h-11"
            readOnly={!ENABLE_SEARCH_FILTERS}
            aria-disabled={!ENABLE_SEARCH_FILTERS}
            tabIndex={ENABLE_SEARCH_FILTERS ? 0 : -1}
          />

        </div>
      </div> */}

      {/* <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Pricing
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Input
            name={ENABLE_PRICING_FILTERS ? "priceMin" : undefined}
            type="number"
            min={0}
            defaultValue={ENABLE_PRICING_FILTERS ? priceMin ?? "" : ""}
            placeholder="Min price"
            className="h-11"
            readOnly={!ENABLE_PRICING_FILTERS}
            aria-disabled={!ENABLE_PRICING_FILTERS}
            tabIndex={ENABLE_PRICING_FILTERS ? 0 : -1}
          />
          <Input
            name={ENABLE_PRICING_FILTERS ? "priceMax" : undefined}
            type="number"
            min={0}
            defaultValue={ENABLE_PRICING_FILTERS ? priceMax ?? "" : ""}
            placeholder="Max price"
            className="h-11"
            readOnly={!ENABLE_PRICING_FILTERS}
            aria-disabled={!ENABLE_PRICING_FILTERS}
            tabIndex={ENABLE_PRICING_FILTERS ? 0 : -1}
          />
        </div>
      </div> */}
    </form>
  );
}

/* =======================
   FILTER PANEL
======================= */

function FiltersPanel({
  children,
  onClear,
}: {
  children: React.ReactNode;
  onClear: () => void;
}) {
  return (
    <Card className="p-5 bg-white border border-surface-200 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-wide text-brand-900">
          Filters
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-accent-600 hover:underline"
        >
          Clear filters
        </button>
      </div>
      {children}
    </Card>
  );
}

/* =======================
   MINI CART
======================= */

type MiniCartItem = CartSummary["items"][number];

function MiniCartQuantityStepper({
  qty,
  disabled,
  onChange,
}: {
  qty: number;
  disabled?: boolean;
  onChange: (nextQty: number) => void;
}) {
  return (
    <div className="flex items-center overflow-hidden rounded-xl border border-surface-200 bg-white">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(Math.max(1, qty - 1))}
        className="px-3 py-2 text-sm text-brand-700 hover:bg-surface-100 disabled:opacity-60"
      >
        -
      </button>
      <span className="w-10 text-center text-sm font-medium">{qty}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(qty + 1)}
        className="px-3 py-2 text-sm text-brand-700 hover:bg-surface-100 disabled:opacity-60"
      >
        +
      </button>
    </div>
  );
}

function MiniCartItemRow({
  item,
  onUpdateItem,
  onRemoveItem,
}: {
  item: MiniCartItem;
  onUpdateItem: (itemId: string, qty: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
}) {
  const [qty, setQty] = useState(item.qty);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setQty(item.qty);
  }, [item.qty]);

  const handleQtyChange = async (nextQty: number) => {
    if (nextQty === qty) {
      return;
    }
    setQty(nextQty);
    setIsUpdating(true);
    await onUpdateItem(item.id, nextQty);
    setIsUpdating(false);
  };

  return (
    <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand-950">
            {item.partStkNo}
          </p>
          <p className="text-xs text-brand-700">{item.description ?? "-"}</p>
        </div>
        <button
          type="button"
          onClick={() => onRemoveItem(item.id)}
          className="text-brand-600 hover:text-status-error"
          aria-label={`Remove ${item.partStkNo}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-brand-600">
        <span>Unit</span>
        <span>{formatMoney(item.unitPrice)}</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <MiniCartQuantityStepper
          qty={qty}
          disabled={isUpdating}
          onChange={handleQtyChange}
        />
        <div className="text-right">
          <p className="text-xs text-brand-600">Line total</p>
          <p className="text-sm font-semibold text-brand-950">
            {formatMoney(item.lineTotal)}
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniCartPanel({
  cart,
  onUpdateItem,
  onRemoveItem,
}: {
  cart: CartSummary;
  onUpdateItem: (itemId: string, qty: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
}) {
  const isEmpty = cart.items.length === 0;

  return (
    <Card className="border border-surface-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-brand-950">Mini Cart</h3>
        <span className="text-xs text-brand-600">
          {cart.items.length} items
        </span>
      </div>

      {isEmpty ? (
        <div className="mt-4 rounded-2xl border border-dashed border-surface-200 bg-surface-50 p-5 text-center text-sm text-brand-700">
          <p>Your cart is empty</p>
          <p className="mt-1 text-xs text-brand-600">
            Add items to place an order
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {cart.items.map((item) => (
            <MiniCartItemRow
              key={item.id}
              item={item}
              onUpdateItem={onUpdateItem}
              onRemoveItem={onRemoveItem}
            />
          ))}

          <div className="rounded-2xl border border-surface-200 bg-white px-4 py-3 text-sm">
            <div className="flex items-center justify-between text-brand-700">
              <span>Subtotal</span>
              <span className="font-semibold text-brand-950">
                {formatMoney(cart.total)}
              </span>
            </div>
          </div>

          <Button asChild variant="outline" className="w-full">
            <Link href="/portal/cart">View cart</Link>
          </Button>
          {isEmpty ? (
            <Button variant="accent" disabled className="w-full">
              Checkout
            </Button>
          ) : (
            <Button asChild variant="accent" className="w-full">
              <Link href="/portal/checkout">Checkout</Link>
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

/* =======================
   MAIN COMPONENT
======================= */

export function PartsClient({
  dealerTiers,
  parts,
  filters,
  initialCart,
  onAddToCart,
  onUpdateCartItem,
}: PartsClientProps) {
  const [page, setPage] = useState(1);
  const [activePartType, setActivePartType] = useState(filters.partType || "");
  const [cart, setCart] = useState<CartSummary>(initialCart);
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleAddToCart = useCallback(
    async (formData: FormData) => {
      const nextCart = await onAddToCart(formData);
      if (nextCart) {
        setCart(nextCart);
      }
      toast({ title: "Item added to cart" });
    },
    [onAddToCart, toast],
  );

  const handleUpdateCartItem = useCallback(
    async (itemId: string, qty: number) => {
      const formData = new FormData();
      formData.set("itemId", itemId);
      formData.set("qty", String(qty));
      const nextCart = await onUpdateCartItem(formData);
      if (nextCart) {
        setCart(nextCart);
      }
    },
    [onUpdateCartItem],
  );

  const handleRemoveCartItem = useCallback(
    async (itemId: string) => {
      const formData = new FormData();
      formData.set("removeItem", itemId);
      const nextCart = await onUpdateCartItem(formData);
      if (nextCart) {
        setCart(nextCart);
      }
    },
    [onUpdateCartItem],
  );

  const counts = useMemo(() => {
    const summary = {
      ALL: parts.length,
      AFTERMARKET: 0,
      GENUINE: 0,
      BRANDED: 0,
    };
    parts.forEach((part) => {
      summary[part.partType] += 1;
    });
    return summary;
  }, [parts]);

  const filteredParts = useMemo(() => {
    if (!activePartType) {
      return parts;
    }
    return parts.filter((part) => part.partType === activePartType);
  }, [activePartType, parts]);

  const paginatedParts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredParts.slice(start, start + PAGE_SIZE);
  }, [filteredParts, page]);

  const totalPages = Math.ceil(filteredParts.length / PAGE_SIZE);

  const resolveTier = (type: PartType) =>
    type === "GENUINE"
      ? dealerTiers.genuineTier
      : type === "BRANDED"
        ? dealerTiers.brandedTier
        : dealerTiers.aftermarketTier;

  const buildHref = (nextType: string) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (ENABLE_SEARCH_FILTERS && filters.manufacturer) {
      params.set("manufacturer", filters.manufacturer);
    }
    if (ENABLE_SEARCH_FILTERS && filters.supplier) {
      params.set("supplier", filters.supplier);
    }
    if (ENABLE_SEARCH_FILTERS && filters.brand) {
      params.set("brand", filters.brand);
    }
    if (ENABLE_SEARCH_FILTERS && filters.oem) {
      params.set("oem", filters.oem);
    }
    if (ENABLE_PRICING_FILTERS && filters.priceMin !== null) {
      params.set("priceMin", String(filters.priceMin));
    }
    if (ENABLE_PRICING_FILTERS && filters.priceMax !== null) {
      params.set("priceMax", String(filters.priceMax));
    }
    if (nextType) params.set("partType", nextType);
    const query = params.toString();
    return query ? `/portal/parts?${query}` : "/portal/parts";
  };

  const handleCategoryChange = (nextType: string) => {
    setActivePartType(nextType);
    setPage(1);
    if (typeof window !== "undefined") {
      const href = buildHref(nextType);
      window.history.replaceState(null, "", href);
    }
  };

  const handleClearFilters = () => {
    formRef.current?.reset();
    setPage(1);
    router.push("/portal/parts", { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">
            Dealer Portal
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-8xl space-y-5">
          <BannerCarousel
            banners={[
              { src: "/banners/banner6.jpg", alt: "Dealer portal banner" },
              { src: "/banners/banner5.jpg", alt: "PartsHub specials banner" }
            ]}
            autoPlay
            interval={3000}
            
          />
          <div className="w-full max-w-3xl mx-auto">
            <FiltersPanel onClear={handleClearFilters}>
              <FilterForm {...filters} formRef={formRef} />
            </FiltersPanel>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-200 bg-white/95 p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: "All", value: "" as const, count: counts.ALL },
                {
                  label: "Aftermarket",
                  value: "AFTERMARKET",
                  count: counts.AFTERMARKET,
                },
                { label: "Genuine", value: "GENUINE", count: counts.GENUINE },
                { label: "Branded", value: "BRANDED", count: counts.BRANDED },
              ].map((tab) => {
                const isActive = (activePartType || "") === tab.value;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => handleCategoryChange(tab.value)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                      isActive
                        ? "border-accent-600 bg-accent-600 text-white"
                        : "border-surface-200 bg-surface-50 text-brand-700 hover:bg-surface-100"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-white text-brand-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-sm font-semibold text-brand-600">
              {filteredParts.length} results
            </p>
          </div>

          {paginatedParts.length === 0 ? (
            <Card className="p-6 text-sm text-brand-700">
              No parts found for the selected filters.
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 auto-rows-fr">
              {paginatedParts.map((part) => {
                const tier = resolveTier(part.partType);
                const price = Math.max(
                  Number(part[`band${tier}` as keyof PartRow]),
                  Number(part.minimumPrice),
                );

                return (
                  <Card
                    key={part.id}
                    className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-surface-200 bg-white p-5 shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs uppercase tracking-[0.2em] text-brand-600">
                          {part.manufacturer}
                        </span>
                        <Badge
                          className={`${BADGE_STYLE[part.partType]} rounded-full px-3 py-1 text-xs`}
                        >
                          {part.partType}
                        </Badge>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold">{part.stkNo}</h3>
                        <p className="text-sm text-brand-700">
                          {part.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-brand-700">
                        <span className="whitespace-nowrap">
                          Supplier: <strong>{part.supplier ?? "-"}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-brand-600">
                          Tier {tier}
                        </p>
                        <p className="text-xl font-semibold">
                          {formatMoney(price.toString())}
                        </p>
                      </div>

                      <form
                        action={handleAddToCart}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="partId" value={part.id} />
                        <QuantityStepper />
                        <Button
                          type="submit"
                          variant="accent"
                          className="h-10 px-5 transition-transform hover:-translate-y-0.5 hover:shadow-soft"
                        >
                          Add
                        </Button>
                      </form>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </Button>
              <span className="text-sm text-brand-700">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        <div className="self-start lg:sticky lg:top-32">
          <MiniCartPanel
            cart={cart}
            onUpdateItem={handleUpdateCartItem}
            onRemoveItem={handleRemoveCartItem}
          />
        </div>
      </div>
    </div>
  );
}
