"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

type SignOutButtonProps = {
  className?: string;
  variant?: "default" | "accent" | "outline" | "ghost";
};

export function SignOutButton({ className, variant = "ghost" }: SignOutButtonProps) {
  return (
    <Button
      variant={variant}
      className={className}
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Sign out
    </Button>
  );
}
