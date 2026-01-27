"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import Search from "lucide-react/dist/esm/icons/search";
import ShoppingCart from "lucide-react/dist/esm/icons/shopping-cart";
import Headset from "lucide-react/dist/esm/icons/Headset";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/portal/parts", label: "Search", icon: Search },
  { href: "/portal/cart", label: "Cart", icon: ShoppingCart },
  { href: "/portal/orders", label: "Orders", icon: ClipboardList },
  { href: "/portal/backorders", label: "Backorders" },
  { href: "/portal/contact-support", label: "Support", icon: Headset },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/portal/parts") {
    return pathname === "/portal/parts";
  }
  return pathname.startsWith(href);
}

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 justify-center">
      <div className="flex flex-wrap items-center gap-1 rounded-full border border-surface-200 bg-white px-2 py-1 shadow-sm">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className={`rounded-full px-4 transition ${
                active
                  ? "bg-accent-600/10 text-accent-600"
                  : "text-brand-700 hover:bg-accent-600/10 hover:text-accent-600"
              }`}
            >
              <Link href={item.href} className="inline-flex items-center gap-2">
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {item.label}
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
