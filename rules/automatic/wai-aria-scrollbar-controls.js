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
  // Edits (insert, delete, replace, or swap two neighbours) from a to b.
  const editDistance = (a, b) => {
    const d = [];
    for (let i = 0; i <= a.length; i++) {
      d.push([i]);
      for (let j = 1; j <= b.length; j++) {
        if (i === 0) {
          d[0].push(j);
          continue;
        }
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        let v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          v = Math.min(v, d[i - 2][j - 2] + 1);
        }
        d[i].push(v);
      }
    }
    return d[a.length][b.length];
  };
  // Why a scrollbar has no aria-controls: an empty one, or an attribute
  // that misspells it (aria-control, aria-contols), which WAI-ARIA doesn't
  // know.
  const causeOf = (el) => {
    if (dom.hasAttribute(el, "aria-controls")) return { key: "empty", params: {} };
    const misspelt = [...(dom.getAttributeNames(el) || [])]
      .map((n) => String(n).toLowerCase())
      .find(
        (n) =>
          n.startsWith("aria-") &&
          n !== "aria-controls" &&
          !(typeof helpers.aria.isValidAriaAttrName === "function" && helpers.aria.isValidAriaAttrName(n)) &&
          editDistance(n.slice(5), "controls") <= 2,
      );
    return misspelt ? { key: "misspelled", params: { attribute: misspelt } } : { key: "", params: {} };
  };
  const SUMMARIES = {
    "": () => "This scrollbar does not say what it scrolls.",
    empty: () => "This scrollbar's aria-controls is empty, so it does not say what it scrolls.",
    misspelled: (p) => `This scrollbar has ${p.attribute}, which is not an ARIA attribute (did you mean aria-controls?), so it does not say what it scrolls.`,
  };
  const HINTS = {
    "": () => "Add aria-controls with the id of the content it scrolls.",
    empty: () => "Put the id of the content it scrolls in aria-controls.",
    misspelled: (p) => `Rename ${p.attribute} to aria-controls, with the id of the content it scrolls.`,
  };
  const occurrences = nodes
    .filter((el) => !String(dom.getAttribute(el, "aria-controls") || "").trim())
    .map((el) => {
      const cause = causeOf(el);
      const suffix = cause.key ? `_${cause.key}` : "";
      return helpers.reportOccurrence(el, {
        summary: SUMMARIES[cause.key](cause.params),
        hint: HINTS[cause.key](cause.params),
        i18n: {
          summaryKey: `waiAriaScrollbarControls_summary_fail${suffix}`,
          hintKey: `waiAriaScrollbarControls_hint_fail${suffix}`,
          params: cause.params,
        },
        data: {
          details: {
            reasonCode: "SCROLLBAR_CONTROLS_MISSING",
            ...(cause.key ? { cause: cause.key } : {}),
            ...(cause.params.attribute ? { attribute: cause.params.attribute } : {}),
          },
        },
      });
    });
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
