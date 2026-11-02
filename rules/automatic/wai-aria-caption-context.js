"use strict";

/**
 * @check wai-aria-caption-context
 * @summary A caption is in a figure or a table
 * @applicability
 *   Elements whose role attribute resolves to caption and that are in the
 *   accessibility tree.
 * @expectation
 *   The caption is a direct child of an element of role figure, table, grid
 *   or treegrid. WAI-ARIA 1.2 says authors SHOULD ensure it, so a caption
 *   elsewhere is asked about, not failed.
 * @reason-codes
 *   - `CAPTION_CONTEXT_MISSING` (cantTell): a caption's parent is not a
 *     figure, table, grid or treegrid.
 *     Basis: WAI-ARIA 1.2 caption (SHOULD).
 */

const id = "wai-aria-caption-context";

const meta = {
  title: "A caption is in a figure or a table",
  description:
    "Checks that each element with role caption is a direct child of a figure, table, grid or treegrid.",
  i18n: {
    titleKey: "waiAriaCaptionContext_title",
    descriptionKey: "waiAriaCaptionContext_description",
  },
  tags: ["wai-aria", "aria", "atomic", "automatic"],
  wcagSc: [],
  defaultSeverity: "minor",
  type: "automatic",
  defaultConfidence: "high",
  reasonCodes: ["CAPTION_CONTEXT_MISSING"],
  review: {
    CAPTION_CONTEXT_MISSING: {
      steps: [
        "Find the caption the report names on the page.",
        "Look at what it captions: the figure, table or grid it describes.",
      ],
      passWhen:
        "The caption describes the element it is in, and that element is a figure or a table.",
      failWhen:
        "The caption is outside the figure or table it describes, so it is not tied to it (WAI-ARIA 1.2 caption).",
    },
  },
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;
  const captions = helpers
    .queryAllSmart('[role~="caption" i]')
    .filter((el) => helpers.aria.getExplicitRole(el) === "caption")
    .filter((el) => helpers.isIncludedInAccessibilityTree(el, ctx));
  if (!captions.length) {
    return {
      ruleId: rule.ruleId,
      outcome: "notApplicable",
      severity: "minor",
      occurrences: [],
    };
  }
  const CONTEXT = ["figure", "table", "grid", "treegrid"];
  const roleOf = (el) => {
    if (!el) return "";
    const tag = String(helpers.dom.localName(el) || "").toLowerCase();
    try {
      const info = helpers.getRoleInfo(el, ctx);
      if (info && info.role) return info.role;
    } catch {
      // read as no role
    }
    return tag === "figure" ? "figure" : tag === "table" ? "table" : "";
  };
  const occurrences = captions
    .filter((el) => !CONTEXT.includes(roleOf(helpers.flatParentElement(el))))
    .map((el) =>
      helpers.reportOccurrence(el, {
        summary: "This caption is not in a figure or a table.",
        hint: "Make it a direct child of the figure or table it describes, and name that element by it with aria-labelledby.",
        i18n: {
          summaryKey: "waiAriaCaptionContext_summary_cantTell",
          hintKey: "waiAriaCaptionContext_hint_cantTell",
        },
        data: { details: { reasonCode: "CAPTION_CONTEXT_MISSING" } },
      }),
    );
  if (!occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: "pass",
      severity: "minor",
      occurrences: [],
    };
  }
  return {
    ruleId: rule.ruleId,
    outcome: "cantTell",
    severity: rule.defaultSeverity,
    occurrences,
  };
}

module.exports = { id, meta, runInPage };
