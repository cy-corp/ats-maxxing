"use client";

import type { OptimizedResume } from "@/lib/types";
import { resumeToPlainText } from "@/lib/export/format";
import { cn } from "@/lib/utils";

export function ResumePreview({
  resume,
  className,
}: {
  resume: OptimizedResume;
  className?: string;
}) {
  const text = resumeToPlainText(resume);

  return (
    <div
      className={cn(
        "ascii-frame relative flex min-h-[280px] flex-1 flex-col overflow-hidden rounded-sm border border-dashed border-[var(--border-strong)] bg-white/75",
        className,
      )}
    >
      <span className="ascii-corner-bl" aria-hidden>
        +
      </span>
      <span className="ascii-corner-br" aria-hidden>
        +
      </span>
      <div className="flex shrink-0 items-center justify-between border-b border-dashed border-[var(--border)] px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
          ATS preview
        </span>
        <span className="font-mono text-[10px] text-[var(--muted)]/70">
          {resume.density === "extended"
            ? "extended · multi-page OK"
            : "condensed · ~1.0–1.4 pg · max 2"}
        </span>
      </div>
      <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-[12px] leading-relaxed text-[var(--foreground)]/85">
        {text}
      </pre>
    </div>
  );
}
