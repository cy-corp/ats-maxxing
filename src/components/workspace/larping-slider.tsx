"use client";

import { motion } from "framer-motion";
import { LARPING_LEVELS, LARPING_WARNING, getLarpingMeta } from "@/lib/larping";
import type { LarpingLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface LarpingSliderProps {
  value: LarpingLevel;
  onChange: (level: LarpingLevel) => void;
}

export function LarpingSlider({ value, onChange }: LarpingSliderProps) {
  const meta = getLarpingMeta(value);
  const pct = ((value - 1) / 4) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <Label>Larping Level</Label>
          <p className="mt-1 font-pixel text-base text-[var(--foreground)] sm:text-lg">
            {value}. {meta.label}
          </p>
        </div>
        <span className="rounded-sm border border-dashed border-[var(--border-strong)] bg-white/60 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
          {meta.short}
        </span>
      </div>

      <div className="relative pt-2 pb-1">
        <div className="relative h-3 overflow-hidden rounded-sm border border-dashed border-[var(--border-strong)] bg-white/70">
          <motion.div
            className="absolute inset-y-0 left-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(142,186,227,0.45), rgba(106,159,196,0.85), rgba(61,90,69,0.55))",
            }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent, transparent 5px, rgba(42,46,52,0.12) 6px)",
            }}
          />
        </div>

        <motion.div
          className="absolute top-1/2 z-10 -translate-y-1/2"
          animate={{ left: `calc(${pct}% - 9px)` }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
        >
          <div className="flex size-[18px] items-center justify-center border border-[var(--foreground)]/50 bg-[var(--background)] font-mono text-[10px] text-[var(--foreground)] shadow-sm">
            +
          </div>
        </motion.div>

        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          aria-label="Larping Level"
          onChange={(e) => onChange(Number(e.target.value) as LarpingLevel)}
          className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
        />
      </div>

      <div className="grid grid-cols-5 gap-1">
        {LARPING_LEVELS.map((level) => (
          <button
            key={level.level}
            type="button"
            onClick={() => onChange(level.level)}
            className={cn(
              "cursor-pointer rounded-sm border border-dashed px-1 py-1.5 font-mono text-[9px] uppercase tracking-wide transition",
              value === level.level
                ? "border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--foreground)]"
                : "border-[var(--border)] bg-transparent text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]",
            )}
          >
            {level.level}
          </button>
        ))}
      </div>

      <p className="font-mono text-xs leading-relaxed text-[var(--muted)]">
        {meta.description}
      </p>

      {meta.invents ? (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-sm border border-dashed border-[var(--warning)]/50 bg-[rgba(154,107,47,0.08)] px-3 py-2 font-mono text-xs text-[var(--warning)]"
        >
          ⚠ {LARPING_WARNING}
        </motion.div>
      ) : null}
    </div>
  );
}
