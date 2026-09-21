import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 [&_svg]:pointer-events-none [&_svg]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--foreground)] text-[var(--background)] hover:bg-[#1a1d22]",
        secondary:
          "bg-white/70 text-[var(--foreground)] border border-dashed border-[var(--border-strong)] hover:bg-white hover:border-[var(--foreground)]/35",
        ghost:
          "hover:bg-black/[0.04] text-[var(--muted)] hover:text-[var(--foreground)]",
        glow: "relative bg-[var(--accent-dim)] text-[var(--foreground)] border border-dashed border-[var(--accent)]/60 hover:border-[var(--accent)] hover:bg-[rgba(142,186,227,0.22)]",
        outline:
          "border border-dashed border-[var(--border-strong)] bg-transparent hover:bg-white/60 text-[var(--foreground)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-sm px-3 text-xs",
        lg: "h-12 rounded-sm px-6 text-base",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
