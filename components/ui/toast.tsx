"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error";

type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  visible: boolean;
};

type ToastContextValue = {
  toast: (message: Omit<ToastMessage, "id" | "visible">) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback((message: Omit<ToastMessage, "id" | "visible">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...message, id, visible: false }]);
    requestAnimationFrame(() => {
      setToasts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, visible: true } : item))
      );
    });
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, visible: false } : item))
      );
    }, 2500);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 2750);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] space-y-3">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "w-fit max-w-[360px] rounded-xl p-4 text-sm text-white shadow-card transition-all duration-200 ease-out",
              item.visible ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0",
              item.variant === "error" ? "bg-status-error" : "bg-accent-600"
            )}
          >
            <p className="font-semibold">{item.title}</p>
            {item.description ? (
              <p className="mt-1 text-xs text-white/85">{item.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
