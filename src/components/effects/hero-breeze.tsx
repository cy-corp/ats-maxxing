"use client";

import { useInView } from "framer-motion";
import { useRef, type CSSProperties } from "react";

const WISPS = [
  { top: "12%", width: "42%", dur: "16s", delay: "0s", peak: "0.28", blur: false },
  { top: "22%", width: "58%", dur: "22s", delay: "-4s", peak: "0.22", blur: true },
  { top: "31%", width: "36%", dur: "13s", delay: "-9s", peak: "0.32", blur: false },
  { top: "44%", width: "70%", dur: "26s", delay: "-2s", peak: "0.18", blur: true },
  { top: "55%", width: "48%", dur: "18s", delay: "-11s", peak: "0.26", blur: false },
  { top: "63%", width: "55%", dur: "21s", delay: "-6s", peak: "0.2", blur: true },
  { top: "72%", width: "40%", dur: "15s", delay: "-14s", peak: "0.3", blur: false },
  { top: "18%", width: "28%", dur: "11s", delay: "-7s", peak: "0.24", blur: false },
] as const;

const MOTES = [
  { top: "16%", left: "8%", dur: "19s", delay: "0s" },
  { top: "28%", left: "22%", dur: "24s", delay: "-5s" },
  { top: "38%", left: "5%", dur: "17s", delay: "-10s" },
  { top: "48%", left: "35%", dur: "28s", delay: "-3s" },
  { top: "58%", left: "12%", dur: "21s", delay: "-12s" },
  { top: "67%", left: "28%", dur: "15s", delay: "-8s" },
  { top: "25%", left: "48%", dur: "23s", delay: "-15s" },
  { top: "52%", left: "60%", dur: "20s", delay: "-1s" },
] as const;

/** Soft wind streaks + mote particles over the hero art. */
export function HeroBreeze() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.05, margin: "80px 0px" });

  return (
    <div
      ref={ref}
      aria-hidden
      data-paused={inView ? "false" : "true"}
      className="breeze-layer pointer-events-none absolute inset-0 z-[1] overflow-hidden"
    >
      {WISPS.map((w, i) => (
        <span
          key={`wisp-${i}`}
          className="breeze-wisp"
          style={
            {
              top: w.top,
              width: w.width,
              height: w.blur ? "10px" : "2px",
              opacity: 0,
              filter: w.blur ? "blur(6px)" : undefined,
              "--breeze-dur": w.dur,
              "--breeze-delay": w.delay,
              "--breeze-peak": w.peak,
            } as CSSProperties
          }
        />
      ))}
      {MOTES.map((m, i) => (
        <span
          key={`mote-${i}`}
          className="breeze-mote"
          style={
            {
              top: m.top,
              marginLeft: m.left,
              "--breeze-dur": m.dur,
              "--breeze-delay": m.delay,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
