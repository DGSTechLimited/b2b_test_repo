"use client";

import { SessionProvider } from "next-auth/react";
import { ForcePasswordChange } from "@/components/force-password-change";
import { CartProvider } from "@/components/cart-context";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <CartProvider>
          {children}
          <ForcePasswordChange />
        </CartProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
