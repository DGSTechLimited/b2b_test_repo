import Link from "next/link";
import { Shield } from "lucide-react";
import { UserMenu } from "@/components/user-menu";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-surface-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-brand-900" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-700">Admin</p>
              <h1 className="text-lg font-semibold">Dealer Control Room</h1>
            </div>
          </div>
          <nav className="flex items-center gap-6 text-sm font-semibold">
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/users">Users</Link>
            <Link href="/admin/uploads">Uploads</Link>
            <Link href="/admin/orders/export">Order Export</Link>
          </nav>
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
