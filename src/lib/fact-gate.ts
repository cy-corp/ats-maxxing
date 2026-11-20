/**
 * Deterministic fact gate for the truthful larping levels (1–3).
 *
 * The prompt already forbids invented metrics, tools and employers, but a
 * prompt is a request, not a guarantee: smaller models trade truth for keyword
 * coverage. This module checks the generated resume against the source resume
 * text and reports (or removes) every claim the source does not support:
 *
 * - numbers (metrics, counts, percentages) that never appear in the source
 * - known technologies that the source never names
 * - employers that are not in the source
 *
 * It never adds anything. It is intentionally conservative: a technology is
 * only checked when it is in KNOWN_TECH, so ordinary words are never flagged.
 */

export interface FactViolation {
  kind: "number" | "technology" | "employer";
  /** The unsupported value, e.g. "35%" or "Kafka". */
  value: string;
  /** Where it was found, e.g. "experience[0].bullets[2]" or "skills". */
  where: string;
  /** The text that contained it. */
  text: string;
}

/**
 * Alias groups: every name in a group refers to the same technology, so any one
 * of them in the source supports all of them. Parent/child pairs (Spring vs
 * Spring Boot, AWS vs Lambda) are deliberately NOT aliases.
 */
const ALIAS_GROUPS: string[][] = [
  ["node.js", "nodejs", "node"],
  ["nestjs", "nest.js"],
  ["next.js", "nextjs"],
  ["react", "react.js", "reactjs"],
  ["vue", "vue.js", "vuejs"],
  ["postgresql", "postgres"],
  ["kubernetes", "k8s"],
  ["javascript", "js"],
  ["typescript", "ts"],
  ["golang", "go"],
  ["c#", "csharp"],
  [".net", "dotnet"],
  ["github actions", "gh actions"],
  ["amazon web services", "aws"],
  ["google cloud", "gcp", "google cloud platform"],
  ["microsoft azure", "azure"],
  ["mongodb", "mongo"],
  ["elasticsearch", "elastic search"],
  ["rabbitmq", "rabbit mq"],
  ["sql server", "mssql", "microsoft sql server"],
  ["ci/cd", "cicd"],
];

/** Technologies the gate checks. Lowercase. Aliases are added automatically. */
const KNOWN_TECH_BASE = [
  "java", "kotlin", "scala", "groovy", "python", "ruby", "php", "c++", "rust",
  "swift", "elixir", "erlang", "haskell", "clojure", "dart", "perl",
  "spring", "spring boot", "spring cloud", "spring security", "spring batch",
  "quarkus", "micronaut", "hibernate", "jpa", "maven", "gradle", "junit",
  "mockito", "testcontainers", "lombok", "jakarta ee", "java ee",
  "django", "flask", "fastapi", "rails", "laravel", "symfony", "express",
  "angular", "svelte", "flutter", "react native",
  "graphql", "grpc", "soap", "websocket",
  "mysql", "mariadb", "oracle", "sqlite", "redis", "cassandra", "dynamodb",
  "couchbase", "neo4j", "snowflake", "bigquery", "clickhouse",
  "kafka", "kinesis", "sqs", "sns", "activemq", "nats", "pulsar",
  "docker", "terraform", "ansible", "helm", "openshift", "istio", "pulumi",
  "jenkins", "gitlab ci", "circleci", "argo cd", "argocd", "travis ci",
  "lambda", "ec2", "s3", "ecs", "eks", "cloudformation", "cloudwatch",
  "datadog", "grafana", "prometheus", "new relic", "splunk", "kibana",
  "spark", "hadoop", "airflow", "flink", "databricks",
  "tensorflow", "pytorch", "langchain", "openai",
  "camunda", "bpmn", "salesforce", "sap", "servicenow",
  "microservices", "serverless",
];

function buildAliasIndex(): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const group of ALIAS_GROUPS) {
    for (const name of group) index.set(name, group);
  }
  return index;
}

const ALIAS_INDEX = buildAliasIndex();

