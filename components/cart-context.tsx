"use client";

import * as React from "react";

type CartContextValue = {
  count: number;
  items: Array<{
    id: string;
    partStkNo: string;
    description: string | null;
    qty: number;
    unitPrice: string;
    lineTotal: string;
  }>;
  total: string;
  loading: boolean;
  refreshCart: () => Promise<void>;
  refreshCount: () => Promise<void>;
};

const CartContext = React.createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = React.useState(0);
  const [items, setItems] = React.useState<CartContextValue["items"]>([]);
  const [total, setTotal] = React.useState("0");
  const [loading, setLoading] = React.useState(false);

  const refreshCart = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart/summary", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) {
          setLoading(false);
          return;
        }
        setLoading(false);
        return;
      }
      const data = await res.json();
      const nextCount = typeof data.count === "number" ? data.count : 0;
      setCount(nextCount);
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(typeof data.total === "string" ? data.total : "0");
    } catch {
      // Ignore count refresh errors.
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCount = React.useCallback(async () => {
    await refreshCart();
  }, [refreshCart]);

  React.useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return (
    <CartContext.Provider value={{ count, items, total, loading, refreshCart, refreshCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
