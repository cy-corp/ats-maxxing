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
  const meta = getLarpingMeta(level);
  const shared = meta.truthful
    ? `TRUTH OVERRIDES EVERY COVERAGE OR LENGTH TARGET BELOW.
Do not hit a keyword percentage by adding facts. A shorter, true resume is the correct output.
Use the job's spelling only for terms this level allows you to include.
injectedKeywords lists only job terms you actually placed.`
    : `Use the job's spelling for terms this level allows.
injectedKeywords lists the job terms you actually placed.
Levels 4–5 may stretch or fabricate as the contract states. Levels 1–2 never do.`;

  return `LARPING LEVEL ${level} — ${meta.label}
${meta.contract}

${shared}`;
}

function densityInstruction(
  density: ResumeDensity,
  level: LarpingLevel,
): string {
  if (density === "condensed") {
    return `DENSITY MODE: CONDENSED (target 1 full US Letter page, hard max 2 pages)

PRIMARY GOAL: Produce a dense, high-signal resume that fills ~1 full page when rendered with standard ATS formatting (11pt Arial/Calibri, 0.5–0.7" margins, single column). Do NOT produce sparse content.

Hard length budgets (strict — treat as soft targets that must be approached):
- Summary: 3–5 sentences, 420–680 characters. Must include the exact target job title from the JD as a target profile (not as a job the candidate held). ${level <= 3 ? "Quantified claims only when the source already states the number." : "Include 2–3 quantified claims; level 4–5 may stretch numbers."}
- Professional Experience: ${level <= 3 ? "every real role from the source and no others (do not invent a role to fill space)." : "3–6 roles (prefer 4–5)."} Most recent / most relevant role: 4–6 bullets. Older relevant roles: 3–5 bullets. Drop only clearly irrelevant early-career roles.
- Bullet length: 110–160 characters each (roughly 18–28 words). Start with a strong action verb. Include a number only when the source already states it${level >= 4 ? ", or when this larping level explicitly allows a stretched metric" : ""}.
- Technical Skills: ${level <= 3 ? "only source-supported tools (do not pad to a count)" : "12–22 items"} when the section is enabled (see SECTION TOGGLES).
- Projects: ${level <= 3 ? "only distinct projects already in the source. Do not copy job bullets into projects[]." : "0–3 when the section is enabled and space allows."}
- Certifications: MANDATORY — copy EVERY certification / language exam / license from the source (including Cambridge B2, TOEFL, etc. even if nested under Education). NEVER drop certs to save space. Never invent.
- Contact: ALWAYS preserve name, email, phone, location, LinkedIn, GitHub, and portfolio exactly as in source (or leave blank only if truly absent). GitHub is contact.github.

Priority order when space is tight (certs are NEVER optional):
1. Contact + exact target title in summary
2. ALL certifications from source
3. Most recent roles, with numbers only when the source already states them${level >= 4 ? " or this level allows stretch" : ""}
4. Hard skills the larping contract allows — in skills[] if enabled, else weave into bullets
5. Remaining roles / projects (only if projects enabled)

${level <= 3 ? "NEVER add an experience role the source does not contain. If the source has two jobs, output two jobs." : "Never produce fewer than 3 experience roles unless the source has fewer."} Prefer substance over artificial brevity. 1.0–1.4 pages is ideal; 1.5–2 is acceptable if source is rich.`;
  }

  return `DENSITY MODE: EXTENDED (target 2 pages, up to 3 OK)

PRIMARY GOAL: ${level <= 3 ? "Completeness of what the source actually supports. Do not add keywords the larping contract forbids." : "Completeness + maximum keyword coverage + depth."} Do not force artificial length, but do not drop relevant content.

Hard length budgets:
- Summary: 4–6 sentences, 550–900 characters. Exact target job title as a target profile (not a job they held). ${level <= 3 ? "Quantified claims only from numbers in the source." : "Include 3–4 quantified claims; stretched numbers only if this level allows them."}
- Professional Experience: ${level <= 3 ? "all relevant source roles and no invented ones." : "all relevant roles (typically 4–7)."} Most recent: 5–7 bullets. Mid roles: 4–6. Older: 3–5.
- Bullet length: 120–180 characters. ${level >= 4 ? "Prefer quantified impact, including stretched metrics this level allows." : "Reuse numbers from the source only. Do not invent metrics to fill length."}
- Technical Skills: ${level <= 3 ? "only source-supported tools (do not pad to a count)" : "15–30 items"} when the section is enabled (see SECTION TOGGLES).
- Projects: include all relevant ones from source (up to 5) when the section is enabled.
- Certifications: MANDATORY full list from source (every cert / language exam / license) — never drop. Never invent.
- Contact: always preserve source PII, including GitHub in contact.github.

${level <= 3 ? "Use the extra space for real bullets already supported by the source. Do not invent roles, metrics, or tools to fill the page." : "Use the extra space for deeper quantification, more keyword density in bullets, and secondary but relevant roles/projects (when enabled)."}`;
}

