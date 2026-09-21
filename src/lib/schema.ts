import { z } from "zod";

/**
 * Groq structured outputs require every `properties` key to also be in `required`.
 * Use empty string / empty array instead of .optional().
 */
export const optimizedResumeSchema = z.object({
  contact: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    location: z.string(),
    linkedin: z.string(),
    portfolio: z.string(),
  }),
  summary: z.string(),
  experience: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      location: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      bullets: z.array(z.string()).min(1),
    }),
  ),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string(),
      year: z.string(),
      details: z.string(),
    }),
  ),
  skills: z.array(z.string()),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      tech: z.string(),
    }),
  ),
  certifications: z.array(z.string()),
  matchScore: z.number().min(0).max(100),
  scoreBreakdown: z.object({
    keywords: z.number().min(0).max(100),
    skills: z.number().min(0).max(100),
    experience: z.number().min(0).max(100),
    seniority: z.number().min(0).max(100),
  }),
  injectedKeywords: z.array(z.string()),
});

export type OptimizedResumeSchema = z.infer<typeof optimizedResumeSchema>;
