"use strict";

/**
 * @check wai-aria-toolbar-names
 * @summary Each of several toolbars has a name
 * @applicability
 *   Elements whose role attribute resolves to toolbar and that are in the
 *   accessibility tree, on a page with more than one.
 * @expectation
 *   Each has an accessible name. WAI-ARIA 1.2's role table doesn't mark
 *   toolbar "Accessible Name Required", but its text does: "Authors MUST
 *   supply a label on each toolbar when the application contains more than
 *   one toolbar". (A form's name, which form's text requires as well, is
 *   core's landmark-role-name-present's.)
 * @reason-codes
 *   - `TOOLBAR_NAME_MISSING` (fail): a toolbar, on a page with more than
 *     one, has no accessible name.
 *     Basis: WAI-ARIA 1.2 toolbar (MUST).
 */

const id = "wai-aria-toolbar-names";

const meta = {
  title: "Each of several toolbars has a name",
  description:
    "Checks that each toolbar has an accessible name where the page has more than one.",
  i18n: {
    titleKey: "waiAriaToolbarNames_title",
    descriptionKey: "waiAriaToolbarNames_description",
  },
  tags: ["wai-aria", "aria", "atomic", "automatic"],
  wcagSc: [],
  defaultSeverity: "moderate",
  type: "automatic",
  defaultConfidence: "high",
  reasonCodes: ["TOOLBAR_NAME_MISSING"],
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;
  const hasName = (el) => {
    try {
      const info = helpers.getAccessibleNameInfo(el, ctx);
      return !!(info && info.present);
    } catch {
      return true;
    }
  };
  const toolbars = helpers
    .queryAllSmart('[role~="toolbar" i]')
    .filter((el) => helpers.aria.getExplicitRole(el) === "toolbar")
    .filter((el) => helpers.isIncludedInAccessibilityTree(el, ctx));
  if (toolbars.length < 2) {
    return {
      ruleId: rule.ruleId,
      outcome: "notApplicable",
      severity: "minor",
      occurrences: [],
    };
  }
  const count = String(toolbars.length);
  const occurrences = toolbars
    .filter((t) => !hasName(t))
    .map((el) =>
      helpers.reportOccurrence(el, {
        summary: `This toolbar has no name, and the page has ${count} toolbars.`,
        hint: "Name each toolbar, with aria-label or aria-labelledby, so they can be told apart.",
        i18n: {
          summaryKey: "waiAriaToolbarNames_summary_fail",
          hintKey: "waiAriaToolbarNames_hint_fail",
          params: { count },
        },
        data: { details: { reasonCode: "TOOLBAR_NAME_MISSING", count } },
      }),
    );
  return {
    ruleId: rule.ruleId,
    outcome: occurrences.length ? "fail" : "pass",
    severity: occurrences.length ? rule.defaultSeverity : "minor",
    occurrences,
  };
}

module.exports = { id, meta, runInPage };
