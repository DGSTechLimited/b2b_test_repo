import PageShellClient from "@/components/layout/PageShellClient";

type PageShellProps = {
  user: {
    email?: string | null;
    role?: string | null;
  };
  children: React.ReactNode;
};

export default function PageShell({ user, children }: PageShellProps) {
  return <PageShellClient user={user}>{children}</PageShellClient>;
}
