"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Pagination({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn("flex items-center justify-center", className)}
      {...props}
    />
  );
}

export function PaginationContent({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn("flex items-center gap-2", className)} {...props} />;
}

export function PaginationItem({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn("list-none", className)} {...props} />;
}

type PaginationLinkProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean;
};

export function PaginationLink({ className, isActive, ...props }: PaginationLinkProps) {
  return (
    <button
      type="button"
      className={cn(
        "h-9 min-w-[36px] rounded-lg border border-surface-200 px-3 text-sm font-semibold text-brand-900 transition hover:bg-surface-100 disabled:pointer-events-none disabled:opacity-50",
        isActive && "border-accent-500 bg-accent-600/10 text-accent-600",
        className
      )}
      {...props}
    />
  );
}

export function PaginationPrevious(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <PaginationLink aria-label="Previous page" {...props} />;
}

export function PaginationNext(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <PaginationLink aria-label="Next page" {...props} />;
}
