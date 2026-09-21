"use client";

import { motion } from "framer-motion";
import type { OptimizedResume } from "@/lib/types";
import { Label } from "@/components/ui/label";

export function MatchScore({ resume }: { resume: OptimizedResume }) {
  const score = Math.round(resume.matchScore);
  const ring = Math.min(100, Math.max(0, score));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Match score</Label>
        <span className="font-mono text-[10px] text-[var(--muted)]">0–100</span>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative size-20">
          <svg viewBox="0 0 36 36" className="size-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="rgba(42,46,52,0.12)"
              strokeWidth="2"
            />
            <motion.circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${ring} 100`}
              initial={{ strokeDasharray: "0 100" }}
              animate={{ strokeDasharray: `${ring} 100` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-pixel text-lg text-[var(--foreground)]">
            {score}
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-2">
          {(
            [
              ["Keywords", resume.scoreBreakdown.keywords],
              ["Skills", resume.scoreBreakdown.skills],
              ["Experience", resume.scoreBreakdown.experience],
              ["Seniority", resume.scoreBreakdown.seniority],
            ] as const
          ).map(([label, val]) => (
            <div
              key={label}
              className="rounded-sm border border-dashed border-[var(--border)] bg-white/60 px-2 py-1.5"
            >
              <div className="font-mono text-[9px] uppercase tracking-wider text-[var(--muted)]">
                {label}
              </div>
              <div className="mt-0.5 font-mono text-sm text-[var(--foreground)]">
                {Math.round(val)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {resume.injectedKeywords?.length ? (
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            Injected keywords
          </div>
          <div className="flex flex-wrap gap-1.5">
            {resume.injectedKeywords.slice(0, 24).map((kw) => (
              <span
                key={kw}
                className="rounded-sm border border-dashed border-[var(--border)] bg-white/50 px-2 py-0.5 font-mono text-[10px] text-[var(--foreground)]/75"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
