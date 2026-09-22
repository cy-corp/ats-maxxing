import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import type { OptimizedResume } from "../types";
import { cleanEmptyDecorators } from "../preserve-source";

export async function buildDocxBuffer(resume: OptimizedResume): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: resume.contact.name, bold: true, size: 28 }),
      ],
    }),
  );

  const contactLine = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
    resume.contact.portfolio,
  ]
    .filter(Boolean)
    .join(" | ");

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: contactLine, size: 18 })],
    }),
  );

  const section = (title: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 140, after: 40 },
      children: [new TextRun({ text: title, bold: true, size: 20 })],
    });

  children.push(section("Professional Summary"));
  children.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: resume.summary, size: 20 })],
    }),
  );

  children.push(section("Professional Experience"));
  for (const exp of resume.experience) {
    children.push(
      new Paragraph({
        spacing: { before: 120 },
        children: [
          new TextRun({
            text: `${exp.title} — ${exp.company}`,
            bold: true,
            size: 20,
          }),
        ],
      }),
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${exp.startDate} – ${exp.endDate}${exp.location ? ` | ${exp.location}` : ""}`,
            italics: true,
            size: 18,
          }),
        ],
      }),
    );
    for (const bullet of exp.bullets) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: bullet, size: 20 })],
        }),
      );
    }
  }

  children.push(section("Education"));
  for (const edu of resume.education) {
    const year = edu.year?.trim();
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: year
              ? `${edu.degree} — ${edu.school} (${year})`
              : `${edu.degree} — ${edu.school}`,
            size: 20,
          }),
        ],
      }),
    );
    if (edu.details) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: edu.details, size: 18 })],
        }),
      );
    }
  }

  if (resume.skills?.length) {
    children.push(section("Technical Skills"));
    children.push(
      new Paragraph({
        children: [new TextRun({ text: resume.skills.join(", "), size: 20 })],
      }),
    );
  }

  if (resume.projects?.length) {
    children.push(section("Projects"));
    for (const p of resume.projects) {
      const tech = p.tech?.trim();
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: tech
                ? `${p.name} (${tech}): ${p.description}`
                : `${p.name}: ${p.description}`,
              size: 20,
            }),
          ],
        }),
      );
    }
  }

  if (resume.certifications?.length) {
    children.push(section("Certifications"));
    for (const cert of resume.certifications) {
      const cleaned = cleanEmptyDecorators(cert);
      if (!cleaned) continue;
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: cleaned, size: 20 })],
        }),
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
