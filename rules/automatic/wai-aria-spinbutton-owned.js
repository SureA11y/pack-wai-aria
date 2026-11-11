"use strict";

/**
 * @check wai-aria-spinbutton-owned
 * @summary A spinbutton owns only a textbox and up to two buttons
 * @applicability
 *   Elements whose role attribute resolves to spinbutton, in the
 *   accessibility tree, that own elements: their children in the
 *   accessibility tree, through aria-owns or with only elements of no role
 *   (generic, none) between.
 * @expectation
 *   It owns at most one textbox and at most two buttons, and nothing else:
 *   "Authors MAY create a spinbutton with children or owned elements, but
 *   MUST limit those elements to a textbox and/or two buttons".
 * @reason-codes
 *   - `SPINBUTTON_OWNS_OTHER` (fail): a spinbutton owns an element of
 *     another role than textbox or button.
 *     Basis: WAI-ARIA 1.2 spinbutton (MUST).
 *   - `SPINBUTTON_OWNS_TOO_MANY` (fail): a spinbutton owns more than one
 *     textbox or more than two buttons.
 *     Basis: WAI-ARIA 1.2 spinbutton (MUST).
 */

const id = "wai-aria-spinbutton-owned";

const meta = {
  title: "A spinbutton owns only a textbox and up to two buttons",
  description:
    "Checks that each spinbutton owns no element but one textbox and up to two buttons.",
  i18n: {
    titleKey: "waiAriaSpinbuttonOwned_title",
    descriptionKey: "waiAriaSpinbuttonOwned_description",
  },
  tags: ["wai-aria", "aria", "atomic", "automatic"],
  wcagSc: [],
  defaultSeverity: "moderate",
  type: "automatic",
  defaultConfidence: "high",
  reasonCodes: ["SPINBUTTON_OWNS_OTHER", "SPINBUTTON_OWNS_TOO_MANY"],
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;
  const roleOf = (el) => {
    try {
      const info = helpers.getRoleInfo(el, ctx);
      return (info && info.role) || "";
    } catch {
      return "";
    }
  };
  const LOOK_THROUGH = ["", "generic", "none", "presentation"];
  const isElement = (n) => !!n && n.nodeType === 1;
  const ownedIds = new Set();
  for (const owner of helpers.queryAllSmart("[aria-owns]")) {
    try {
      const refs =
        helpers.resolveIdRefs(helpers.dom.getAttribute(owner, "aria-owns"), ctx, {}, owner)
          .refs || [];
      for (const ref of refs) if (ref) ownedIds.add(ref);
    } catch {
      // An aria-owns that can't be read owns nothing here.
    }
  }
  // An element's children in the accessibility tree: those it owns through
  // aria-owns, and its descendants with a role, looked for through elements
  // with none; an element another owns is that owner's.
  const childrenOf = (el) => {
    const out = [];
    const walk = (node, depth) => {
      if (depth > 50) return;
      for (const child of helpers.flatChildNodes(node) || []) {
        if (!isElement(child) || ownedIds.has(child)) continue;
        if (!helpers.isIncludedInAccessibilityTree(child, ctx)) continue;
        if (LOOK_THROUGH.includes(roleOf(child))) walk(child, depth + 1);
        else out.push(child);
      }
    };
    walk(el, 0);
    try {
      const refs =
        helpers.resolveIdRefs(helpers.dom.getAttribute(el, "aria-owns") || "", ctx, {}, el)
          .refs || [];
      for (const ref of refs) if (isElement(ref) && !out.includes(ref)) out.push(ref);
    } catch {
      // No aria-owns, or one that can't be read.
    }
    return out;
  };
  const spinbuttons = helpers
    .queryAllSmart('[role~="spinbutton" i]')
    .filter((el) => helpers.aria.getExplicitRole(el) === "spinbutton")
    .filter((el) => helpers.isIncludedInAccessibilityTree(el, ctx))
    .map((el) => ({ el, children: childrenOf(el) }))
    .filter((s) => s.children.length);
  if (!spinbuttons.length) {
    return {
      ruleId: rule.ruleId,
      outcome: "notApplicable",
      severity: "minor",
      occurrences: [],
    };
  }
  const occurrences = [];
  for (const { el, children } of spinbuttons) {
    for (const child of children) {
      const role = roleOf(child);
      if (role === "textbox" || role === "button") continue;
      const element = `<${String(helpers.dom.localName(child) || "").toLowerCase()}>`;
      occurrences.push(
        helpers.reportOccurrence(child, {
          summary: `A spinbutton owns this ${element}, of role ${role}, though it may own only a textbox and buttons.`,
          hint: "Move it out of the spinbutton, or make it the spinbutton's text box or one of its two buttons.",
          i18n: {
            summaryKey: "waiAriaSpinbuttonOwned_summary_fail_other",
            hintKey: "waiAriaSpinbuttonOwned_hint_fail_other",
            params: { role, element },
          },
          data: { details: { reasonCode: "SPINBUTTON_OWNS_OTHER", role, element } },
        }),
      );
    }
    const textboxes = children.filter((c) => roleOf(c) === "textbox").length;
    const buttons = children.filter((c) => roleOf(c) === "button").length;
    if (textboxes > 1 || buttons > 2) {
      occurrences.push(
        helpers.reportOccurrence(el, {
          summary: `This spinbutton owns ${textboxes} text boxes and ${buttons} buttons, more than one text box and two buttons.`,
          hint: "Keep one text box and the increment and decrement buttons in it, and move the rest out.",
          i18n: {
            summaryKey: "waiAriaSpinbuttonOwned_summary_fail_tooMany",
            hintKey: "waiAriaSpinbuttonOwned_hint_fail_tooMany",
            params: { textboxes: String(textboxes), buttons: String(buttons) },
          },
          data: {
            details: { reasonCode: "SPINBUTTON_OWNS_TOO_MANY", textboxes, buttons },
          },
        }),
      );
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