export const KNOWN_TECH: string[] = Array.from(
  new Set([...KNOWN_TECH_BASE, ...ALIAS_GROUPS.flat()]),
)
  // Short ambiguous aliases are only used to SUPPORT a claim, never to flag one.
  .filter((t) => !["go", "js", "ts", "node", "mongo"].includes(t))
  // Longest first so "spring boot" is matched before "spring".
  .sort((a, b) => b.length - a.length);

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-term, case-insensitive match that treats ".", "#", "+" and "/" as part of a term. */
function termRegex(term: string): RegExp {
  return new RegExp(`(^|[^a-z0-9.#+/])${escapeRe(term)}(?=$|[^a-z0-9#+/]|\\.(?![a-z0-9]))`, "i");
}

function containsTerm(haystack: string, term: string): boolean {
  return termRegex(term).test(haystack);
}

function sourceSupportsTech(source: string, tech: string): boolean {
  const names = ALIAS_INDEX.get(tech) ?? [tech];
  return names.some((n) => containsTerm(source, n));
}

/** Known technologies mentioned in a piece of text (longest match wins). */
export function findTechMentions(text: string): string[] {
  let rest = ` ${text.toLowerCase()} `;
  const found: string[] = [];
  for (const tech of KNOWN_TECH) {
    const re = new RegExp(termRegex(tech).source, "gi");
    if (re.test(rest)) {
      found.push(tech);
      rest = rest.replace(re, "$1 ");
    }
  }
  return found;
}

/** Normalized numbers in a text: "8,000+" → "8000", "92%" → "92", "1.5" → "1.5". */
export function extractNumbers(text: string): string[] {
  const out: string[] = [];
  const re = /\d+(?:[.,]\d+)*/g;
  // Dates ("05/2025", "2023-08") are not claims; drop them so a month never
  // counts as support for a metric like "5x".
  const withoutDates = text.replace(/\b\d{1,2}\/\d{2,4}\b|\b\d{4}-\d{1,2}\b/g, " ");
  for (const m of withoutDates.match(re) ?? []) {
    let n = m;
    // Thousands separators: 8,000 / 8.000 / 1,200,000
    if (/^\d{1,3}([.,]\d{3})+$/.test(n)) n = n.replace(/[.,]/g, "");
    else n = n.replace(",", ".");
    n = n.replace(/^0+(?=\d)/, "");
    out.push(n);
  }
  return out;
}

/** Whole years between the earliest year in the source and now (upper bound for "N+ years"). */
function maxTenureYears(source: string, now: Date): number {
  const thisYear = now.getFullYear();
  const years = (source.match(/\b(19[89]\d|20\d\d)\b/g) ?? [])
    .map(Number)
    .filter((y) => y <= thisYear);
  if (years.length === 0) return 0;
  return thisYear - Math.min(...years);
}

const YEARS_PHRASE =
  /(\d+(?:[.,]\d+)?)\s*\+?\s*(?:years?|yrs?|anos?)\b/gi;

