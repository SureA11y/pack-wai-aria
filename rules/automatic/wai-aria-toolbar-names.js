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
  const { dom } = helpers;
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
  const describe = (el) => {
    const elId = String(dom.getAttribute(el, "id") || "").trim();
    return `<${String(dom.localName(el) || "").toLowerCase()}${elId ? ` id="${elId}"` : ""}>`;
  };
  // The one id on the page a missing id is a near misspelling of.
  const nearId = (missing) => {
    if (missing.length < 3) return "";
    let ids = [];
    try {
      ids = helpers.queryAllSmart("[id]").map((e) => String(dom.getAttribute(e, "id") || ""));
    } catch {
      ids = [];
    }
    const limit = missing.length <= 5 ? 1 : 2;
    const near = [...new Set(ids)].filter((x) => x && editDistance(missing, x) <= limit);
    return near.length === 1 ? near[0] : "";
  };
  // Why an unnamed toolbar has no name, where its markup tries to give one:
  // an aria-labelledby that names no element, or elements with no text; an
  // empty aria-label; or a misspelt aria-label or aria-labelledby, which
  // WAI-ARIA doesn't know.
  const causeOf = (el) => {
    const labelledby = String(dom.getAttribute(el, "aria-labelledby") || "").trim();
    if (labelledby) {
      let resolved = { refs: [], missing: [] };
      try {
        resolved = helpers.resolveIdRefs(labelledby, ctx, {}, el) || resolved;
      } catch {
        resolved = { refs: [], missing: [] };
      }
      const refs = (resolved.refs || []).filter(Boolean);
      const missing = resolved.missing || [];
      if (!refs.length && missing.length) {
        const suggestion = missing.length === 1 ? nearId(missing[0]) : "";
        return suggestion
          ? { key: "labelledbyNear", params: { ids: missing.join(" "), suggestion } }
          : { key: "labelledbyMissing", params: { ids: missing.join(" ") } };
      }
      if (refs.length) {
        return { key: "labelledbyEmpty", params: { element: refs.map(describe).join(", ") } };
      }
    }
    if (dom.hasAttribute(el, "aria-label") && !String(dom.getAttribute(el, "aria-label") || "").trim()) {
      return { key: "labelEmpty", params: {} };
    }
    for (const n of [...(dom.getAttributeNames(el) || [])].map((x) => String(x).toLowerCase())) {
      if (!n.startsWith("aria-") || n === "aria-label" || n === "aria-labelledby") continue;
      if (typeof helpers.aria.isValidAriaAttrName === "function" && helpers.aria.isValidAriaAttrName(n)) continue;
      const suffix = n.slice(5);
      const limit = suffix.length <= 5 ? 1 : 2;
      const near = ["label", "labelledby"].filter((a) => editDistance(suffix, a) <= limit);
      if (near.length === 1) {
        return { key: "misspelled", params: { attribute: n, suggestion: `aria-${near[0]}` } };
      }
    }
    return { key: "", params: {} };
  };
  const SUMMARIES = {
    "": (p) => `This toolbar has no name, and the page has ${p.count} toolbars.`,
    labelledbyMissing: (p) => `This toolbar has no name, and the page has ${p.count} toolbars: its aria-labelledby names the id "${p.ids}", which no element on the page has.`,
    labelledbyNear: (p) => `This toolbar has no name, and the page has ${p.count} toolbars: its aria-labelledby names the id "${p.ids}", which no element on the page has (did you mean "${p.suggestion}"?).`,
    labelledbyEmpty: (p) => `This toolbar has no name, and the page has ${p.count} toolbars: its aria-labelledby points at ${p.element}, which has no text.`,
    labelEmpty: (p) => `This toolbar has no name, and the page has ${p.count} toolbars: its aria-label is empty.`,
    misspelled: (p) => `This toolbar has no name, and the page has ${p.count} toolbars: it has ${p.attribute}, which is not an ARIA attribute (did you mean ${p.suggestion}?).`,
  };
  const HINTS = {
    "": () => "Name each toolbar, with aria-label or aria-labelledby, so they can be told apart.",
    labelledbyMissing: () => "Point aria-labelledby at the id of the element whose text names the toolbar, or name it with aria-label.",
    labelledbyNear: (p) => `Correct the id in aria-labelledby to "${p.suggestion}".`,
    labelledbyEmpty: () => "Put the toolbar's name in the element aria-labelledby points at, or name it with aria-label.",
    labelEmpty: () => "Put the toolbar's name in aria-label, so the toolbars can be told apart.",
    misspelled: (p) => `Rename ${p.attribute} to ${p.suggestion}.`,
  };
  const occurrences = toolbars
    .filter((t) => !hasName(t))
    .map((el) => {
      const cause = causeOf(el);
      const params = { count, ...cause.params };
      const suffix = cause.key ? `_${cause.key}` : "";
      return helpers.reportOccurrence(el, {
        summary: SUMMARIES[cause.key](params),
        hint: HINTS[cause.key](params),
        i18n: {
          summaryKey: `waiAriaToolbarNames_summary_fail${suffix}`,
          hintKey: `waiAriaToolbarNames_hint_fail${suffix}`,
          params,
        },
        data: {
          details: {
            reasonCode: "TOOLBAR_NAME_MISSING",
            count,
            ...(cause.key ? { cause: cause.key } : {}),
            ...cause.params,
          },
        },
      });
    });
  return {
    ruleId: rule.ruleId,
    outcome: occurrences.length ? "fail" : "pass",
    severity: occurrences.length ? rule.defaultSeverity : "minor",
    occurrences,
  };
}

module.exports = { id, meta, runInPage };
