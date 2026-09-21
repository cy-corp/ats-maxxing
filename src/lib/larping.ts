import type { LarpingLevel } from "./types";

export interface LarpingLevelMeta {
  level: LarpingLevel;
  label: string;
  short: string;
  description: string;
  invents: boolean;
}

export const LARPING_LEVELS: LarpingLevelMeta[] = [
  {
    level: 1,
    label: "Minimal",
    short: "Reorg + 40–50% skills",
    description:
      "Only reorganize/rephrase. Never invent. ~40–50% JD hard-skill coverage.",
    invents: false,
  },
  {
    level: 2,
    label: "Light Polish",
    short: "~80% skills + light metrics",
    description:
      "Reword + light quantification if implied. ~80% hard-skill coverage, exact JD spelling.",
    invents: false,
  },
  {
    level: 3,
    label: "Aggressive",
    short: "≥80–90% skills",
    description:
      "Heavy rewrite toward JD. Stretch language/metrics moderately when directional. ≥80–90% skills.",
    invents: false,
  },
  {
    level: 4,
    label: "Heavy",
    short: "~90%+ + stretch",
    description:
      "Stretch tools/metrics when source is silent. ~90%+ hard-skill coverage.",
    invents: true,
  },
  {
    level: 5,
    label: "Larpmaxxing",
    short: "Near 100% fit",
    description:
      "Near-100% keyword match. May invent defensible experience, tools, and metrics.",
    invents: true,
  },
];

export function getLarpingMeta(level: LarpingLevel): LarpingLevelMeta {
  return LARPING_LEVELS.find((l) => l.level === level) ?? LARPING_LEVELS[0];
}

export const LARPING_WARNING =
  "This level may invent or heavily exaggerate experiences. Use at your own risk.";
