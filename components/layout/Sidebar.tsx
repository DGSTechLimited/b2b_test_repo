"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LayoutDashboard from "lucide-react/dist/esm/icons/layout-dashboard";
import Users from "lucide-react/dist/esm/icons/users";
import UploadCloud from "lucide-react/dist/esm/icons/upload-cloud";
import FileDown from "lucide-react/dist/esm/icons/file-down";
import Truck from "lucide-react/dist/esm/icons/truck";
import { cn } from "@/lib/utils";

const navItems = [
  // { label: "Dashboard", href: "/admin", icon: LayoutDashboard, disabled: true },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Uploads", href: "/admin/uploads", icon: UploadCloud },
  { label: "Backorders", href: "/admin/backorders", icon: Truck },
  { label: "Order Export", href: "/admin/orders/export", icon: FileDown }
];

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-72 flex-col gap-6 border-r border-white/10 bg-gradient-to-b from-navy-900 via-navy-800 to-navy-700 text-white shadow-soft",
        className
      )}
    >
      <div className="px-6 pt-8">
        <p className="text-xs uppercase tracking-[0.3em] text-white/70">Operations</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Dealer Console</h2>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-4 pb-6">
        {navItems.map((item) => {
          const isRoot = item.href === "/admin";
          const active = isRoot
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          if (item.disabled) {
            return (
              <span
                key={item.href}
                aria-disabled="true"
                className="relative flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/40"
              >
                <Icon className="h-4 w-4 text-white/40" />
                {item.label}
              </span>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "rounded-r-2xl bg-gradient-to-r from-white/22 via-white/14 to-white/6 text-white shadow-[0_6px_16px_rgba(0,0,0,0.25)] ring-1 ring-white/12"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-white" : "text-white/70")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 pb-6 text-xs text-white/50">
        Secure access. All actions audited.
      </div>
    </aside>
  );
}
