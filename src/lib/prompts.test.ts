import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSystemPrompt, buildUserPrompt } from "./prompts";
import type { GenerateRequest } from "./types";

function request(level: GenerateRequest["larpingLevel"]): GenerateRequest {
  return {
    resumeText: "x".repeat(80),
    jobText: "y".repeat(80),
    language: "en",
    larpingLevel: level,
    density: "condensed",
  };
}

describe("larping prompt contracts", () => {
  it("level 2 forbids invented employers, metrics, and technologies", () => {
    const prompt = buildUserPrompt(request(2));
    assert.match(prompt, /LEVEL 2 CONTRACT/);
    assert.match(prompt, /strictly truthful/);
    assert.match(prompt, /NEVER invent an employer/);
    assert.match(prompt, /Metrics may only be reused/);
    assert.match(prompt, /message queues/);
    assert.match(prompt, /does not justify Python/);
    assert.doesNotMatch(prompt, /managed team of 5/);
    assert.doesNotMatch(prompt, /40–50% hard-skill/);
    assert.doesNotMatch(prompt, /~80% hard-skill coverage/);
  });

  it("level 1 stays a minimal reorg and level 5 discloses fabrication", () => {
    const minimal = buildUserPrompt(request(1));
    assert.match(minimal, /LEVEL 1 CONTRACT/);
    assert.match(minimal, /lightly fix grammar/);
    assert.match(minimal, /Do not chase keyword coverage/);

    const larp = buildUserPrompt(request(5));
    assert.match(larp, /LEVEL 5 CONTRACT/);
    assert.match(larp, /May invent tools, metrics, and plausible experience/);
  });

  it("system prompt for level 2 does not demand padded skills or invented numbers", () => {
    const system = buildSystemPrompt("condensed", undefined, 2);
    assert.match(system, /Numbers in bullets and the summary must already appear in the source/);
    assert.match(system, /do not invent a role to fill space/);
    assert.match(system, /contact\.github/);
    assert.doesNotMatch(system, /levels 2–3 aim ~80/);
    assert.doesNotMatch(system, /12–22 items/);
  });

  it("level 4 system prompt still allows stretched metrics", () => {
    const system = buildSystemPrompt("condensed", undefined, 4);
    assert.match(system, /explicitly allows a stretched metric/);
    assert.match(buildUserPrompt(request(4)), /LEVEL 4 CONTRACT/);
  });
});
