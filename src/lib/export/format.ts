import type { OptimizedResume } from "../types";
import { cleanEmptyDecorators } from "../preserve-source";

function educationLine(degree: string, school: string, year: string): string {
  const base = `${degree} — ${school}`;
  const y = year.trim();
  return y ? `${base} (${y})` : base;
}

function projectLabel(name: string, tech?: string): string {
  const t = tech?.trim();
  return t ? `${name} (${t})` : name;
}

export function resumeToPlainText(resume: OptimizedResume): string {
  if (resume.plainText?.trim()) return resume.plainText.trim();

  const lines: string[] = [];
  const c = resume.contact;
  lines.push(c.name);
  lines.push(
    [c.email, c.phone, c.location].filter(Boolean).join(" | "),
  );
  if (c.linkedin || c.portfolio) {
    lines.push([c.linkedin, c.portfolio].filter(Boolean).join(" | "));
  }
  lines.push("");
  lines.push("PROFESSIONAL SUMMARY");
  lines.push(resume.summary);
  lines.push("");
  lines.push("PROFESSIONAL EXPERIENCE");
  for (const exp of resume.experience) {
    lines.push(`${exp.title} — ${exp.company}`);
    lines.push(
      `${exp.startDate} – ${exp.endDate}${exp.location ? ` | ${exp.location}` : ""}`,
    );
    for (const b of exp.bullets) lines.push(`• ${b}`);
    lines.push("");
  }
  lines.push("EDUCATION");
  for (const edu of resume.education) {
    lines.push(educationLine(edu.degree, edu.school, edu.year));
    if (edu.details) lines.push(edu.details);
  }
  lines.push("");
  lines.push("TECHNICAL SKILLS");
  lines.push(resume.skills.join(", "));
  if (resume.projects?.length) {
    lines.push("");
    lines.push("PROJECTS");
    for (const p of resume.projects) {
      lines.push(projectLabel(p.name, p.tech));
      lines.push(p.description);
    }
  }
  if (resume.certifications?.length) {
    lines.push("");
    lines.push("CERTIFICATIONS");
    for (const cert of resume.certifications) {
      const cleaned = cleanEmptyDecorators(cert);
      if (cleaned) lines.push(`• ${cleaned}`);
    }
  }
  return lines.join("\n").trim();
}

export function resumeToMarkdown(resume: OptimizedResume): string {
  if (resume.markdown?.trim()) return resume.markdown.trim();

  const lines: string[] = [];
  const c = resume.contact;
  lines.push(`# ${c.name}`);
  lines.push("");
  lines.push(
    [c.email, c.phone, c.location, c.linkedin, c.portfolio]
      .filter(Boolean)
      .join(" · "),
  );
  lines.push("");
  lines.push("## Professional Summary");
  lines.push("");
  lines.push(resume.summary);
  lines.push("");
  lines.push("## Professional Experience");
  for (const exp of resume.experience) {
    lines.push("");
    lines.push(`### ${exp.title} — ${exp.company}`);
    lines.push(
      `*${exp.startDate} – ${exp.endDate}${exp.location ? ` | ${exp.location}` : ""}*`,
    );
    lines.push("");
    for (const b of exp.bullets) lines.push(`- ${b}`);
  }
  lines.push("");
  lines.push("## Education");
  for (const edu of resume.education) {
    const year = edu.year.trim();
    lines.push(
      year
        ? `- **${edu.degree}** — ${edu.school} (${year})`
        : `- **${edu.degree}** — ${edu.school}`,
    );
    if (edu.details) lines.push(`  - ${edu.details}`);
  }
  lines.push("");
  lines.push("## Technical Skills");
  lines.push("");
  lines.push(resume.skills.join(", "));
  if (resume.projects?.length) {
    lines.push("");
    lines.push("## Projects");
    for (const p of resume.projects) {
      const tech = p.tech?.trim();
      lines.push(
        tech
          ? `- **${p.name}** — ${tech}: ${p.description}`
          : `- **${p.name}**: ${p.description}`,
      );
    }
  }
  if (resume.certifications?.length) {
    lines.push("");
    lines.push("## Certifications");
    for (const cert of resume.certifications) {
      const cleaned = cleanEmptyDecorators(cert);
      if (cleaned) lines.push(`- ${cleaned}`);
    }
  }
  return lines.join("\n").trim();
}
