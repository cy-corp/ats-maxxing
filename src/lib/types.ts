export type OutputLanguage = "en" | "pt";

export type LarpingLevel = 1 | 2 | 3 | 4 | 5;

/** condensed = aim for 1 page; extended = fuller multi-page OK */
export type ResumeDensity = "condensed" | "extended";

export interface ContactInfo {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
}

export interface ExperienceItem {
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface EducationItem {
  school: string;
  degree: string;
  year: string;
  details?: string;
}

export interface ProjectItem {
  name: string;
  description: string;
  tech?: string;
}

export interface ScoreBreakdown {
  keywords: number;
  skills: number;
  experience: number;
  seniority: number;
}

export interface OptimizedResume {
  contact: ContactInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  projects?: ProjectItem[];
  certifications?: string[];
  matchScore: number;
  scoreBreakdown: ScoreBreakdown;
  injectedKeywords: string[];
  plainText: string;
  markdown: string;
  /** Set by the app after generate — drives PDF density, not from the model. */
  density?: ResumeDensity;
}

export interface GenerateRequest {
  resumeText: string;
  jobText: string;
  language: OutputLanguage;
  larpingLevel: LarpingLevel;
  density: ResumeDensity;
  /**
   * Optional floor for "X+ years" in the summary.
   * Use when source omits relevant tenure (e.g. internship).
   * If unset, the model must compute from the earliest listed job start → today.
   */
  yearsOfExperience?: number;
  /** Include Technical Skills section (default true). */
  includeTechnicalSkills?: boolean;
  /** Include Projects section (default true). */
  includeProjects?: boolean;
}

export interface ScrapeResult {
  success: boolean;
  title?: string;
  company?: string;
  text?: string;
  error?: string;
}
