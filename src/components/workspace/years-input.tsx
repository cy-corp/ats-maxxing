"use client";

import { Label } from "@/components/ui/label";

interface YearsInputProps {
  value: number | undefined;
  onChange: (years: number | undefined) => void;
}

export function YearsInput({ value, onChange }: YearsInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor="years-experience">Years of experience</Label>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
          optional override
        </span>
      </div>
      <div className="flex items-center gap-3">
        <input
          id="years-experience"
          type="number"
          min={1}
          max={40}
          step={1}
          inputMode="numeric"
          placeholder="auto"
          value={value ?? ""}
          onChange={(e) => {
            const raw = e.target.value.trim();
            if (!raw) {
              onChange(undefined);
              return;
            }
            const n = Number(raw);
            if (!Number.isFinite(n)) return;
            onChange(Math.min(40, Math.max(1, Math.round(n))));
          }}
          className="w-24 rounded-sm border border-dashed border-[var(--border)] bg-white/60 px-3 py-2 font-mono text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
        />
        <p className="flex-1 font-mono text-[11px] leading-snug text-[var(--muted)]">
          Leave empty to infer from job dates → today. Set manually if you have
          unlisted tenure (e.g. internship).
        </p>
      </div>
    </div>
  );
}
