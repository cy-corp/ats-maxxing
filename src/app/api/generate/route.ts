import { NextRequest, NextResponse } from "next/server";
import { generateOptimizedResume, RateLimitError } from "@/lib/ai";
import type {
  GenerateRequest,
  LarpingLevel,
  OutputLanguage,
  ResumeDensity,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 90;

/** One-shot JSON generate (no streaming / no retry chain). */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      resumeText?: string;
      jobText?: string;
      language?: OutputLanguage;
      larpingLevel?: LarpingLevel;
      density?: ResumeDensity;
      yearsOfExperience?: number;
      includeTechnicalSkills?: boolean;
      includeProjects?: boolean;
    };

    const resumeText = body.resumeText?.trim() ?? "";
    const jobText = body.jobText?.trim() ?? "";

    if (resumeText.length < 40 || jobText.length < 40) {
      return NextResponse.json(
        { error: "Resume and job text must be at least ~40 characters." },
        { status: 400 },
      );
    }

    const density: ResumeDensity =
      body.density === "extended" ? "extended" : "condensed";

    const yearsRaw = body.yearsOfExperience;
    const yearsOfExperience =
      typeof yearsRaw === "number" &&
      Number.isFinite(yearsRaw) &&
      yearsRaw >= 1 &&
      yearsRaw <= 40
        ? Math.round(yearsRaw)
        : undefined;

    const input: GenerateRequest = {
      resumeText: resumeText.slice(0, 40000),
      jobText: jobText.slice(0, 20000),
      language: body.language === "pt" ? "pt" : "en",
      larpingLevel: ([1, 2, 3, 4, 5].includes(Number(body.larpingLevel))
        ? Number(body.larpingLevel)
        : 2) as LarpingLevel,
      density,
      includeTechnicalSkills: body.includeTechnicalSkills !== false,
      includeProjects: body.includeProjects !== false,
      ...(yearsOfExperience !== undefined ? { yearsOfExperience } : {}),
    };

    const { resume, provider } = await generateOptimizedResume(input);
    return NextResponse.json({ resume: { ...resume, density }, provider });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: err.message, rateLimited: true },
        { status: 429 },
      );
    }
    const message =
      err instanceof Error ? err.message : "Generation failed. Please retry.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
