import * as cheerio from "cheerio";
import type { ScrapeResult } from "./types";

const BLOCKED_HOST_HINTS = ["linkedin.com", "indeed.com", "glassdoor.com"];

function cleanText(raw: string): string {
  return raw
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function extractMainText(html: string): {
  title?: string;
  company?: string;
  text: string;
} {
  const $ = cheerio.load(html);

  $("script, style, noscript, svg, iframe, nav, footer, header, form").remove();

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text() ||
    $("title").text() ||
    undefined;

  const company =
    $('meta[property="og:site_name"]').attr("content") ||
    $('[class*="company"]').first().text() ||
    undefined;

  const candidates = [
    $('[class*="job-description"]').text(),
    $('[class*="jobDescription"]').text(),
    $('[id*="job-description"]').text(),
    $('[data-testid*="description"]').text(),
    $("article").text(),
    $("main").text(),
    $("#content").text(),
    $("body").text(),
  ];

  const text = cleanText(
    candidates.find((c) => cleanText(c).length > 200) ?? "",
  );

  return {
    title: title ? cleanText(title) : undefined,
    company: company ? cleanText(company).slice(0, 120) : undefined,
    text,
  };
}

/** Firecrawl free tier (~1k credits/mo) — JS-rendered pages, cleaner markdown. */
async function scrapeWithFirecrawl(url: string): Promise<ScrapeResult | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return null;
    }

    const payload = (await res.json()) as {
      success?: boolean;
      data?: {
        markdown?: string;
        metadata?: {
          title?: string;
          ogTitle?: string;
          ogSiteName?: string;
          sourceURL?: string;
        };
      };
      error?: string;
    };

    if (!payload.success || !payload.data?.markdown) {
      return null;
    }

    const text = cleanText(payload.data.markdown);
    if (text.length < 180) return null;

    const meta = payload.data.metadata;
    return {
      success: true,
      title: meta?.ogTitle || meta?.title
        ? cleanText(meta.ogTitle || meta.title || "")
        : undefined,
      company: meta?.ogSiteName
        ? cleanText(meta.ogSiteName).slice(0, 120)
        : undefined,
      text: text.slice(0, 20000),
    };
  } catch {
    return null;
  }
}

/** Cheap local fallback: plain fetch + cheerio (no JS render). */
async function scrapeWithCheerio(url: string): Promise<ScrapeResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ATSMaxxing/1.0; +https://ats-maxxing.local)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8",
      },
      redirect: "follow",
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return {
        success: false,
        error: `Could not fetch job page (${res.status}). Paste the description instead.`,
      };
    }

    const html = await res.text();
    const extracted = extractMainText(html);

    if (extracted.text.length < 180) {
      return {
        success: false,
        error:
          "Page content looked empty or blocked. Paste the full job description.",
        title: extracted.title,
        company: extracted.company,
      };
    }

    return {
      success: true,
      title: extracted.title,
      company: extracted.company,
      text: extracted.text.slice(0, 20000),
    };
  } catch {
    return {
      success: false,
      error: "Scrape failed (timeout or network). Paste the job text instead.",
    };
  }
}

export async function scrapeJobUrl(url: string): Promise<ScrapeResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      success: false,
      error: "Invalid URL. Paste the full job page text instead.",
    };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { success: false, error: "Only http(s) URLs are supported." };
  }

  const hasFirecrawl = Boolean(process.env.FIRECRAWL_API_KEY?.trim());
  const hardBlocked = BLOCKED_HOST_HINTS.some((h) =>
    parsed.hostname.includes(h),
  );

  // These hosts usually need a real browser stack — Firecrawl handles them better.
  if (hardBlocked && !hasFirecrawl) {
    return {
      success: false,
      error:
        "This site often blocks scraping. Add FIRECRAWL_API_KEY or paste the full job description.",
    };
  }

  const viaFirecrawl = await scrapeWithFirecrawl(parsed.toString());
  if (viaFirecrawl?.success) return viaFirecrawl;

  if (hardBlocked) {
    return {
      success: false,
      error:
        "Firecrawl could not open this posting. Paste the full job description below.",
    };
  }

  return scrapeWithCheerio(parsed.toString());
}
