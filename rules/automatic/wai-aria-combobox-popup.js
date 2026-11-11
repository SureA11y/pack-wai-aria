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
  const tagOf = (el) => String(helpers.dom.localName(el) || "").toLowerCase();
  // How a message names an element: its tag, and its id.
  const describe = (el) => {
    const elId = String(helpers.dom.getAttribute(el, "id") || "").trim();
    return `<${tagOf(el)}${elId ? ` id="${elId}"` : ""}>`;
  };
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
  // The popup role a misspelt role token is nearest, if one is near enough
  // (one edit for up to five letters, two for a longer token) and no other.
  const nearPopupRole = (token) => {
    if (token.length < 4) return "";
    const limit = token.length <= 5 ? 1 : 2;
    const near = POPUP_ROLES.filter((r) => editDistance(token, r) <= limit);
    return near.length === 1 ? near[0] : "";
  };
  // An element of a popup role inside one aria-controls names: the popup,
  // where aria-controls names the element around it.
  const popupInside = (ref) => {
    let found = null;
    try {
      const all = [...(helpers.dom.querySelectorAll(ref, "[role], select") || [])];
      found = all.find(
        (d) => POPUP_ROLES.includes(roleOf(d)) && helpers.isIncludedInAccessibilityTree(d, ctx),
      );
    } catch {
      found = null;
    }
    return found || null;
  };
  // Why the element aria-controls names is no popup: what the message says
  // of it, and how to fix it.
  const causeOf = (refs) => {
    for (const ref of refs) {
      const inner = popupInside(ref);
      if (inner) {
        const innerId = String(helpers.dom.getAttribute(inner, "id") || "").trim();
        return {
          key: "inside",
          hintKey: innerId ? "insideId" : "inside",
          popup: ref,
          params: { role: roleOf(inner), inner: describe(inner), id: innerId },
        };
      }
    }
    const ref = refs[0];
    const roleAttr = String(helpers.dom.getAttribute(ref, "role") || "").trim();
    const explicit = helpers.aria.getExplicitRole(ref);
    const role = roleOf(ref);
    if (roleAttr && !explicit) {
      const token = roleAttr.toLowerCase().split(/\s+/)[0];
      const suggestion = nearPopupRole(token);
      return suggestion
        ? { key: "invalidRoleNear", hintKey: "invalidRoleNear", popup: ref, params: { value: roleAttr, suggestion } }
        : { key: "invalidRole", hintKey: "fail", popup: ref, params: { value: roleAttr } };
    }
    if (role) return { key: "fail", hintKey: "fail", popup: ref, params: { role } };
    let native = "";
    try {
      native =
        typeof helpers.aria.getNativeRoleForElement === "function"
          ? helpers.aria.getNativeRoleForElement(ref) || ""
          : "";
    } catch {
      native = "";
    }
    if (native) return { key: "native", hintKey: "fail", popup: ref, params: { role: native } };
    return { key: "noRole", hintKey: "fail", popup: ref, params: {} };
  };
  const SUMMARIES = {
    fail: (p) => `This combobox controls ${p.element}, of role ${p.role}, not a listbox, tree, grid or dialog.`,
    native: (p) => `This combobox controls ${p.element}, whose tag gives it role ${p.role}, not a listbox, tree, grid or dialog.`,
    noRole: (p) => `This combobox controls ${p.element}, which has no role, so it is not a listbox, tree, grid or dialog.`,
    invalidRole: (p) => `This combobox controls ${p.element}, whose role="${p.value}" is not an ARIA role, so it is not a listbox, tree, grid or dialog.`,
    invalidRoleNear: (p) => `This combobox controls ${p.element}, whose role="${p.value}" is not an ARIA role (did you mean "${p.suggestion}"?), so it is not a listbox, tree, grid or dialog.`,
    inside: (p) => `This combobox controls ${p.element}, the element around its popup, not the popup: the ${p.role} is ${p.inner}, inside it.`,
  };
  const HINTS = {
    fail: () => "Give the popup the role of what it is (listbox for a list of options), or point aria-controls at the popup.",
    invalidRoleNear: (p) => `Correct the role to role="${p.suggestion}".`,
    inside: (p) => `Point aria-controls at the ${p.role} itself: give it an id, and put that id in aria-controls.`,
    insideId: (p) => `Point aria-controls at the ${p.role} itself: aria-controls="${p.id}".`,
  };
  const occurrences = boxes
    .filter((b) => !b.refs.some((ref) => POPUP_ROLES.includes(roleOf(ref))))
    .map(({ el, refs }) => {
      const popupRole = roleOf(refs[0]) || "none";
      const controls = String(helpers.dom.getAttribute(el, "aria-controls") || "").trim();
      const cause = causeOf(refs);
      const params = { ...cause.params, element: describe(cause.popup) };
      return helpers.reportOccurrence(el, {
        summary: SUMMARIES[cause.key](params),
        hint: HINTS[cause.hintKey](params),
        i18n: {
          summaryKey: cause.key === "fail" ? "waiAriaComboboxPopup_summary_fail" : `waiAriaComboboxPopup_summary_fail_${cause.key}`,
          hintKey: cause.hintKey === "fail" ? "waiAriaComboboxPopup_hint_fail" : `waiAriaComboboxPopup_hint_fail_${cause.hintKey}`,
          params,
        },
        data: {
          details: {
            reasonCode: "COMBOBOX_POPUP_ROLE",
            popupRole,
            controls,
            popup: params.element,
            cause: cause.key,
            ...(params.suggestion ? { suggestion: params.suggestion } : {}),
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
