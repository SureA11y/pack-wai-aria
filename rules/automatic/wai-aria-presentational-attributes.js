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
        "Find the element the report names on the page.",
        "Read the attribute the report names, and what the element is for.",
      ],
      passWhen:
        "The element is only for layout, and the attribute can be removed with nothing lost.",
      failWhen:
        "The element stands for a control or a state, which role none or presentation hides: give it the role it means, or remove the attribute (WAI-ARIA 1.2 none and presentation).",
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
    const names = Array.from(dom.getAttributeNames(el) || [])
      .map((n) => String(n).toLowerCase())
      .filter((n) => n.startsWith("aria-") && !GLOBAL.includes(n))
      // A name WAI-ARIA has no attribute of is aria-valid-attr's to report.
      .filter(
        (n) =>
          typeof helpers.aria.isValidAriaAttrName !== "function" ||
          helpers.aria.isValidAriaAttrName(n),
      );
    if (!names.length) continue;
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This element's role hides it, but it has ${names.join(", ")}.`,
        hint: "Give it the role the attribute belongs to, or remove the attribute.",
        i18n: {
          summaryKey: "waiAriaPresentationalAttributes_summary_cantTell",
          hintKey: "waiAriaPresentationalAttributes_hint_cantTell",
          params: { attributes: names.join(", ") },
        },
        data: {
          details: {
            reasonCode: "PRESENTATIONAL_ATTRIBUTE_UNSUPPORTED",
            attributes: names,
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
