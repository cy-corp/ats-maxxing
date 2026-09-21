"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { HeroBreeze } from "@/components/effects/hero-breeze";
import { Button } from "@/components/ui/button";

function scrollToWorkspace() {
  document
    .getElementById("workspace")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative w-full overflow-hidden bg-[#9bbfe0]">
      {/*
        Full-bleed width, native 16:9 — no object-cover “zoom”, no stretch.
        unoptimized: baked-in type stays sharp (Next re-encode softens it).
      */}
      <Image
        src="/hero.jpg"
        alt="ATS Maxxing — Greco-Roman ruins above a sea of clouds"
        width={2816}
        height={1584}
        priority
        unoptimized
        className="relative z-0 h-auto w-full"
      />

      <HeroBreeze />

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 bg-gradient-to-t from-[var(--background)] from-15% via-[var(--background)]/75 to-transparent px-5 pb-10 pt-24">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
        >
          <Button
            size="lg"
            onClick={scrollToWorkspace}
            className="font-mono tracking-wide shadow-[0_10px_36px_rgba(106,159,196,0.35)]"
          >
            Enter workspace
            <ArrowDown className="size-4" />
          </Button>
        </motion.div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--foreground)]/50">
          upload · job · larp · export
        </p>
      </div>
    </section>
  );
}
