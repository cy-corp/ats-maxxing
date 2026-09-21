"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const FRAMES = [
  "[ ····· ]",
  "[ ◦···· ]",
  "[ ·◦··· ]",
  "[ ··◦·· ]",
  "[ ···◦· ]",
  "[ ····◦ ]",
];

export function AsciiLoader({ label = "optimizing" }: { label?: string }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % FRAMES.length), 160);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-[var(--foreground)]">
      <motion.pre
        key={i}
        initial={{ opacity: 0.45 }}
        animate={{ opacity: 1 }}
        className="select-none whitespace-pre font-mono text-sm tracking-[0.2em] text-[var(--accent)]"
      >
        {FRAMES[i]}
      </motion.pre>
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
        <span className="inline-block size-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
        {label}
      </div>
      <pre className="select-none whitespace-pre font-mono text-[10px] leading-[1.2] text-[var(--muted)]/50">
{`+-------------------+
|   cloud rewrite   |
+-------------------+`}
      </pre>
    </div>
  );
}
