"use client";

import type { OutputLanguage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface LanguageSelectorProps {
  value: OutputLanguage;
  onChange: (lang: OutputLanguage) => void;
}

const OPTIONS: { id: OutputLanguage; label: string; hint: string }[] = [
  { id: "en", label: "English", hint: "EN" },
  { id: "pt", label: "Português", hint: "PT" },
];

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Output language</Label>
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
          </button>
        ))}
      </div>
    </div>
  );
}
