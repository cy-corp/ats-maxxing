import { getLarpingMeta } from "./larping";
import type {
  GenerateRequest,
  LarpingLevel,
  OutputLanguage,
  ResumeDensity,
} from "./types";

function languageInstruction(language: OutputLanguage): string {
  if (language === "pt") {
    return `Write the ENTIRE resume body in Brazilian Portuguese (pt-BR).
ATS section headings (exact strings):
- Resumo Profissional
- Experiência Profissional
- Formação
- Competências Técnicas
- Projetos
- Certificações
Keep company names, product names, and tool names (Java, Kotlin, etc.) spelled exactly as in the job posting.`;
  }
  return `Write the ENTIRE resume in clear, professional American English.
ATS section headings (exact strings — required for parsers):
- Professional Summary
- Professional Experience
- Education
- Technical Skills
- Projects
- Certifications
Never name the work section just "Experience".`;
}

function larpingBlock(level: LarpingLevel): string {
  const table: Record<
    LarpingLevel,
    { name: string; target: string; invent: string }
  > = {
    1: {
      name: "Minimal",
      target: "40–50% hard-skill coverage",
      invent:
        "Never invent skills, tools, metrics, or titles. Only rephrase and reorder what exists.",
    },
    2: {
      name: "Light Polish",
      target: "~80% hard-skill coverage with exact JD spelling",
      invent:
        "Never invent. You may reword bullets and add light quantification only if the source implies it (e.g. 'managed team' → 'managed team of 5–8').",
    },
    3: {
      name: "Aggressive",
      target: "≥80–90% hard-skill coverage, exact JD spelling preferred",
      invent:
        "Never invent tools or skills you cannot reasonably infer. Stretch language and metrics moderately when source supports directionally.",
    },
    4: {
      name: "Heavy",
      target: "~90%+",
      invent:
        "Allowed to stretch: add plausible tools/frameworks that are common for the claimed experience level, and invent modest but defensible metrics when source is silent.",
    },
    5: {
      name: "Larpmaxxing",
      target: "near 100%",
      invent:
        "Aggressively match every major JD keyword. Invent plausible experience, tools, and strong metrics as long as they remain interview-defensible for the claimed seniority.",
    },
  };

  const meta = table[level] ?? table[2];
  const label = getLarpingMeta(level).label;

  return `LARPING LEVEL ${level} — ${meta.name} (${label})
Hard-skill coverage target: ${meta.target}
Invention policy: ${meta.invent}

MANDATORY for all levels:
- Extract every hard skill / tool / technology / methodology named in the JD.
- In the skills section and in experience bullets, use the EXACT spelling and casing from the JD whenever possible.
- For every experience bullet, prefer the formula: Action Verb + Scope/Tool + Quantified Result.
- If the source has no number, at level ≤3 leave it unquantified or use a soft scale ("multiple", "large-scale"). At level ≥4 you may invent a plausible number.
- injectedKeywords must list the exact JD terms you successfully placed (for scoring transparency).`;
}

function densityInstruction(density: ResumeDensity): string {
  if (density === "condensed") {
    return `DENSITY MODE: CONDENSED (target 1 full US Letter page, hard max 2 pages)

PRIMARY GOAL: Produce a dense, high-signal resume that fills ~1 full page when rendered with standard ATS formatting (11pt Arial/Calibri, 0.5–0.7" margins, single column). Do NOT produce sparse content.

Hard length budgets (strict — treat as soft targets that must be approached):
- Summary: 3–5 sentences, 420–680 characters. Must include exact target job title from JD + 2–3 quantified high-impact claims.
- Professional Experience: 3–6 roles (prefer 4–5). Most recent / most relevant role: 4–6 bullets. Older relevant roles: 3–5 bullets. Drop only clearly irrelevant early-career roles.
- Bullet length: 110–160 characters each (roughly 18–28 words). Every bullet must start with a strong action verb and include at least one number, %, $, time frame, scale, or ranking when the source supports it (or when larpingLevel ≥ 4 allows stretch).
- Technical Skills: 12–22 items when the section is enabled (see SECTION TOGGLES).
- Projects: 0–3 when the section is enabled and space allows.
- Certifications: MANDATORY — copy EVERY certification / language exam / license from the source (including Cambridge B2, TOEFL, etc. even if nested under Education). NEVER drop certs to save space. Never invent.
- Contact: ALWAYS preserve name, email, phone, location, LinkedIn, portfolio exactly as in source (or leave blank only if truly absent).

Priority order when space is tight (certs are NEVER optional):
1. Contact + exact target title in summary
2. ALL certifications from source
3. Most recent 2–3 roles with quantified bullets
4. Hard skills that match JD (exact spelling) — in skills[] if enabled, else weave into bullets
5. Remaining roles / projects (only if projects enabled)

Never produce fewer than 3 experience roles unless the source has fewer. Prefer substance and metrics over artificial brevity. 1.0–1.4 pages is ideal; 1.5–2 is acceptable if source is rich.`;
  }

  return `DENSITY MODE: EXTENDED (target 2 pages, up to 3 OK)

PRIMARY GOAL: Completeness + maximum keyword coverage + depth. Do not force artificial length, but do not drop relevant content.

Hard length budgets:
- Summary: 4–6 sentences, 550–900 characters. Exact target job title + 3–4 quantified claims + domain expertise.
- Professional Experience: all relevant roles (typically 4–7). Most recent: 5–7 bullets. Mid roles: 4–6. Older: 3–5.
- Bullet length: 120–180 characters. Prefer quantified impact.
- Technical Skills: 15–30 items when the section is enabled (see SECTION TOGGLES).
- Projects: include all relevant ones from source (up to 5) when the section is enabled.
- Certifications: MANDATORY full list from source (every cert / language exam / license) — never drop. Never invent.
- Contact: always preserve source PII.

Use the extra space for deeper quantification, more keyword density in bullets, and secondary but relevant roles/projects (when enabled).`;
}

