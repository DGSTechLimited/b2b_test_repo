"use client";

import { cn } from "@/lib/utils";

type AdminContentContainerProps = {
  className?: string;
  children: React.ReactNode;
};

export function AdminContentContainer({ className, children }: AdminContentContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-[1440px] px-6", className)}>
      {children}
    </div>
  );
}
