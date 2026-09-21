"use client";

import type { ResumeDensity } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface DensitySelectorProps {
  value: ResumeDensity;
  onChange: (density: ResumeDensity) => void;
}

const OPTIONS: {
  id: ResumeDensity;
  label: string;
  hint: string;
  detail: string;
}[] = [
  {
    id: "condensed",
    label: "Condensed",
    hint: "~1 pg",
    detail: "~1.0–1.4 pages (max 2) — dense, not sparse",
  },
  {
    id: "extended",
    label: "Extended",
    hint: "2–3 pg",
    detail: "Full depth — more roles, metrics, keywords",
  },
];

export function DensitySelector({ value, onChange }: DensitySelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Length</Label>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "cursor-pointer rounded-sm border border-dashed px-3 py-3 text-left transition font-mono",
              value === opt.id
                ? "border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--foreground)]"
                : "border-[var(--border)] bg-white/50 text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]",
            )}
          >
            <div className="text-[10px] uppercase tracking-[0.2em] opacity-60">
              {opt.hint}
            </div>
            <div className="mt-1 text-sm">{opt.label}</div>
            <p className="mt-1 text-[10px] leading-snug opacity-70">
              {opt.detail}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
