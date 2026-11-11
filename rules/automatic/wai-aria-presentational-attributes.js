"use strict";

/**
 * @check wai-aria-presentational-attributes
 * @summary A presentational element carries no state it can't have
 * @applicability
 *   Elements whose role attribute resolves to none or presentation, where
 *   browsers keep that role: not focusable, with no global ARIA attribute
 *   (WAI-ARIA's presentational roles conflict resolution).
 * @expectation
 *   The element has no aria-* attribute other than WAI-ARIA 1.2's global
 *   ones: none and presentation support no state or property of their own.
 *   A person checks what the attribute was meant for, so it is asked about.
 * @reason-codes
 *   - `PRESENTATIONAL_ATTRIBUTE_UNSUPPORTED` (cantTell): an element with role
 *     none or presentation has a state or property neither supports.
 *     Basis: WAI-ARIA 1.2 none and presentation, Supported States and
 *     Properties.
 */

const id = "wai-aria-presentational-attributes";

const meta = {
  title: "A presentational element carries no state it cannot have",
  description:
    "Checks that elements with role none or presentation carry no aria-* attribute but the global ones.",
  i18n: {
    titleKey: "waiAriaPresentationalAttributes_title",
    descriptionKey: "waiAriaPresentationalAttributes_description",
  },
  tags: ["wai-aria", "aria", "atomic", "automatic"],
  wcagSc: [],
  defaultSeverity: "minor",
  type: "automatic",
  defaultConfidence: "high",
  reasonCodes: ["PRESENTATIONAL_ATTRIBUTE_UNSUPPORTED"],
  review: {
    PRESENTATIONAL_ATTRIBUTE_UNSUPPORTED: {
      steps: [
        "Find the element the report names: it has role {{role|none or presentation}}, which hides it from assistive technology, and {{attributes|an aria-* attribute}}, which neither role supports.",
        "Work out what {{attributes|the attribute}} was meant to say: a state such as checked or expanded belongs to a control, such as a checkbox or a button.",
        "Look at what the element is for on the page: only layout, or a control or content a person uses.",
      ],
      passWhen:
        "The element is only for layout, and {{attributes|the attribute}} can be removed with nothing lost. The only aria-* attributes role none and presentation take are the global ones, such as aria-hidden or aria-describedby.",
      failWhen:
        "The element stands for a control or a state, which role {{role|none or presentation}} hides: give it the role {{attributes|the attribute}} belongs to, or remove the attribute (WAI-ARIA 1.2 none and presentation).",
    },
  },
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;
  const { dom } = helpers;
  // WAI-ARIA 1.2's global states and properties, which any element takes.
  const GLOBAL = [
    "aria-atomic",
    "aria-busy",
    "aria-controls",
    "aria-current",
    "aria-describedby",
    "aria-details",
    "aria-dropeffect",
    "aria-flowto",
    "aria-grabbed",
    "aria-hidden",
    "aria-keyshortcuts",
    "aria-label",
    "aria-labelledby",
    "aria-live",
    "aria-owns",
    "aria-relevant",
    "aria-roledescription",
  ];
  // The roles WAI-ARIA 1.2 gives each other state and property to, in their
  // Supported or Required States and Properties (the roles that inherit
  // one left out): what a hint suggests the attribute belongs to.
  const ROLES_OF = {
    "aria-activedescendant": ["combobox", "group", "textbox"],
    "aria-autocomplete": ["combobox", "textbox"],
    "aria-checked": ["checkbox", "menuitemcheckbox", "option", "radio", "switch"],
    "aria-colcount": ["table"],
    "aria-colindex": ["cell", "row"],
    "aria-colspan": ["cell"],
    "aria-disabled": ["button", "gridcell", "group", "link", "menuitem", "scrollbar", "separator", "tab"],
    "aria-errormessage": ["checkbox", "combobox", "gridcell", "listbox", "radiogroup", "slider", "spinbutton", "textbox", "tree"],
    "aria-expanded": ["button", "checkbox", "combobox", "gridcell", "link", "listbox", "menuitem", "row", "rowheader", "tab", "treeitem"],
    "aria-haspopup": ["button", "combobox", "gridcell", "link", "menuitem", "slider", "tab", "textbox", "treeitem"],
    "aria-invalid": ["checkbox", "combobox", "gridcell", "listbox", "radiogroup", "slider", "spinbutton", "textbox", "tree"],
    "aria-level": ["heading", "listitem", "row"],
    "aria-multiline": ["textbox"],
    "aria-multiselectable": ["grid", "listbox", "tablist", "tree"],
    "aria-orientation": ["scrollbar", "separator", "slider", "tablist", "toolbar"],
    "aria-placeholder": ["textbox"],
    "aria-posinset": ["article", "listitem", "menuitem", "option", "radio", "row", "tab"],
    "aria-pressed": ["button"],
    "aria-readonly": ["checkbox", "combobox", "grid", "gridcell", "listbox", "radiogroup", "slider", "spinbutton", "textbox"],
    "aria-required": ["checkbox", "combobox", "gridcell", "listbox", "radiogroup", "spinbutton", "textbox", "tree"],
    "aria-rowcount": ["table"],
    "aria-rowindex": ["cell", "row"],
    "aria-rowspan": ["cell"],
    "aria-selected": ["gridcell", "option", "row", "tab"],
    "aria-setsize": ["article", "listitem", "menuitem", "option", "radio", "row", "tab"],
    "aria-sort": ["columnheader", "rowheader"],
    "aria-valuemax": ["scrollbar", "separator", "slider", "spinbutton"],
    "aria-valuemin": ["scrollbar", "separator", "slider", "spinbutton"],
    "aria-valuenow": ["meter", "scrollbar", "separator", "slider", "spinbutton"],
    "aria-valuetext": ["separator", "spinbutton"],
  };
  // Whether an element is in the flat tree: neither it nor any ancestor is
  // a shadow host's child that no slot takes (flatParentElement gives
  // undefined for one).
  const isRendered = (el) => {
    let p = el;
    for (let guard = 0; guard < 500; guard++) {
      p = helpers.flatParentElement(p);
      if (p === undefined) return false;
      if (!p) return true;
    }
    return true;
  };
  const nodes = helpers
    .queryAllSmart('[role~="none" i],[role~="presentation" i]')
    .filter((el) =>
      ["none", "presentation"].includes(helpers.aria.getExplicitRole(el)),
    )
    .filter((el) => !helpers.isPresentationalRoleIgnored(el))
    // A child of a shadow host that no slot takes, or inside one, is not
    // rendered.
    .filter((el) => isRendered(el))
    // Hidden from assistive technology, its attributes reach no one.
    .filter((el) => helpers.isIncludedInAccessibilityTree(el, ctx));
  if (!nodes.length) {
    return {
      ruleId: rule.ruleId,
      outcome: "notApplicable",
      severity: "minor",
      occurrences: [],
    };
  }
  const occurrences = [];
  for (const el of nodes) {
    const names = [...(dom.getAttributeNames(el) || [])]
      .map((n) => String(n).toLowerCase())
      .filter((n) => n.startsWith("aria-") && !GLOBAL.includes(n))
      // A name WAI-ARIA has no attribute of is aria-valid-attr's to report.
      .filter(
        (n) =>
          typeof helpers.aria.isValidAriaAttrName !== "function" ||
          helpers.aria.isValidAriaAttrName(n),
      );
    if (!names.length) continue;
    const role = helpers.aria.getExplicitRole(el);
    const attributes = names.join(", ");
    // The roles that take every one of the attributes, as a hint names them.
    const roles = names
      .map((n) => ROLES_OF[n] || [])
      .reduce((acc, list) => acc.filter((r) => list.includes(r)));
    const shown = roles.slice(0, 6).join(", ");
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This element's role="${role}" hides it from assistive technology, but it has ${attributes}, which role ${role} does not support.`,
        hint: shown
          ? `Give it a role that takes ${attributes} (${shown}), or remove the attribute.`
          : "Give it the role the attribute belongs to, or remove the attribute.",
        i18n: {
          summaryKey: "waiAriaPresentationalAttributes_summary_cantTell",
          hintKey: shown
            ? "waiAriaPresentationalAttributes_hint_cantTell_roles"
            : "waiAriaPresentationalAttributes_hint_cantTell",
          params: shown ? { attributes, role, roles: shown } : { attributes, role },
        },
        data: {
          details: {
            reasonCode: "PRESENTATIONAL_ATTRIBUTE_UNSUPPORTED",
            attributes: names,
            role,
            ...(roles.length ? { roles } : {}),
          },
        },
      }),
    );
  }
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