function sectionsInstruction(input: GenerateRequest): string {
  const skills = input.includeTechnicalSkills !== false;
  const projects = input.includeProjects !== false;
  return `SECTION TOGGLES (user choice — obey strictly):
- Technical Skills section: ${skills ? "INCLUDE — fill skills[] with JD-aligned hard skills" : "OMIT — set skills[] to []. Still place JD hard skills inside experience bullets for ATS match."}
- Projects section: ${projects ? "INCLUDE — fill projects[] from source when relevant" : "OMIT — set projects[] to []. Do not invent projects."}
- Certifications: ALWAYS INCLUDE every source cert (not toggleable).`;
}

export function buildSystemPrompt(
  density: ResumeDensity = "condensed",
  sections?: Pick<GenerateRequest, "includeTechnicalSkills" | "includeProjects">,
): string {
  const sectionBlock = sectionsInstruction({
    resumeText: "",
    jobText: "",
    language: "en",
    larpingLevel: 2,
    density,
    includeTechnicalSkills: sections?.includeTechnicalSkills,
    includeProjects: sections?.includeProjects,
  });

  return `You are ATS Maxxing, an elite resume optimization engine.

Rewrite the candidate resume to maximize ATS match for ONE job posting, per Larping Level, language, and length mode.

ALWAYS (ATS hard rules):
- Section titles must be exactly: "Professional Experience", "Technical Skills", "Education", "Projects", "Certifications" (language-aware: use Portuguese equivalents if language=pt). Never use bare "Experience". Omit Technical Skills / Projects headings entirely when those sections are toggled OFF.
- Contact block: never invent or drop phone, location, LinkedIn, portfolio. Copy from source or leave empty string "" only if truly absent.
- Certifications: ALWAYS copy every certification / language exam from the source. Never drop any (including Cambridge B2). If a cert has no year/date, omit parentheses entirely — never output empty "()".
- YEARS OF EXPERIENCE: Never reduce true tenure to match a lower JD minimum. Prefer an explicit user years override when present; otherwise compute from earliest job start → today as whole "N+ years". Never invent a lower figure (e.g. "1.5+") when dates support "2+".
- Summary must open with or clearly contain the exact target job title from the JD (e.g. "Software Engineer (Java) with 3+ years...").
- Every experience bullet should contain at least one quantifiable element when possible (numbers, %, $, time saved, team size, volume, ranking). Prefer this over pure duty statements.
- Prefer 1–2 strong metrics per bullet rather than vague adjectives.
- Keep formatting ATS-safe: no tables, no columns, no icons — plain structured fields only.
- Output pure JSON matching the schema. All fields required; use "" or [] when empty. Never return a root array.

HARD RULES — ATS PARSERS (Jobscan-style):
1) CONTACT — NEVER DROP SOURCE PII:
   - Copy email, phone, location/address, LinkedIn, and portfolio EXACTLY from the source when present.
   - location = City, Region/State, Country (or as complete as the source allows).

2) CERTIFICATIONS (NON-NEGOTIABLE — never skip):
   - Copy EVERY certification, language exam, and license from the source into certifications[].
   - Includes items under Education-looking blocks (e.g. "Cambridge Assessment English / B2 First – Score 175").
   - Format cleanly: "Name – Detail — Issuer" or "Name — Issuer". NEVER append empty "()" / "[]".
   - NEVER drop certs to shorten condensed resumes. Trim bullets/projects for space, never certs.
   - Projects: only when SECTION TOGGLES say include; otherwise projects[] = [].

3) YEARS OF EXPERIENCE (do not understate):
   - If the user provides an explicit years override, that number is the FLOOR — use it (or higher if source dates prove more). Write as "N+" (e.g. 3 → "3+ years").
   - Otherwise COMPUTE tenure: earliest Professional Experience start date → TODAY (date given in the user prompt). Convert months to years; round DOWN to whole years for the floor, then phrase as "N+" (e.g. 26 months → "2+ years"). Do NOT invent a lower figure like 1.5 when dates support 2+.
   - Prefer whole years ("2+", "3+") over decimals ("1.5+") unless the candidate already wrote a decimal.
   - NEVER lower that number just because the JD asks for fewer years (e.g. JD "2+" while truth is "3+" → keep "3+").
   - You may modestly round up when larping allows; never round down below computed/override truth.

4) EXACT JOB TITLE:
   - Extract the target job title from the JD.
   - Put that EXACT title string in the Professional Summary (first sentence), even if the candidate never held it verbatim — frame as target/fit.

5) HARD SKILLS MATCH (critical):
   - Extract hard skills from the JD: languages, frameworks, tools, platforms, domains.
   - Hit the larping-level coverage target with EXACT JD spelling.
   - If Technical Skills section is ON: skills[] must lead with JD hard skills; also appear in bullets where natural.
   - If Technical Skills section is OFF: skills[] = []; still place JD hard skills in experience bullets.
   - Soft skills alone do not count toward hard-skill coverage.
   - injectedKeywords = the JD hard skills you deliberately placed.

6) DATES: ATS-friendly formats (e.g. "Jan 2021 – Present", "2019 – 2022"). For education.year or cert dates: use "" when unknown — never invent empty parentheses in display strings.

7) LAYOUT: single-column only.

${sectionBlock}

${densityInstruction(density)}

ANALYSIS (silent):
1. Extract JD title + hard skills + responsibilities.
2. Map candidate background → coverage gaps.
3. Rewrite per Larping Level (hit the hard-skill % target + quantification rules).
4. Score match 0–100 (skills score should reflect hard-skill coverage %).
5. List injectedKeywords (exact JD terms placed).

SCORING:
- keywords: critical JD terms present naturally
- skills: % of JD hard skills covered (levels 2–3 aim ~80+)
- experience: role/scope alignment
- seniority: level/ownership fit

Schema fields:
- Unknown optionals → ""
- No projects/certs → []
- Do NOT output plainText or markdown

OUTPUT SHAPE:
- ONE JSON object matching the schema. Never an array at the root.`;
}

