"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import UserCircle2 from "lucide-react/dist/esm/icons/user-circle-2";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  className?: string;
  tone?: "light" | "dark";
};

export function UserMenu({ className, tone = "dark" }: UserMenuProps) {
  const { data } = useSession();
  const email = data?.user?.email ?? "user@portal";
  const name = (data?.user as any)?.name ?? null;
  const initials = (name || email).slice(0, 1).toUpperCase();
  const lightTone = tone === "light";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "flex items-center gap-2 rounded-full px-2",
            lightTone ? "text-white hover:bg-white/10 hover:text-white" : "",
            className
          )}
        >
          <span
            className={cn(
              "hidden text-sm font-semibold md:inline",
              lightTone ? "text-white/80" : "text-brand-900"
            )}
          >
            {name || email}
          </span>
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold",
              lightTone ? "bg-white/15 text-white" : "bg-brand-900 text-white"
            )}
          >
            {initials}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2">
            <UserCircle2 className="h-4 w-4 text-brand-700" />
            My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