function normalizeCompany(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\b(inc|ltda|llc|ltd|s\.?a|corp|corporation|brasil|brazil|group)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sourceSupportsCompany(source: string, company: string): boolean {
  const name = normalizeCompany(company);
  if (!name) return true;
  const src = normalizeCompany(source);
  if (src.includes(name)) return true;
  // Accept when the first distinctive word of the company is in the source
  // ("Deltatec - Assistência Técnica" vs "Deltatec").
  const first = name.split(" ").find((w) => w.length >= 4);
  return first ? src.split(" ").includes(first) : false;
}

export interface ResumeLike {
  summary: string;
  experience: { company: string; bullets: string[] }[];
  skills: string[];
  projects?: { name: string; description: string; tech?: string }[];
}

export interface CheckOptions {
  /** Explicit years override from the user; allowed in "N+ years". */
  yearsOverride?: number;
  now?: Date;
}

/** Report every claim in `resume` that `sourceText` does not support. */
export function checkFacts(
  resume: ResumeLike,
  sourceText: string,
  options: CheckOptions = {},
): FactViolation[] {
  const source = sourceText.toLowerCase();
  const sourceNumbers = new Set(extractNumbers(sourceText));
  const tenure = Math.max(
    maxTenureYears(sourceText, options.now ?? new Date()),
    options.yearsOverride ?? 0,
  );
  const violations: FactViolation[] = [];

  const checkText = (text: string, where: string) => {
    // "N+ years" is computed tenure, allowed up to what the source dates support.
    const yearsAllowed = new Set<string>();
    for (const m of text.matchAll(YEARS_PHRASE)) {
      const n = Number(m[1].replace(",", "."));
      if (n <= tenure) yearsAllowed.add(extractNumbers(m[1])[0]);
    }
    for (const n of extractNumbers(text)) {
      if (!sourceNumbers.has(n) && !yearsAllowed.has(n)) {
        violations.push({ kind: "number", value: n, where, text });
      }
    }
    for (const tech of findTechMentions(text)) {
      if (!sourceSupportsTech(source, tech)) {
        violations.push({ kind: "technology", value: tech, where, text });
      }
    }
  };

  checkText(resume.summary, "summary");
  resume.experience.forEach((job, i) => {
    if (!sourceSupportsCompany(sourceText, job.company)) {
      violations.push({
        kind: "employer",
        value: job.company,
        where: `experience[${i}]`,
        text: job.company,
      });
    }
    job.bullets.forEach((b, j) => checkText(b, `experience[${i}].bullets[${j}]`));
  });
  resume.skills.forEach((s, i) => {
    for (const tech of findTechMentions(s)) {
      if (!sourceSupportsTech(source, tech)) {
        violations.push({ kind: "technology", value: tech, where: `skills[${i}]`, text: s });
      }
    }
  });
  (resume.projects ?? []).forEach((p, i) => {
    checkText(`${p.name}. ${p.description} ${p.tech ?? ""}`, `projects[${i}]`);
  });

  return violations;
}

/**
 * Remove unsupported claims. Never rewrites text: it drops whole skills,
 * bullets, summary sentences, projects and employers that carry a violation.
 * A real job whose bullets were all unsupported stays, with no bullets: the
 * employer and dates are true, and dropping them would hide real history.
 */
export function stripUnsupported<T extends ResumeLike>(
  resume: T,
  violations: FactViolation[],
): T {
  const bad = new Set(violations.map((v) => v.where));
  const badEmployer = new Set(
    violations.filter((v) => v.kind === "employer").map((v) => v.where),
  );

  const summarySentences = resume.summary.split(/(?<=[.!?])\s+/);
  const summaryViolations = violations.filter((v) => v.where === "summary");
  const summary = summaryViolations.length
    ? summarySentences
        .filter(
          (s) =>
            !summaryViolations.some((v) =>
              v.kind === "number"
                ? extractNumbers(s).includes(v.value)
                : findTechMentions(s).includes(v.value),
            ),
        )
        .join(" ")
    : resume.summary;

  const experience = resume.experience
    .map((job, i) => ({
      ...job,
      bullets: job.bullets.filter((_, j) => !bad.has(`experience[${i}].bullets[${j}]`)),
    }))
    .filter((_, i) => !badEmployer.has(`experience[${i}]`));

  return {
    ...resume,
    summary,
    experience,
    skills: resume.skills.filter((_, i) => !bad.has(`skills[${i}]`)),
    projects: resume.projects?.filter((_, i) => !bad.has(`projects[${i}]`)),
  };
}

/** A short, model-facing description of the violations, for one retry. */
export function describeViolations(violations: FactViolation[]): string {
  const lines = violations.slice(0, 25).map((v) => {
    const what =
      v.kind === "number"
        ? `the number "${v.value}"`
        : v.kind === "technology"
          ? `the technology "${v.value}"`
          : `the employer "${v.value}"`;
    return `- ${v.where}: ${what} is not in the source resume.`;
  });
  return `FACT CHECK FAILED. Your previous answer contained claims the source resume does not support:
${lines.join("\n")}
Rewrite the resume without these claims. Do not replace them with other invented numbers, tools or employers. A shorter, true resume is correct.`;
}
