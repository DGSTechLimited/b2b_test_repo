"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-12 w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-brand-900 shadow-sm placeholder:text-brand-600 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
