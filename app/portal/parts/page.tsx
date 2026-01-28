import { requireRole } from "@/lib/require-auth";
import { addToCart, updateCartItem } from "@/app/actions/portal";
import { getPartsPageData } from "@/lib/db/portal-pages";
import { PartsClient } from "./PartsClient";

const ENABLE_SEARCH_FILTERS = false;
const ENABLE_PRICING_FILTERS = false;

export default async function PartsPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await requireRole("DEALER");
  const userId = (session.user as any).id as string;
  const { dealerTiers, parts, filters, initialCart } = await getPartsPageData({
    userId,
    searchParams,
    enableSearchFilters: ENABLE_SEARCH_FILTERS,
    enablePricingFilters: ENABLE_PRICING_FILTERS
  });

  return (
    <PartsClient
      dealerTiers={dealerTiers}
      parts={parts}
      filters={filters}
      initialCart={initialCart}
      onAddToCart={addToCart}
      onUpdateCartItem={updateCartItem}
    />
  );
}