function yearsInstruction(input: GenerateRequest): string {
  const today = new Date().toISOString().slice(0, 10);
  const override = input.yearsOfExperience;
  if (typeof override === "number" && Number.isFinite(override) && override > 0) {
    const n = Math.max(1, Math.round(override));
    return `YEARS OVERRIDE (authoritative floor): use at least "${n}+ years" in the Professional Summary. Today is ${today}. If source dates imply more than ${n} years, use the higher figure. Never write less than ${n}+.`;
  }
  return `YEARS OF EXPERIENCE: Today is ${today}. Compute from the earliest Professional Experience start date in the source through today (months÷12). Phrase as whole "N+ years" (round down to whole years for the floor). Example: start Jul 2024 → Sep 2026 ≈ 26 months → "2+ years", NOT "1.5+".`;
}

export function buildUserPrompt(input: GenerateRequest): string {
  return `${languageInstruction(input.language)}

${larpingBlock(input.larpingLevel)}

${densityInstruction(input.density)}

${sectionsInstruction(input)}

${yearsInstruction(input)}

=== CANDIDATE RESUME (SOURCE) ===
${input.resumeText.trim().slice(0, 20000)}

=== TARGET JOB POSTING ===
${input.jobText.trim().slice(0, 8000)}

Produce ONE OptimizedResume JSON object now.

FINAL CHECKLIST BEFORE OUTPUT:
1. Did I keep phone + location + ALL certs from source including language exams like Cambridge B2 (no empty "()")?
2. Does the summary contain the exact JD job title AND at least the true years (override floor or date-computed — never lower)?
3. Did I obey SECTION TOGGLES for Technical Skills and Projects?
4. Are ≥80% (or the larping target) of JD hard skills present with exact spelling (in skills[] and/or bullets)?
5. Does every recent bullet contain a number / % / scale when the level allows?
6. Is the content dense enough to fill ~1 page (condensed) or 2 pages (extended)?
7. injectedKeywords lists the exact terms I placed.`;
}
