import type { LanguageModel } from "ai";
import {
  createGoogleGenerativeAI,
  type GoogleLanguageModelOptions,
} from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { generateObject, NoObjectGeneratedError } from "ai";
import { resumeToMarkdown, resumeToPlainText } from "./export/format";
import {
  checkFacts,
  describeViolations,
  stripUnsupported,
  type FactViolation,
} from "./fact-gate";
import { getLarpingMeta } from "./larping";
import { mergePreservedSourceFields } from "./preserve-source";
import { buildSystemPrompt, buildUserPrompt } from "./prompts";
import { optimizedResumeSchema } from "./schema";
import type { GenerateRequest, OptimizedResume } from "./types";

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

function isRateLimited(err: unknown): boolean {
  const msg =
    err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("quota") ||
    msg.includes("resource_exhausted") ||
    msg.includes("too many requests")
  );
}

function friendlyError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    const cut = msg.split("\n")[0]?.slice(0, 280) ?? msg;
    return cut || "Generation failed. Please retry.";
  }
  return "Generation failed. Please retry.";
}

/** Groq sometimes returns `[{...}]` instead of `{...}` — unwrap before re-validate. */
function repairResumeJson(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      const first = parsed.find(
        (item) =>
          item &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          "contact" in item,
      );
      if (first) return JSON.stringify(first);
    }
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return JSON.stringify(parsed);
    }
  } catch {
    // fall through to brace extract
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const slice = trimmed.slice(start, end + 1);
    try {
      const parsed: unknown = JSON.parse(slice);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return slice;
      }
      if (Array.isArray(parsed)) {
        return repairResumeJson(JSON.stringify(parsed));
      }
    } catch {
      return null;
    }
  }

  return null;
}

const googleProviderOptions = {
  google: {
    thinkingConfig: { thinkingLevel: "minimal" },
  } satisfies GoogleLanguageModelOptions,
};

type ProviderId = "gemini" | "groq";

function getPrimaryModel(): { provider: ProviderId; model: LanguageModel } {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();

  if (groqKey) {
    const groq = createGroq({ apiKey: groqKey });
    // 120b follows structured JSON more reliably than 20b on free tier
    return { provider: "groq", model: groq("openai/gpt-oss-120b") };
  }
  if (googleKey) {
    const google = createGoogleGenerativeAI({ apiKey: googleKey });
    return { provider: "gemini", model: google("gemini-3.6-flash") };
  }

  throw new Error(
    "No AI API keys configured. Add GROQ_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY.",
  );
}

export function assertAiConfigured() {
  getPrimaryModel();
}

const GENERATE_TIMEOUT_MS = 90_000;
/** Fact-gate retry only starts if the first call used less than this share of the budget. */
const RETRY_BUDGET_FRACTION = 0.45;

function withExports(
  partial: Omit<OptimizedResume, "plainText" | "markdown">,
  sourceText: string,
  options?: { includeSkills?: boolean; includeProjects?: boolean },
): OptimizedResume {
  const merged = mergePreservedSourceFields(partial, sourceText, options);
  const resume: OptimizedResume = { ...merged, plainText: "", markdown: "" };
  return {
    ...resume,
    plainText: resumeToPlainText(resume),
    markdown: resumeToMarkdown(resume),
  };
}

export async function generateOptimizedResume(
  input: GenerateRequest,
): Promise<{ resume: OptimizedResume; provider: ProviderId }> {
  const { provider, model } = getPrimaryModel();
  const includeSkills = input.includeTechnicalSkills !== false;
  const includeProjects = input.includeProjects !== false;
  const system = buildSystemPrompt(
    input.density,
    {
      includeTechnicalSkills: includeSkills,
      includeProjects,
    },
    input.larpingLevel,
  );
  const prompt = buildUserPrompt(input);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

  const generate = async (p: string) => {
    const { object } = await generateObject({
      model,
      schema: optimizedResumeSchema,
      schemaName: "OptimizedResume",
      schemaDescription:
        "A single optimized resume object (never an array). Includes contact, summary, experience, education, skills, projects, certifications, scores, and injectedKeywords.",
      system,
      prompt: p,
      temperature: 0.3,
      maxOutputTokens: 8192,
      abortSignal: controller.signal,
      repairText: async ({ text }) => repairResumeJson(text),
      ...(provider === "gemini"
        ? { providerOptions: googleProviderOptions }
        : {
            providerOptions: {
              groq: {
                reasoningEffort: "low" as const,
                reasoningFormat: "hidden" as const,
                strictJsonSchema: true,
              },
            },
          }),
    });
    return object;
  };

  const startedAt = Date.now();

  try {
    let object = await generate(prompt);
    let factCheck: OptimizedResume["factCheck"];

    // Levels 1–3 promise no new facts. Check the output against the source;
    // retry once with the violations named, then strip whatever is left.
    if (getLarpingMeta(input.larpingLevel).truthful) {
      const checkOpts = { yearsOverride: input.yearsOfExperience };
      let violations: FactViolation[] = checkFacts(object, input.resumeText, checkOpts);
      // Retry only while there is time left in the request budget.
      const retried =
        violations.length > 0 &&
        Date.now() - startedAt < GENERATE_TIMEOUT_MS * RETRY_BUDGET_FRACTION;
      if (retried) {
        object = await generate(`${prompt}\n\n${describeViolations(violations)}`);
        violations = checkFacts(object, input.resumeText, checkOpts);
      }
      if (violations.length > 0) object = stripUnsupported(object, violations);
      factCheck = { retried, removed: violations };
    }

    return {
      resume: {
        ...withExports(object, input.resumeText, {
          includeSkills,
          includeProjects,
        }),
        ...(factCheck ? { factCheck } : {}),
      },
      provider,
    };
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error("Timed out after 90s. Try again with a shorter job text.");
    }
    if (isRateLimited(err)) {
      throw new RateLimitError(
        "Free-tier AI quota exhausted. Try again later, or add another provider key.",
      );
    }
    if (NoObjectGeneratedError.isInstance(err)) {
      throw new Error(
        "Model returned invalid resume JSON (wrong shape). Please retry.",
      );
    }
    console.error(`[generateOptimizedResume] ${provider} failed:`, err);
    throw new Error(friendlyError(err));
  } finally {
    clearTimeout(timeout);
  }
}
