"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface SectionOptions {
  includeTechnicalSkills: boolean;
  includeProjects: boolean;
}

interface SectionTogglesProps {
  value: SectionOptions;
  onChange: (next: SectionOptions) => void;
}

const OPTIONS: {
  key: keyof SectionOptions;
  label: string;
  hint: string;
}[] = [
  {
    key: "includeTechnicalSkills",
    label: "Technical Skills",
    hint: "skills[]",
  },
  {
    key: "includeProjects",
    label: "Projects",
    hint: "projects[]",
  },
];

export function SectionToggles({ value, onChange }: SectionTogglesProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <Label>Optional sections</Label>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
          include / omit
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const on = value[opt.key];
          return (
            <button
              key={opt.key}
              type="button"
              aria-pressed={on}
              onClick={() => onChange({ ...value, [opt.key]: !on })}
              className={cn(
                "cursor-pointer rounded-sm border border-dashed px-3 py-3 text-left transition font-mono",
                on
                  ? "border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--foreground)]"
                  : "border-[var(--border)] bg-white/50 text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]",
              )}
            >
              <div className="text-[10px] uppercase tracking-[0.2em] opacity-60">
                {on ? "on" : "off"} · {opt.hint}
              </div>
              <div className="mt-1 text-sm">{opt.label}</div>
            </button>
          );
        })}
      </div>
      <p className="font-mono text-[11px] leading-snug text-[var(--muted)]">
        Off = omit that section from the output. Certifications are always kept.
      </p>
    </div>
  );
}
