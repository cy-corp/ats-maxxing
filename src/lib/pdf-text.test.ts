import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toPdfSafeText } from "./pdf-text";

describe("toPdfSafeText", () => {
  it("maps dashes Helvetica cannot draw onto ASCII hyphen", () => {
    const input = [
      "high\u2011impact",
      "on\u2010premises",
      "fax\u00ADrelated",
      "carrier\u2012grade",
      "end\u2212to\u2212end",
    ].join(" ");
    assert.equal(
      toPdfSafeText(input),
      "high-impact on-premises fax-related carrier-grade end-to-end",
    );
  });

  it("keeps en dashes and em dashes, which WinAnsi can draw", () => {
    assert.equal(toPdfSafeText("15\u201340 \u2014"), "15\u201340 \u2014");
  });
});