function sectionsInstruction(input: GenerateRequest): string {
  const skills = input.includeTechnicalSkills !== false;
  const projects = input.includeProjects !== false;
  return `SECTION TOGGLES (user choice — obey strictly):
- Technical Skills section: ${skills ? "INCLUDE — see the larping contract for which skills are allowed" : "OMIT — set skills[] to []. Place allowed job terms inside experience bullets only."}
- Projects section: ${projects ? "INCLUDE — fill projects[] from source when relevant" : "OMIT — set projects[] to []. Do not invent projects."}
- Certifications: ALWAYS INCLUDE every source cert (not toggleable).`;
}

export function buildSystemPrompt(
  density: ResumeDensity = "condensed",
  sections?: Pick<GenerateRequest, "includeTechnicalSkills" | "includeProjects">,
  larpingLevel: LarpingLevel = 2,
): string {
  const sectionBlock = sectionsInstruction({
    resumeText: "",
    jobText: "",
    language: "en",
    larpingLevel,
    density,
    includeTechnicalSkills: sections?.includeTechnicalSkills,
    includeProjects: sections?.includeProjects,
  });
  const truthful = getLarpingMeta(larpingLevel).truthful;

  return `You are ATS Maxxing, an elite resume optimization engine.

Rewrite the candidate resume to maximize ATS match for ONE job posting, per Larping Level, language, and length mode.

ALWAYS (ATS hard rules):
- Section titles must be exactly: "Professional Experience", "Technical Skills", "Education", "Projects", "Certifications" (language-aware: use Portuguese equivalents if language=pt). Never use bare "Experience". Omit Technical Skills / Projects headings entirely when those sections are toggled OFF.
- Contact block: never invent or drop phone, location, LinkedIn, GitHub, or portfolio. Copy each into its own field (contact.github is the GitHub profile; "" only if the source has none). Never put a skills list in phone or location.
- Certifications: ALWAYS copy every certification / language exam from the source. Never drop any (including Cambridge B2). If a cert has no year/date, omit parentheses entirely — never output empty "()".
- YEARS OF EXPERIENCE: Never reduce true tenure to match a lower JD minimum. Prefer an explicit user years override when present; otherwise compute from earliest job start → today as whole "N+ years". Never invent a lower figure (e.g. "1.5+") when dates support "2+".
- Summary must open with or clearly contain the exact target job title from the JD (e.g. "Software Engineer (Java) with 3+ years...").
- ${truthful ? "Numbers in bullets and the summary must already appear in the source. Never invent a metric to satisfy a bullet formula." : "At this larping level, metrics may be stretched as the level contract allows. Still prefer fewer strong numbers over adjective stuffing."}
- Keep formatting ATS-safe: no tables, no columns, no icons — plain structured fields only.
- Output pure JSON matching the schema. All fields required; use "" or [] when empty. Never return a root array.

HARD RULES — ATS PARSERS (Jobscan-style):
1) CONTACT — NEVER DROP SOURCE PII:
   - Copy email, phone, location/address, LinkedIn, GitHub, and portfolio from the source when present. GitHub goes in contact.github, not in portfolio, when both exist.
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

5) HARD SKILLS (obey the LARPING CONTRACT — it outranks coverage targets):
   - Read the job's tools and keywords, then place one ONLY if this larping level allows it.
   - Levels 1–3: a keyword is allowed only when the source names it or a true equivalent. Do not pad skills[] to look complete.
   - Levels 4–5: follow that level's stretch/fabrication contract.
   - If Technical Skills is OFF: skills[] = []; place allowed terms in bullets instead.
   - injectedKeywords = the job terms you deliberately placed and were allowed to place.

6) DATES: ATS-friendly formats (e.g. "Jan 2021 – Present", "2019 – 2022"). For education.year or cert dates: use "" when unknown — never invent empty parentheses in display strings.

7) LAYOUT: single-column only.

${sectionBlock}

${densityInstruction(density, larpingLevel)}

ANALYSIS (silent):
1. Extract JD title + hard skills + responsibilities.
2. Map candidate background → what the source actually supports.
3. Rewrite per the larping contract. On levels 1–3, unsupported keywords stay out.
4. Score match 0–100 from the resume you actually wrote (do not inflate it by adding fake skills).
5. List injectedKeywords.

SCORING:
- keywords: critical JD terms present naturally and allowed by the level
- skills: overlap between the job and source-supported skills (levels 4–5 may include stretched skills)
- experience: role/scope alignment without invented employers
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

${densityInstruction(input.density, input.larpingLevel)}

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
4. Did I follow the level contract — on levels 1–3, is every employer, date, metric, and technology supported by the source?
5. Did I avoid new numbers on levels 1–3, and avoid putting skills into the phone or location fields?
6. Is the content dense enough to fill ~1 page (condensed) or 2 pages (extended)?
7. injectedKeywords lists the exact terms I placed.`;
}
