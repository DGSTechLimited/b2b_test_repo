import Image from "next/image";
import Link from "next/link";
import ShoppingCart from "lucide-react/dist/esm/icons/shopping-cart";
import { PortalNav } from "@/components/layout/PortalNav";
import { TopInfoBar } from "@/components/layout/TopInfoBar";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/require-auth";
import { clearCartIfExpired } from "@/lib/cart-expiry";
import { getCartWithItemsByUserId } from "@/lib/db/portal-shell";

export async function PortalShell({ children }: { children: React.ReactNode }) {
  const session = await requireRole("DEALER");
  const userId = (session.user as any).id as string;
  const cart = await getCartWithItemsByUserId(userId);
  const expired = await clearCartIfExpired(cart);
  const cartCount = expired ? 0 : cart?.items.reduce((sum, item) => sum + item.qty, 0) ?? 0;
  const cartLabel = cartCount > 99 ? "99+" : String(cartCount);

  return (
    <div className="min-h-screen bg-page">
      <div className="sticky top-0 z-20">
        <TopInfoBar />
        <header className="border-b border-surface-200/80 bg-white/95 shadow-soft backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-5">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/client-logo.svg"
                alt="Client logo"
                width={100}
                height={100}
                className="object-contain D_portal_nav_logo"
              />
            </div>

            <PortalNav />

            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="ghost"
                className="relative h-10 w-10 rounded-full p-0 text-brand-700 hover:bg-surface-100"
                aria-label="Cart"
              >
                <Link href="/portal/cart" className="relative inline-flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 ? (
                    <span className="absolute -right-2 -top-2 inline-flex min-w-[18px] items-center justify-center rounded-full bg-accent-600 px-1.5 text-[10px] font-semibold leading-5 text-white">
                      {cartLabel}
                    </span>
                  ) : null}
                </Link>
              </Button>
              <UserMenu />
            </div>
          </div>
        </header>
      </div>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
