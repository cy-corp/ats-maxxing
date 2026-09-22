"use server";

import { generateOptimizedResume, RateLimitError } from "@/lib/ai";
import { scrapeJobUrl } from "@/lib/scrape";
import type {
  GenerateRequest,
  LarpingLevel,
  OptimizedResume,
  OutputLanguage,
  ResumeDensity,
  ScrapeResult,
} from "@/lib/types";

export async function scrapeJobAction(url: string): Promise<ScrapeResult> {
  return scrapeJobUrl(url.trim());
}

export async function extractPdfAction(
  formData: FormData,
): Promise<{ text?: string; error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "No PDF file provided." };
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return { error: "Please upload a PDF file." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { error: "PDF too large (max 8MB)." };
  }

  try {
    const { extractText } = await import("unpdf");
    const buffer = await file.arrayBuffer();
    const { text } = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });
    const cleaned = String(text || "")
      .replace(/\s+\n/g, "\n")
      .trim();

    if (cleaned.length < 40) {
      return {
        error:
          "Could not extract enough text from this PDF. Paste your resume as text instead.",
      };
    }

    return { text: cleaned.slice(0, 40000) };
  } catch {
    return {
      error:
        "PDF extraction failed. Paste your resume as text instead.",
    };
  }
}

export type GenerateActionResult =
  | { ok: true; resume: OptimizedResume; provider: "gemini" | "groq" }
  | { ok: false; error: string; rateLimited?: boolean };

export async function generateResumeAction(input: {
  resumeText: string;
  jobText: string;
  language: OutputLanguage;
  larpingLevel: LarpingLevel;
  density: ResumeDensity;
  yearsOfExperience?: number;
}): Promise<GenerateActionResult> {
  const resumeText = input.resumeText?.trim() ?? "";
  const jobText = input.jobText?.trim() ?? "";

  if (resumeText.length < 40) {
    return { ok: false, error: "Resume text is too short." };
  }
  if (jobText.length < 40) {
    return { ok: false, error: "Job description is too short." };
  }

  const density: ResumeDensity =
    input.density === "extended" ? "extended" : "condensed";

  const yearsRaw = input.yearsOfExperience;
  const yearsOfExperience =
    typeof yearsRaw === "number" &&
    Number.isFinite(yearsRaw) &&
    yearsRaw >= 1 &&
    yearsRaw <= 40
      ? Math.round(yearsRaw)
      : undefined;

  const payload: GenerateRequest = {
    resumeText: resumeText.slice(0, 40000),
    jobText: jobText.slice(0, 20000),
    language: input.language,
    larpingLevel: input.larpingLevel,
    density,
    ...(yearsOfExperience !== undefined ? { yearsOfExperience } : {}),
  };

  try {
    const { resume, provider } = await generateOptimizedResume(payload);
    return { ok: true, resume: { ...resume, density }, provider };
  } catch (err) {
    if (err instanceof RateLimitError) {
      return { ok: false, error: err.message, rateLimited: true };
    }
    const message =
      err instanceof Error ? err.message : "Generation failed. Please retry.";
    return { ok: false, error: message };
  }
}
