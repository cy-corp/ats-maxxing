"use client";

import { NoiseOverlay, SoftVignette } from "@/components/effects/atmosphere";
import { Hero } from "@/components/landing/hero";
import { Workspace } from "@/components/workspace/workspace";

export function AppShell() {
  return (
    <div className="relative bg-[var(--background)] text-[var(--foreground)]">
      <NoiseOverlay />
      <SoftVignette />
      <Hero />
      {/* Soft handoff: hero bleeds into workspace without a hard cut */}
      <div
        aria-hidden
        className="pointer-events-none relative z-10 -mt-28 h-28 bg-gradient-to-b from-transparent via-[var(--background)]/70 to-[var(--background)]"
      />
      <Workspace />
    </div>
  );
}
