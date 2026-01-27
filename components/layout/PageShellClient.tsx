"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

type PageShellClientProps = {
  user: {
    email?: string | null;
    role?: string | null;
  };
  children: React.ReactNode;
};

export default function PageShellClient({ user, children }: PageShellClientProps) {
  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar className="fixed left-0 top-0 hidden h-full lg:flex" />
      <div className="lg:pl-72">
        <Topbar user={user} />
        <main className="pb-12 pt-8">{children}</main>
      </div>
    </div>
  );
}
