import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] font-mono",
        className,
      )}
      {...props}
    />
  );
}
