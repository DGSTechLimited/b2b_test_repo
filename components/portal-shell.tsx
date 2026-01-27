import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { UserMenu } from "@/components/user-menu";

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-surface-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-surface-200 bg-white p-1">
              <Image
                src="/brand/client-logo.svg"
                alt="Client logo"
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-700">Dealer Portal</p>
              <h1 className="text-lg font-semibold">Parts Marketplace</h1>
            </div>
          </div>
          <nav className="flex items-center gap-6 text-sm font-semibold">
            <Link href="/portal/parts">Search</Link>
            <Link href="/portal/cart" className="inline-flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Cart
            </Link>
            <Link href="/portal/orders">Orders</Link>
            <Link href="/portal/backorders">Backorders</Link>
          </nav>
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
