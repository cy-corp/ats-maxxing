import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractPreserveHints,
  mergePreservedSourceFields,
} from "./preserve-source";

const SOURCE = `
Yago Andrade
Email: yagodaouddev@gmail.com
Github: github.com/yagodaoud
Linkedin: linkedin.com/in/yago-andrade-dev
Portfolio: yago-dev-portfolio.vercel.app/en
`;

describe("contact preservation", () => {
  it("reads GitHub and portfolio when they have no protocol", () => {
    const hints = extractPreserveHints(SOURCE);
    assert.equal(hints.github, "github.com/yagodaoud");
    assert.equal(hints.portfolio, "yago-dev-portfolio.vercel.app/en");
    assert.match(hints.linkedin ?? "", /yago-andrade-dev/);
    assert.equal(hints.email, "yagodaouddev@gmail.com");
  });

  it("fills a dropped GitHub link without replacing the portfolio", () => {
    const merged = mergePreservedSourceFields(
      {
        contact: {
          name: "Yago Andrade",
          email: "",
          phone: "",
          location: "",
          linkedin: "",
          github: "",
          portfolio: "yago-dev-portfolio.vercel.app/en",
        },
        certifications: [],
      },
      SOURCE,
    );
    assert.equal(merged.contact.github, "github.com/yagodaoud");
    assert.equal(
      merged.contact.portfolio,
      "yago-dev-portfolio.vercel.app/en",
    );
    assert.equal(merged.contact.email, "yagodaouddev@gmail.com");
  });
});
