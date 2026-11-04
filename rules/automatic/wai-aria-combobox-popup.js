"use strict";

/**
 * @check wai-aria-combobox-popup
 * @summary A combobox's popup is a listbox, tree, grid or dialog
 * @applicability
 *   Elements whose role attribute resolves to combobox, in the
 *   accessibility tree, whose aria-controls names an element on the page.
 * @expectation
 *   One of the elements its aria-controls names has role listbox, tree,
 *   grid or dialog: "Authors MUST ensure the popup element associated with a
 *   combobox has a role of listbox, tree, grid, or dialog", and "MUST set
 *   aria-controls on a combobox element to a value that refers to the
 *   combobox popup element". An aria-controls that names no element is
 *   aria-valid-attr-value's to report.
 * @reason-codes
 *   - `COMBOBOX_POPUP_ROLE` (fail): no element a combobox's aria-controls
 *     names has role listbox, tree, grid or dialog.
 *     Basis: WAI-ARIA 1.2 combobox (MUST).
 */

const id = "wai-aria-combobox-popup";

const meta = {
  title: "A combobox's popup is a listbox, tree, grid or dialog",
  description:
    "Checks that the element a combobox's aria-controls names has role listbox, tree, grid or dialog.",
  i18n: {
    titleKey: "waiAriaComboboxPopup_title",
    descriptionKey: "waiAriaComboboxPopup_description",
  },
  tags: ["wai-aria", "aria", "atomic", "automatic"],
  wcagSc: [],
  defaultSeverity: "serious",
  type: "automatic",
  defaultConfidence: "high",
  reasonCodes: ["COMBOBOX_POPUP_ROLE"],
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;
  const POPUP_ROLES = ["listbox", "tree", "grid", "dialog"];
  const roleOf = (el) => {
    try {
      const info = helpers.getRoleInfo(el, ctx);
      return (info && info.role) || "";
    } catch {
      return "";
    }
  };
  const refsOf = (el) => {
    try {
      const value = helpers.dom.getAttribute(el, "aria-controls") || "";
      return (helpers.resolveIdRefs(value, ctx, {}, el).refs || []).filter(Boolean);
    } catch {
      return [];
    }
  };
  const boxes = helpers
    .queryAllSmart('[role~="combobox" i][aria-controls]')
    .filter((el) => helpers.aria.getExplicitRole(el) === "combobox")
    .filter((el) => helpers.isIncludedInAccessibilityTree(el, ctx))
    .map((el) => ({ el, refs: refsOf(el) }))
    .filter((b) => b.refs.length);
  if (!boxes.length) {
    return {
      ruleId: rule.ruleId,
      outcome: "notApplicable",
      severity: "minor",
      occurrences: [],
    };
  }
  const occurrences = boxes
    .filter((b) => !b.refs.some((ref) => POPUP_ROLES.includes(roleOf(ref))))
    .map(({ el, refs }) => {
      const popupRole = roleOf(refs[0]) || "none";
      const controls = String(helpers.dom.getAttribute(el, "aria-controls") || "").trim();
      return helpers.reportOccurrence(el, {
        summary: `This combobox controls an element of role ${popupRole}, not a listbox, tree, grid or dialog.`,
        hint: "Give the popup the role of what it is (listbox for a list of options), or point aria-controls at the popup.",
        i18n: {
          summaryKey: "waiAriaComboboxPopup_summary_fail",
          hintKey: "waiAriaComboboxPopup_hint_fail",
          params: { role: popupRole },
        },
        data: {
          details: { reasonCode: "COMBOBOX_POPUP_ROLE", popupRole, controls },
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
