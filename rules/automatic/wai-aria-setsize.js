"use strict";

/**
 * @check wai-aria-setsize
 * @summary aria-setsize is the number of items in the set
 * @applicability
 *   Elements in the accessibility tree with an integer aria-setsize other
 *   than -1 (unknown), grouped into sets: the elements of the same role
 *   with the same parent element.
 * @expectation
 *   "Authors MUST set the value of aria-setsize to an integer equal to the
 *   number of items in the set": every item of a set gives the same size,
 *   and no size is below the number of items the set has on the page. A
 *   value that is no integer is aria-valid-attr-value's to report.
 * @reason-codes
 *   - `SETSIZE_BELOW_ITEMS` (fail): an item's aria-setsize is below the
 *     number of items its set has on the page.
 *   - `SETSIZE_INCONSISTENT` (fail): the items of a set give different
 *     sizes.
 *     Basis for both: WAI-ARIA 1.2 aria-setsize (MUST).
 */

const id = "wai-aria-setsize";

const meta = {
  title: "aria-setsize is the number of items in the set",
  description:
    "Checks that the items of a set all give the same aria-setsize, and none below the number of items the set has on the page.",
  i18n: {
    titleKey: "waiAriaSetsize_title",
    descriptionKey: "waiAriaSetsize_description",
  },
  tags: ["wai-aria", "aria", "atomic", "automatic"],
  wcagSc: [],
  defaultSeverity: "moderate",
  type: "automatic",
  defaultConfidence: "high",
  reasonCodes: ["SETSIZE_BELOW_ITEMS", "SETSIZE_INCONSISTENT"],
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;
  const { dom } = helpers;
  const roleOf = (el) => {
    try {
      const info = helpers.getRoleInfo(el, ctx);
      return (info && info.role) || "";
    } catch {
      return "";
    }
  };
  const sizeOf = (el) => {
    const v = String(dom.getAttribute(el, "aria-setsize") || "").trim();
    return /^-?\d+$/.test(v) ? parseInt(v, 10) : null;
  };
  const items = helpers
    .queryAllSmart("[aria-setsize]")
    .filter((el) => helpers.isIncludedInAccessibilityTree(el, ctx))
    .map((el) => ({ el, size: sizeOf(el), role: roleOf(el) }))
    .filter((i) => i.size !== null && i.size !== -1 && i.size >= 1 && i.role);
  if (!items.length) {
    return {
      ruleId: rule.ruleId,
      outcome: "notApplicable",
      severity: "minor",
      occurrences: [],
    };
  }
  // A set: the items of one role under one parent element. Its size on the
  // page counts its items with no aria-setsize too.
  const sets = new Map();
  for (const item of items) {
    const parent = helpers.flatParentElement(item.el) || null;
    const key = parent;
    if (!sets.has(key)) sets.set(key, new Map());
    const byRole = sets.get(key);
    if (!byRole.has(item.role)) byRole.set(item.role, []);
    byRole.get(item.role).push(item);
  }
  const occurrences = [];
  for (const [parent, byRole] of sets) {
    for (const [role, list] of byRole) {
      const siblings = parent
        ? [...(helpers.flatChildNodes(parent) || [])].filter(
            (n) =>
              n &&
              n.nodeType === 1 &&
              roleOf(n) === role &&
              helpers.isIncludedInAccessibilityTree(n, ctx),
          ).length
        : list.length;
      const count = Math.max(siblings, list.length);
      const sizes = [...new Set(list.map((i) => i.size))];
      for (const item of list) {
        if (item.size < count) {
          occurrences.push(
            helpers.reportOccurrence(item.el, {
              summary: `This item's aria-setsize (${item.size}) is below the ${count} items of its set on the page.`,
              hint: "Set aria-setsize to the number of items in the whole set, or to -1 if it is not known.",
              i18n: {
                summaryKey: "waiAriaSetsize_summary_fail_below",
                hintKey: "waiAriaSetsize_hint_fail_below",
                params: { setsize: String(item.size), count: String(count) },
              },
              data: {
                details: { reasonCode: "SETSIZE_BELOW_ITEMS", setsize: item.size, count, role },
              },
            }),
          );
        } else if (sizes.length > 1) {
          occurrences.push(
            helpers.reportOccurrence(item.el, {
              summary: `The items of this set give different sizes: ${sizes.join(", ")}.`,
              hint: "Give every item of the set the same aria-setsize, the number of items in the whole set.",
              i18n: {
                summaryKey: "waiAriaSetsize_summary_fail_inconsistent",
                hintKey: "waiAriaSetsize_hint_fail_inconsistent",
                params: { sizes: sizes.join(", ") },
              },
              data: {
                details: { reasonCode: "SETSIZE_INCONSISTENT", setsize: item.size, sizes, role },
              },
            }),
          );
        }
      }
    }
  }
  return {
    ruleId: rule.ruleId,
    outcome: occurrences.length ? "fail" : "pass",
    severity: occurrences.length ? rule.defaultSeverity : "minor",
    occurrences,
  };
}

module.exports = { id, meta, runInPage };
