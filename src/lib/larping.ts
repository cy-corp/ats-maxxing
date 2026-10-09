import type { LarpingLevel } from "./types";

export interface LarpingLevelMeta {
  level: LarpingLevel;
  label: string;
  short: string;
  description: string;
  /** Full generation contract. The prompt builder inlines this verbatim. */
  contract: string;
  /** Levels 1–2 may not add facts that are not in the source resume. */
  truthful: boolean;
  /** Show the on-screen fabrication warning. */
  invents: boolean;
}

export const LARPING_LEVELS: LarpingLevelMeta[] = [
  {
    level: 1,
    label: "Minimal",
    short: "Reorg only",
    description:
      "Restructure into ATS sections and lightly fix grammar. Keep employers, dates, metrics, and technologies as they appear in the source. Do not chase job keywords.",
    contract: `LEVEL 1 CONTRACT — Minimal (strictly truthful):
- Reorganize into the required ATS sections and lightly fix grammar. Stay close to the source wording.
- Do not chase keyword coverage and do not reframe bullets into new claims.
- NEVER add or invent an employer, role, job title, date, degree, school, certification, project, metric, or technology.
- Skills and bullets may name only tools, languages, and methods already written in the source.
- If the source has no number, leave the bullet unquantified. Never invent team size, users, volume, or a percentage.`,
    truthful: true,
    invents: false,
  },
  {
    level: 2,
    label: "Light Polish",
    short: "JD wording, real facts",
    description:
      "Default for real applications. Rephrase and reorder into the job's language. Add a keyword only when the resume already supports it (synonyms OK). Never invent employers, dates, metrics, or technologies.",
    contract: `LEVEL 2 CONTRACT — Light Polish (default; strictly truthful; use this for real applications):
- Reorganize, rephrase, and reorder so real experience that matches the job comes first, using the job posting's vocabulary.
- Surface a job keyword ONLY when the source supports it: the same term, or a true synonym/equivalent (example: RabbitMQ supports "message queues" or "message queuing").
- NEVER invent an employer, role, job title, date, degree, school, certification, project, metric/number, or technology.
- NEVER add a job, research post, or project that is not in the source. Two employers in the source means two experience entries.
- Metrics may only be reused or rephrased from numbers already in the source. "Improved reliability" must not become a percentage. Do not invent team size, user counts, downtime, or transaction volume.
- Do not add a tool or language the source never names. A generic practice does not justify a specific product, and a backend role does not justify Python, Camunda, or BPMN unless the source states them.
- skills[] lists source-supported technologies only, with job-aligned ones first. Do not pad the list. injectedKeywords lists only terms you placed that the source supports.`,
    truthful: true,
    invents: false,
  },
  {
    level: 3,
    label: "Aggressive",
    short: "Bold framing, no new facts",
    description:
      "Rewrite bullets to lead with the job's themes. Employers, dates, tools, and metrics still have to be real — the wording can be bold, the facts cannot be new.",
    contract: `LEVEL 3 CONTRACT — Aggressive framing (no new facts):
- Rewrite bullets so they lead with the job's themes and vocabulary.
- Every employer, title, date, degree, certification, project, metric, and technology must still come from the source. Synonyms of source technologies are allowed; new tools and new numbers are not.
- You may emphasize real work more boldly. You may not add roles, research posts, or projects.
- This level does not invent. It only changes emphasis.`,
    truthful: true,
    invents: false,
  },
  {
    level: 4,
    label: "Heavy",
    short: "Stretch tools and metrics",
    description:
      "May add closely related tools and modest metrics that are not in the resume. Does not invent employers, degrees, or certifications.",
    contract: `LEVEL 4 CONTRACT — Heavy stretch (the product warns before use):
- May add closely related tools and modest, defensible metrics that the source does not state.
- Must NOT invent employers, job titles, dates, degrees, schools, or certifications.
- Must NOT add a whole new employer or a fictional project that replaces real history.
- Label stretched facts only by writing them as ordinary resume lines — the UI already warns the user that this level stretches.`,
    truthful: false,
    invents: true,
  },
  {
    level: 5,
    label: "Larpmaxxing",
    short: "Near-100% fit, fabricates",
    description:
      "Pushes near-total keyword coverage and may invent tools, metrics, and plausible experience. Not for applications you have to defend line by line.",
    contract: `LEVEL 5 CONTRACT — Larpmaxxing (fabricates; the product warns before use):
- Push toward near-100% coverage of the job's hard skills, using the job's spelling.
- May invent tools, metrics, and plausible experience bullets for the claimed seniority.
- Still copy real contact links (including GitHub) and real certifications from the source. Do not drop them to make room.
- Not appropriate for an application the candidate must defend line by line.`,
    truthful: false,
    invents: true,
  },
];

export function getLarpingMeta(level: LarpingLevel): LarpingLevelMeta {
  return LARPING_LEVELS.find((l) => l.level === level) ?? LARPING_LEVELS[1];
}

export const LARPING_WARNING =
  "This level may invent tools, metrics, or experience that are not in the source resume. Do not use it for an application you must defend line by line.";
