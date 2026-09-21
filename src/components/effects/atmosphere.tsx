"use client";

import { cn } from "@/lib/utils";

export function NoiseOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.045] mix-blend-multiply"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "180px 180px",
      }}
    />
  );
}

export function SoftVignette() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[50]"
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 55%, rgba(80,90,100,0.08) 100%)",
      }}
    />
  );
}

interface AsciiFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function AsciiFrame({ children, className }: AsciiFrameProps) {
  return (
    <div
      className={cn(
        "ascii-frame rounded-sm border border-dashed border-[var(--border-strong)] bg-[var(--panel)] backdrop-blur-[2px]",
        className,
      )}
    >
      <span className="ascii-corner-bl" aria-hidden>
        +
      </span>
      <span className="ascii-corner-br" aria-hidden>
        +
      </span>
      {children}
    </div>
  );
}
