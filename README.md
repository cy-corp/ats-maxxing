# ATS Maxxing

Experimental resume optimizer that maxes out ATS match for a specific job posting.

## Features

- Upload PDF resume or paste text
- Scrape job URL with resilient paste fallback
- Output language: English / Portuguese
- **Larping Level** slider (1 Minimal → 5 Larpmaxxing)
- Structured ATS-friendly rewrite (no tables/columns/icons)
- Match score + keyword coverage
- Download `.txt` / `.md` / `.pdf` / `.docx`

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Framer Motion + custom UI
- Vercel AI SDK — Gemini Flash (primary) → Groq (fallback)
- `unpdf` · Firecrawl (+ cheerio fallback) · `@react-pdf/renderer` · `docx`

## Setup

```bash
npm install
cp .env.example .env.local
```

Add at least one free-tier key:

```env
GOOGLE_GENERATIVE_AI_API_KEY=...
GROQ_API_KEY=...
FIRECRAWL_API_KEY=...   # optional but recommended for job URL scrape
```

```bash
npm run dev
```

## Deploy

Deploy on Vercel. Set the same env vars in the project settings. No external backend required.

Job scrape uses **Firecrawl** when `FIRECRAWL_API_KEY` is set (free tier), then falls back to a local cheerio fetch.

## Larping levels

| Level | Name | Behavior |
|------:|------|----------|
| 1 | Minimal | Reorganize + real keywords |
| 2 | Light Polish | Better bullets + realistic metrics |
| 3 | Aggressive | Heavy rewrite toward JD |
| 4 | Heavy | Stretch / transferable skills |
| 5 | Larpmaxxing | Maximum fit; may invent plausible experience |

Levels 4–5 show an on-screen warning.
