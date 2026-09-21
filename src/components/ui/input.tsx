import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-sm border border-dashed border-[var(--border-strong)] bg-white/70 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/70 outline-none transition focus-visible:border-[var(--accent)] focus-visible:ring-1 focus-visible:ring-[var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-50 font-mono",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";
