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

export interface SourcePreserveHints {
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
  certifications: string[];
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
  if (certBlock) {
    for (const raw of certBlock.split(/\n+/)) {
      const line = raw
        .replace(/^[-•*]\s*/, "")
        .replace(/^\d+[.)]\s*/, "")
        .trim();
      if (line.length < 3 || line.length > 160) continue;
      if (/^(certifications?|certificados?)\b/i.test(line)) continue;
      certifications.push(line);
      if (certifications.length >= 12) break;
    }
  }

  return {
    email,
    phone,
    location,
    linkedin,
    portfolio,
    certifications,
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

export function mergePreservedSourceFields<
  T extends {
    contact: {
      name: string;
      email: string;
      phone: string;
      location: string;
      linkedin: string;
      portfolio: string;
    };
    certifications: string[];
  },
>(resume: T, sourceText: string): T {
  const hints = extractPreserveHints(sourceText);
  const rawCerts =
    resume.certifications.filter((c) => c.trim().length > 0).length > 0
      ? resume.certifications
      : hints.certifications;

  const certifications = rawCerts
    .map((c) => cleanEmptyDecorators(c))
    .filter((c) => c.length > 0);

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
  };
}
