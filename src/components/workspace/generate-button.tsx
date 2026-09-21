"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GenerateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function GenerateButton({
  onClick,
  disabled,
  loading,
}: GenerateButtonProps) {
  return (
    <motion.div
      whileHover={disabled || loading ? undefined : { scale: 1.01 }}
      whileTap={disabled || loading ? undefined : { scale: 0.985 }}
      className="relative"
    >
      <Button
        type="button"
        variant="glow"
        size="lg"
        className="relative w-full font-mono uppercase tracking-[0.18em]"
        disabled={disabled || loading}
        onClick={onClick}
      >
        <Sparkles className={cn(loading && "animate-spin")} />
        {loading ? "Maxxing…" : "Generate ATS Resume"}
      </Button>
    </motion.div>
  );
}
