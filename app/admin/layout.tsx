import { getServerSession } from "next-auth";
import PageShell from "@/components/layout/PageShell.server";
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = {
    email: session?.user?.email ?? "admin@portal",
    role: (session?.user as any)?.role ?? "ADMIN"
  };

  return <PageShell user={user}>{children}</PageShell>;
}
