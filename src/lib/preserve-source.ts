/**
 * Pull contact / certs from raw resume text when the model drops them.
 * Best-effort heuristics — never invent values not found in source.
 */

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE =
  /(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,3}\)?[\s.-]?)?\d{4,5}[\s.-]?\d{4}\b/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?/i;
const URL_RE = /https?:\/\/[^\s)]+/i;

const LOCATION_LINE_RE =
  /\b(?:Remote|[A-ZÁÉÍÓÚÂÊÔÃÕ][\wÁÉÍÓÚÂÊÔÃÕáéíóúâêôãõç.-]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕ][\wÁÉÍÓÚÂÊÔÃÕáéíóúâêôãõç.-]+){0,3}),\s*(?:[A-Z]{2}|[A-ZÁÉÍÓÚÂÊÔÃÕ][\wÁÉÍÓÚÂÊÔÃÕáéíóúâêôãõç.-]+)(?:\s*[,/]\s*[A-ZÁÉÍÓÚÂÊÔÃÕ][\wÁÉÍÓÚÂÊÔÃÕáéíóúâêôãõç.-]+)?\b/;

const CERT_SECTION_RE =
  /(?:^|\n)\s*(?:certifications?|certificados?|certificates?|licen[cç]as?|licenses?)\s*:?\s*\n([\s\S]*?)(?=\n\s*(?:experience|professional experience|educa|skills|technical skills|projects?|summary|resumo|experi[eê]ncia|forma[cç][aã]o|habilidades|projetos)\b|$)/i;

/** Lines that look like certs even when mis-nested under Education. */
const CERT_LINE_RE =
  /\b(?:cambridge|assessment english|b2 first|c1 advanced|c2 proficiency|toefl|ielts|duolingo english|aws certified|microsoft certified|azure|google cloud|cka|ckad|pmp|scrum master|comptia|oracle certified|cisco certified)\b/i;

export interface SourcePreserveHints {
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
  certifications: string[];
}

function normalizeCertKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pushUniqueCert(target: string[], line: string) {
  const cleaned = cleanEmptyDecorators(line);
  if (cleaned.length < 3 || cleaned.length > 180) return;
  if (/^(certifications?|certificados?|certificates?)\b/i.test(cleaned)) return;
  const key = normalizeCertKey(cleaned);
  if (!key) return;
  const duplicate = target.some((existing) => {
    const ek = normalizeCertKey(existing);
    return ek === key || ek.includes(key) || key.includes(ek);
  });
  if (duplicate) return;
  target.push(cleaned);
}

function extractCertLinesFromBlock(block: string, out: string[]) {
  for (const raw of block.split(/\n+/)) {
    const line = raw
      .replace(/^[-•*]\s*/, "")
      .replace(/^\d+[.)]\s*/, "")
      .trim();
    pushUniqueCert(out, line);
  }
}

/** Catch Cambridge / language certs that sit next to Education without a Cert header. */
function extractLooseCertLines(text: string, out: string[]) {
  const lines = text.split(/\n+/).map((l) => l.replace(/^[-•*]\s*/, "").trim());
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.length < 3) continue;
    if (!CERT_LINE_RE.test(line)) continue;

    let combined = line;
    const next = lines[i + 1];
    // "Cambridge Assessment English" + "B2 First – Score 175"
    if (
      next &&
      next.length < 120 &&
      !/^(university|bachelor|master|professional experience|education|technical skills)\b/i.test(
        next,
      ) &&
      (CERT_LINE_RE.test(next) ||
        /\b(?:b2|c1|c2|first|score|band|points?)\b/i.test(next))
    ) {
      combined = `${line} — ${next}`;
      i += 1;
    }
    pushUniqueCert(out, combined);
  }
}

export function extractPreserveHints(sourceText: string): SourcePreserveHints {
  const text = sourceText.replace(/\u00a0/g, " ");
  const email = text.match(EMAIL_RE)?.[0]?.trim();
  const phone = text.match(PHONE_RE)?.[0]?.trim();
  const linkedin = text.match(LINKEDIN_RE)?.[0]?.trim();

  let portfolio: string | undefined;
  for (const m of text.matchAll(new RegExp(URL_RE.source, "gi"))) {
    const url = m[0];
    if (/linkedin\.com/i.test(url)) continue;
    if (/github\.com|gitlab\.com|portfolio|vercel\.app|netlify|behance|dribbble/i.test(url)) {
      portfolio = url;
      break;
    }
  }

  const header = text.slice(0, 900);
  const location =
    header.match(LOCATION_LINE_RE)?.[0]?.trim() ||
    text.match(LOCATION_LINE_RE)?.[0]?.trim();

  const certifications: string[] = [];
  const certBlock = text.match(CERT_SECTION_RE)?.[1];
  if (certBlock) extractCertLinesFromBlock(certBlock, certifications);
  extractLooseCertLines(text, certifications);

  return {
    email,
    phone,
    location,
    linkedin,
    portfolio,
    certifications: certifications.slice(0, 16),
  };
}

function prefer(ai: string | undefined, hint: string | undefined): string {
  const a = (ai ?? "").trim();
  if (a) return a;
  return (hint ?? "").trim();
}

/** Strip empty () / [] and dangling separators left by missing dates. */
export function cleanEmptyDecorators(text: string): string {
  return text
    .replace(/\(\s*\)/g, "")
    .replace(/\[\s*\]/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .replace(/\s*[–—-]\s*$/g, "")
    .replace(/\s+[–—-]\s+(?=[–—-]|$)/g, " ")
    .trim();
}

/** Union AI certs with every cert found in source — never drop source certs. */
export function mergeCertifications(
  aiCerts: string[] | undefined,
  sourceHints: string[],
): string[] {
  const out: string[] = [];
  for (const c of aiCerts ?? []) pushUniqueCert(out, c);
  for (const c of sourceHints) pushUniqueCert(out, c);
  return out;
}

export function mergePreservedSourceFields<
  T extends {
    contact: {
      name: string;
      email: string;
      phone?: string;
      location?: string;
      linkedin?: string;
      portfolio?: string;
    };
    certifications?: string[];
    skills?: string[];
    projects?: { name: string; description: string; tech?: string }[];
  },
>(
  resume: T,
  sourceText: string,
  options?: { includeSkills?: boolean; includeProjects?: boolean },
): T {
  const hints = extractPreserveHints(sourceText);
  const certifications = mergeCertifications(
    resume.certifications,
    hints.certifications,
  );

  const includeSkills = options?.includeSkills !== false;
  const includeProjects = options?.includeProjects !== false;

  return {
    ...resume,
    contact: {
      ...resume.contact,
      email: prefer(resume.contact.email, hints.email),
      phone: prefer(resume.contact.phone, hints.phone),
      location: prefer(resume.contact.location, hints.location),
      linkedin: prefer(resume.contact.linkedin, hints.linkedin),
      portfolio: prefer(resume.contact.portfolio, hints.portfolio),
    },
    certifications,
    skills: includeSkills ? (resume.skills ?? []) : [],
    projects: includeProjects ? (resume.projects ?? []) : [],
  };
}
