"use strict";

/**
 * @check wai-aria-scrollbar-controls
 * @summary A scrollbar says what it scrolls
 * @applicability
 *   Elements whose role attribute resolves to scrollbar and that are in the
 *   accessibility tree.
 * @expectation
 *   The element has aria-controls naming the content it scrolls: WAI-ARIA
 *   1.2 lists it among a scrollbar's required properties, with no default.
 * @reason-codes
 *   - `SCROLLBAR_CONTROLS_MISSING` (fail): a scrollbar has no aria-controls.
 *     Basis: WAI-ARIA 1.2 scrollbar, Required States and Properties (MUST).
 */

const id = "wai-aria-scrollbar-controls";

const meta = {
  title: "A scrollbar says what it scrolls",
  description:
    "Checks that each scrollbar has aria-controls, which WAI-ARIA requires of the role.",
  i18n: {
    titleKey: "waiAriaScrollbarControls_title",
    descriptionKey: "waiAriaScrollbarControls_description",
  },
  tags: ["wai-aria", "aria", "atomic", "automatic"],
  wcagSc: [],
  defaultSeverity: "moderate",
  type: "automatic",
  defaultConfidence: "high",
  reasonCodes: ["SCROLLBAR_CONTROLS_MISSING"],
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;
  const { dom } = helpers;
  const nodes = helpers
    .queryAllSmart('[role~="scrollbar" i]')
    .filter((el) => helpers.aria.getExplicitRole(el) === "scrollbar")
    .filter((el) => helpers.isIncludedInAccessibilityTree(el, ctx));
  if (!nodes.length) {
    return {
      ruleId: rule.ruleId,
      outcome: "notApplicable",
      severity: "minor",
      occurrences: [],
    };
  }
  const occurrences = nodes
    .filter((el) => !String(dom.getAttribute(el, "aria-controls") || "").trim())
    .map((el) =>
      helpers.reportOccurrence(el, {
        summary: "This scrollbar does not say what it scrolls.",
        hint: "Add aria-controls with the id of the content it scrolls.",
        i18n: {
          summaryKey: "waiAriaScrollbarControls_summary_fail",
          hintKey: "waiAriaScrollbarControls_hint_fail",
        },
        data: { details: { reasonCode: "SCROLLBAR_CONTROLS_MISSING" } },
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
    outcome: "fail",
    severity: rule.defaultSeverity,
    occurrences,
  };
}

module.exports = { id, meta, runInPage };
