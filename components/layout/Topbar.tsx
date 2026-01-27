"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Menu from "lucide-react/dist/esm/icons/menu";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/user-menu";

const titleMap = [
  { match: "/admin/users", title: "Users" },
  { match: "/admin/uploads", title: "Uploads" },
  { match: "/admin/backorders", title: "Backorders" },
  { match: "/admin/orders/export", title: "Order Export" },
  { match: "/admin", title: "Dashboard" }
];

type TopbarProps = {
  user: {
    email?: string | null;
    role?: string | null;
  };
};

export function Topbar({ user }: TopbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const title = useMemo(() => {
    const match = titleMap.find((item) => pathname.startsWith(item.match));
    return match ? match.title : "Dashboard";
  }, [pathname]);

  return (
    <div className="sticky top-0 z-20 border-b border-surface-200 bg-white/95 backdrop-blur">
      <div className="relative flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            className="lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <div className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Image
            src="/brand/client-logo.svg"
            alt="Client logo"
            width={32}
            height={32}
            className="h-8 w-auto object-contain"
          />
        </div>
        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-30 transition lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-brand-950/80 transition-opacity",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
        />
        <Sidebar
          className={cn(
            "absolute left-0 top-0 h-full transition-transform",
            open ? "translate-x-0" : "-translate-x-full"
          )}
          onNavigate={() => setOpen(false)}
        />
      </div>
    </div>
  );
}
