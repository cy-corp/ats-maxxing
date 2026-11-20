import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  checkFacts,
  describeViolations,
  extractNumbers,
  findTechMentions,
  stripUnsupported,
} from "./fact-gate";

const SOURCE = `Yago Andrade — Java Software Engineer
Marlabs Brazil – Remote | 05/2025 – Present
• Led a FaxBack integration layer, routing 8,000+ legacy fax devices to the cloud.
• Reduced fax-related support tickets by 92% through automations (15-40 minutes per incident).
• Built services with Java, Spring Boot and SQL Server; message queuing with RabbitMQ.
Deltatec | 07/2024 – 05/2025
• Order webhook (RabbitMQ) reduced fulfillment time by 70%. Node.js, TypeScript, NestJS, MySQL.
Irroba | 08/2023 – 06/2024
• AWS Lambda, SQS, PostgreSQL, Redis.`;

const NOW = new Date("2026-11-20T12:00:00Z");

function resume(overrides: Partial<Parameters<typeof checkFacts>[0]> = {}) {
  return {
    summary:
      "Java Software Engineer with 3+ years building Spring Boot services. Moved 8,000+ fax devices to the cloud.",
    experience: [
      {
        company: "Marlabs Brasil",
        bullets: [
          "Cut fax support tickets by 92% with automations.",
          "Built Java and Spring Boot services backed by SQL Server.",
        ],
      },
      {
        company: "Deltatec - Assistência Técnica",
        bullets: ["Built a RabbitMQ order webhook that cut fulfillment time by 70%."],
      },
    ],
    skills: ["Java", "Spring Boot", "Node.js", "Postgres", "RabbitMQ"],
    projects: [],
    ...overrides,
  };
}

describe("fact gate", () => {
  it("passes a resume built only from source facts", () => {
    assert.deepEqual(checkFacts(resume(), SOURCE, { now: NOW }), []);
  });

  it("normalizes numbers", () => {
    assert.deepEqual(extractNumbers("8,000+ devices, 92% and 1.5x"), ["8000", "92", "1.5"]);
  });

  it("flags an invented metric", () => {
    const v = checkFacts(
      resume({
        experience: [
          { company: "Marlabs", bullets: ["Improved reliability by 35% across services."] },
        ],
      }),
      SOURCE,
      { now: NOW },
    );
    assert.deepEqual(v.map((x) => [x.kind, x.value]), [["number", "35"]]);
  });

  it("flags a technology the source never names, but accepts aliases", () => {
    const v = checkFacts(
      resume({ skills: ["Java", "Kafka", "Kubernetes", "Postgres", "Node"] }),
      SOURCE,
      { now: NOW },
    );
    assert.deepEqual(v.map((x) => x.value).sort(), ["kafka", "kubernetes"]);
  });

  it("does not treat Spring as support for Spring Cloud", () => {
    const v = checkFacts(resume({ skills: ["Spring Cloud"] }), SOURCE, { now: NOW });
    assert.deepEqual(v.map((x) => x.value), ["spring cloud"]);
  });

  it("allows N+ years up to what the source dates support, and flags inflation", () => {
    const ok = checkFacts(resume({ summary: "Engineer with 3+ years." }), SOURCE, { now: NOW });
    assert.deepEqual(ok, []);
    const inflated = checkFacts(resume({ summary: "Engineer with 5+ years." }), SOURCE, { now: NOW });
    assert.deepEqual(inflated.map((x) => [x.kind, x.value]), [["number", "5"]]);
  });

  it("accepts a user years override", () => {
    const v = checkFacts(resume({ summary: "Engineer with 5+ years." }), SOURCE, {
      now: NOW,
      yearsOverride: 5,
    });
    assert.deepEqual(v, []);
  });

  it("flags an invented employer", () => {
    const v = checkFacts(
      resume({
        experience: [{ company: "Google", bullets: ["Built Java services."] }],
      }),
      SOURCE,
      { now: NOW },
    );
    assert.deepEqual(v.map((x) => [x.kind, x.value]), [["employer", "Google"]]);
  });

  it("ignores ordinary words", () => {
    assert.deepEqual(findTechMentions("Led the go-to-market of a node in the team"), []);
  });

  it("strips only the offending claims and keeps real jobs", () => {
    const r = resume({
      summary: "Java engineer. Expert in Kafka streaming.",
      experience: [
        { company: "Marlabs", bullets: ["Improved uptime by 35%.", "Built Java services."] },
        { company: "Deltatec", bullets: ["Scaled Kafka to 1M events."] },
        { company: "Google", bullets: ["Built Java services."] },
      ],
      skills: ["Java", "Kafka"],
    });
    const v = checkFacts(r, SOURCE, { now: NOW });
    const clean = stripUnsupported(r, v);
    assert.equal(clean.summary, "Java engineer.");
    assert.deepEqual(clean.skills, ["Java"]);
    assert.deepEqual(clean.experience.map((e) => e.company), ["Marlabs", "Deltatec"]);
    assert.deepEqual(clean.experience[0].bullets, ["Built Java services."]);
    assert.deepEqual(clean.experience[1].bullets, []);
    assert.deepEqual(checkFacts(clean, SOURCE, { now: NOW }), []);
  });

  it("describes violations for the retry prompt", () => {
    const v = checkFacts(resume({ skills: ["Kafka"] }), SOURCE, { now: NOW });
    assert.match(describeViolations(v), /the technology "kafka" is not in the source resume/);
  });
});
