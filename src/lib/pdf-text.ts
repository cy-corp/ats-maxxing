/**
 * Helvetica's WinAnsi encoding has no glyph for several Unicode dashes.
 * pdfkit maps those to .notdef (zero width), and react-pdf strips U+00AD
 * entirely, so "high-impact" exports as "highimpact" or "high impact".
 * En dash (U+2013) and em dash (U+2014) are in WinAnsi and must be kept.
 */
const UNSUPPORTED_HYPHEN =
  /[\u00AD\u2010\u2011\u2012\u2212\uFE58\uFE63\uFF0D]/g;

export function toPdfSafeText(value: string): string {
  return value.replace(UNSUPPORTED_HYPHEN, "-");
}
