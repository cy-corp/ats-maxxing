import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractText } from "unpdf";
import { buildPdfBuffer } from "./pdf";
import type { OptimizedResume } from "../types";

function resume(summary: string): OptimizedResume {
  return {
    contact: {
      name: "Yago Andrade",
      email: "yagodaouddev@gmail.com",
      linkedin: "linkedin.com/in/yago-andrade-dev",
      github: "github.com/yagodaoud",
      portfolio: "yago-dev-portfolio.vercel.app/en",
    },
    summary,
    experience: [
      {
        company: "Deltatec",
        title: "Junior Back-end Developer",
        location: "Franca",
        startDate: "Jul 2024",
        endDate: "May 2025",
        bullets: [
          "Built carrier\u2011grade, on\u2010premises, fax\u00ADrelated, full\u2011stack work and saved 15\u201340 minutes.",
        ],
      },
    ],
    education: [],
    skills: ["CI/CD", "end\u2011to\u2011end"],
    projects: [],
    certifications: [],
    matchScore: 0,
    scoreBreakdown: { keywords: 0, skills: 0, experience: 0, seniority: 0 },
    injectedKeywords: [],
    plainText: "",
    markdown: "",
    density: "condensed",
  };
}

describe("PDF hyphen export", () => {
  it("keeps hyphens and the GitHub link in extracted text", async () => {
    const buffer = await buildPdfBuffer(
      resume(
        "Delivering high\u2011impact, AI\u2011augmented, end\u2011to\u2011end results.",
      ),
    );
    const { text } = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });
    const extracted = String(text);
    assert.match(extracted, /high-impact/);
    assert.match(extracted, /AI-augmented/);
    assert.match(extracted, /end-to-end/);
    assert.match(extracted, /carrier-grade/);
    assert.match(extracted, /on-premises/);
    assert.match(extracted, /fax-related/);
    assert.match(extracted, /full-stack/);
    assert.match(extracted, /15.40|15–40|15-40/);
    assert.match(extracted, /github\.com\/yagodaoud/);
    assert.doesNotMatch(extracted, /highimpact|carriergrade|faxrelated|endtoend|AIaugmented/);
  });
});
