"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { generateResumeAction } from "@/app/actions";
import { AsciiLoader } from "@/components/effects/ascii-loader";
import { DensitySelector } from "@/components/workspace/density-selector";
import { DownloadBar } from "@/components/workspace/download-bar";
import { GenerateButton } from "@/components/workspace/generate-button";
import { JobInput } from "@/components/workspace/job-input";
import { LanguageSelector } from "@/components/workspace/language-selector";
import { LarpingSlider } from "@/components/workspace/larping-slider";
import { MatchScore } from "@/components/workspace/match-score";
import { ResumeInput } from "@/components/workspace/resume-input";
import { ResumePreview } from "@/components/workspace/resume-preview";
import {
  SectionToggles,
  type SectionOptions,
} from "@/components/workspace/section-toggles";
import { YearsInput } from "@/components/workspace/years-input";
import type {
  LarpingLevel,
  OptimizedResume,
  OutputLanguage,
  ResumeDensity,
} from "@/lib/types";

export function Workspace() {
  const reduceMotion = useReducedMotion();
  const [resumeText, setResumeText] = useState("");
  const [jobText, setJobText] = useState("");
  const [jobMeta, setJobMeta] = useState<{
    title?: string;
    company?: string;
  } | null>(null);
  const [language, setLanguage] = useState<OutputLanguage>("en");
  const [larpingLevel, setLarpingLevel] = useState<LarpingLevel>(2);
  const [density, setDensity] = useState<ResumeDensity>("condensed");
  const [yearsOfExperience, setYearsOfExperience] = useState<
    number | undefined
  >(undefined);
  const [sections, setSections] = useState<SectionOptions>({
    includeTechnicalSkills: true,
    includeProjects: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [result, setResult] = useState<OptimizedResume | null>(null);
  const [provider, setProvider] = useState<"gemini" | "groq" | null>(null);

  const canGenerate = useMemo(
    () => resumeText.trim().length >= 40 && jobText.trim().length >= 40,
    [resumeText, jobText],
  );

  async function handleGenerate() {
    if (loading) return;
    setError(null);
    setRateLimited(false);
    setResult(null);
    setProvider(null);
    setLoading(true);
    try {
      const res = await generateResumeAction({
        resumeText,
        jobText,
        language,
        larpingLevel,
        density,
        yearsOfExperience,
        includeTechnicalSkills: sections.includeTechnicalSkills,
        includeProjects: sections.includeProjects,
      });
      if (!res.ok) {
        setError(res.error);
        setRateLimited(Boolean(res.rateLimited));
        return;
      }
      setResult(res.resume);
      setProvider(res.provider);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Generation failed. Please retry.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.section
      id="workspace"
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative -mt-10 scroll-mt-6 px-4 pb-10 pt-2 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-[var(--border-strong)] pb-4">
          <div>
            <button
              type="button"
              onClick={() =>
                window.scrollTo({ top: 0, behavior: "smooth" })
              }
              className="cursor-pointer text-left transition-opacity hover:opacity-70"
            >
              <h2 className="font-pixel text-sm tracking-wide text-[var(--foreground)]">
                ATS Maxxing
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                workspace · optimize · export
              </p>
            </button>
          </div>
          {provider ? (
            <span className="rounded-sm border border-dashed border-[var(--border)] px-2 py-1 font-mono text-[10px] text-[var(--muted)]">
              via {provider}
            </span>
          ) : null}
        </header>

        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <motion.aside
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
            className="ascii-frame space-y-6 rounded-sm border border-dashed border-[var(--border-strong)] bg-white/55 p-4 backdrop-blur-[2px] sm:p-5"
          >
            <span className="ascii-corner-bl" aria-hidden>
              +
            </span>
            <span className="ascii-corner-br" aria-hidden>
              +
            </span>
            <ResumeInput value={resumeText} onChange={setResumeText} />
            <div className="border-t border-dashed border-[var(--border)]" />
            <JobInput
              value={jobText}
              onChange={setJobText}
              meta={jobMeta}
              onMeta={setJobMeta}
            />
            <div className="border-t border-dashed border-[var(--border)]" />
            <LanguageSelector value={language} onChange={setLanguage} />
            <div className="border-t border-dashed border-[var(--border)]" />
            <YearsInput
              value={yearsOfExperience}
              onChange={setYearsOfExperience}
            />
            <div className="border-t border-dashed border-[var(--border)]" />
            <DensitySelector value={density} onChange={setDensity} />
            <div className="border-t border-dashed border-[var(--border)]" />
            <SectionToggles value={sections} onChange={setSections} />
            <div className="border-t border-dashed border-[var(--border)]" />
            <LarpingSlider value={larpingLevel} onChange={setLarpingLevel} />
            <GenerateButton
              onClick={() => void handleGenerate()}
              disabled={!canGenerate}
              loading={loading}
            />
            {!canGenerate ? (
              <p className="font-mono text-[11px] text-[var(--muted)]">
                Need ~40+ chars of resume and job text to generate.
              </p>
            ) : null}
            {error ? (
              <div
                className={`rounded-sm border border-dashed px-3 py-2 font-mono text-xs break-words ${
                  rateLimited
                    ? "border-[var(--warning)]/50 bg-[rgba(154,107,47,0.08)] text-[var(--warning)]"
                    : "border-[var(--danger)]/40 bg-[rgba(139,58,58,0.06)] text-[var(--danger)]"
                }`}
              >
                {rateLimited ? "⏳ " : ""}
                {error}
              </div>
            ) : null}
          </motion.aside>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: 0.16, ease: "easeOut" }}
            className="ascii-frame flex h-full min-h-0 flex-col gap-4 rounded-sm border border-dashed border-[var(--border-strong)] bg-white/55 p-4 backdrop-blur-[2px] sm:p-5"
          >
            <span className="ascii-corner-bl" aria-hidden>
              +
            </span>
            <span className="ascii-corner-br" aria-hidden>
              +
            </span>
            {loading && !result ? (
              <div className="flex min-h-[280px] flex-1 items-center justify-center">
                <AsciiLoader label="rewriting against job keywords" />
              </div>
            ) : result ? (
              <>
                <div className="shrink-0 space-y-4">
                  <MatchScore resume={result} />
                  <DownloadBar resume={result} />
                </div>
                <ResumePreview resume={result} />
              </>
            ) : (
              <EmptyPreview />
            )}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

function EmptyPreview() {
  return (
    <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center gap-4 text-center">
      <pre className="select-none whitespace-pre font-mono text-[10px] leading-[1.2] text-[var(--muted)]/55">
{`+---------------------+
|  preview awaits     |
|  ··· clouds ···     |
|  drop inputs → go   |
+---------------------+`}
      </pre>
      <p className="max-w-sm font-mono text-xs text-[var(--muted)]">
        Live ATS preview, match score, and keyword coverage appear here after
        generation.
      </p>
    </div>
  );
}
