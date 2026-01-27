"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
  {
    variants: {
      variant: {
        default: "bg-brand-900/10 text-brand-900",
        admin: "bg-indigo-50 text-indigo-700",
        dealer: "bg-slate-100 text-slate-700",
        accent: "bg-accent-600/15 text-accent-600",
        success: "bg-status-success/15 text-status-success",
        warning: "bg-status-warning/15 text-status-warning",
        danger: "bg-status-error/15 text-status-error",
        neutral: "bg-slate-200 text-slate-700"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
