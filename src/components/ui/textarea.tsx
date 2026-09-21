import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[120px] w-full rounded-sm border border-dashed border-[var(--border-strong)] bg-white/70 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/70 outline-none transition focus-visible:border-[var(--accent)] focus-visible:ring-1 focus-visible:ring-[var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-50 font-mono leading-relaxed resize-y",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";
