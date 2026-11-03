"use strict";

/**
 * @check wai-aria-caption-context
 * @summary A caption is in a figure or a table
 * @applicability
 *   Elements whose role attribute resolves to caption and that are in the
 *   accessibility tree.
 * @expectation
 *   The caption is a child of an element of role figure, table, grid or
 *   treegrid in the accessibility tree: through aria-owns, or with only
 *   generic or presentational wrappers between. WAI-ARIA 1.2 says authors SHOULD ensure it, so a caption
 *   elsewhere is asked about, not failed.
 * @reason-codes
 *   - `CAPTION_CONTEXT_MISSING` (cantTell): a caption's parent is not a
 *     figure, table, grid or treegrid.
 *     Basis: WAI-ARIA 1.2 caption (SHOULD).
 */

const id = "wai-aria-caption-context";

const meta = {
  title: "A caption is in a figure or a table",
  description:
    "Checks that each element with role caption is a child of a figure, table, grid or treegrid in the accessibility tree.",
  i18n: {
    titleKey: "waiAriaCaptionContext_title",
    descriptionKey: "waiAriaCaptionContext_description",
  },
  tags: ["wai-aria", "aria", "atomic", "automatic"],
  wcagSc: [],
  defaultSeverity: "minor",
  type: "automatic",
  defaultConfidence: "high",
  reasonCodes: ["CAPTION_CONTEXT_MISSING"],
  review: {
    CAPTION_CONTEXT_MISSING: {
      steps: [
        "Find the caption the report names on the page.",
        "Look at what it captions: the figure, table or grid it describes.",
      ],
      passWhen:
        "The caption describes the element it is in, and that element is a figure or a table.",
      failWhen:
        "The caption is outside the figure or table it describes, so it is not tied to it (WAI-ARIA 1.2 caption).",
    },
  },
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;
  const captions = helpers
    .queryAllSmart('[role~="caption" i]')
    .filter((el) => helpers.aria.getExplicitRole(el) === "caption")
    .filter((el) => helpers.isIncludedInAccessibilityTree(el, ctx));
  if (!captions.length) {
    return {
      ruleId: rule.ruleId,
      outcome: "notApplicable",
      severity: "minor",
      occurrences: [],
    };
  }
  const CONTEXT = ["figure", "table", "grid", "treegrid"];
  // HTML elements with no role of their own (generic, or none), as
  // HTML-AAM gives them: the accessibility tree looks through them. Every
  // other element has a role, which is the caption's parent if it is the
  // nearest.
  const GENERIC_TAGS = [
    "div",
    "span",
    "b",
    "i",
    "u",
    "small",
    "big",
    "mark",
    "font",
    "center",
    "bdi",
    "bdo",
    "data",
    "q",
    "cite",
    "abbr",
    "kbd",
    "samp",
    "var",
    "wbr",
    "br",
    "pre",
    "picture",
    "slot",
    "template",
  ];
  const tagOf = (el) => String(helpers.dom.localName(el) || "").toLowerCase();
  const hasName = (el) => {
    try {
      const info = helpers.getAccessibleNameInfo(el, ctx);
      return !!(info && info.present);
    } catch {
      return false;
    }
  };
  // Whether browsers keep an element's role where its markup makes it
  // none: it is focusable, or has a global ARIA attribute.
  const keepsRole = (el) => {
    try {
      return (
        (helpers.aria.hasGlobalAriaAttr && helpers.aria.hasGlobalAriaAttr(el)) ||
        !!(helpers.getFocusableInfo && helpers.getFocusableInfo(el).focusable)
      );
    } catch {
      return false;
    }
  };
  // An element's role in the accessibility tree: "" for one it looks
  // through, the tag for a native role that is no context of a caption.
  const roleOf = (el) => {
    if (!el) return "";
    const tag = tagOf(el);
    const explicit = helpers.aria.getExplicitRole(el);
    const unnamedLandmark =
      (explicit === "region" || explicit === "form") && !hasName(el);
    if (explicit && explicit !== "none" && explicit !== "presentation" && !unnamedLandmark) {
      return explicit;
    }
    // A role of none that browsers ignore leaves the element its own.
    if ((explicit === "none" || explicit === "presentation") && !keepsRole(el)) return "";
    if (tag === "figure") return "figure";
    if (tag === "table") return "table";
    if (tag.includes("-") || GENERIC_TAGS.includes(tag)) return "";
    if (tag === "section" && !hasName(el)) return "";
    if (tag === "a" && !helpers.dom.hasAttribute(el, "href")) return "";
    return tag;
  };
  // Who claims an element with aria-owns, the first that does: its parent
  // in the accessibility tree.
  const ownerOf = new Map();
  for (const owner of helpers.queryAllSmart("[aria-owns]")) {
    let refs = [];
    try {
      refs = helpers.resolveIdRefs(helpers.dom.getAttribute(owner, "aria-owns"), ctx, {}, owner).refs || [];
    } catch {
      refs = [];
    }
    for (const ref of refs) if (ref && !ownerOf.has(ref)) ownerOf.set(ref, owner);
  }
  // A caption's parent in the accessibility tree, as browsers build it: the
  // element that owns it, or its nearest ancestor with a role, looking
  // through the generic and presentational wrappers between.
  const axParent = (el) => {
    if (ownerOf.has(el)) return ownerOf.get(el);
    let p = helpers.flatParentElement(el);
    for (let guard = 0; p && guard < 200; guard++) {
      const role = roleOf(p);
      if (role && role !== "generic") return p;
      p = helpers.flatParentElement(p);
    }
    return null;
  };
  const occurrences = captions
    .filter((el) => !CONTEXT.includes(roleOf(axParent(el))))
    .map((el) =>
      helpers.reportOccurrence(el, {
        summary: "This caption is not in a figure or a table.",
        hint: "Make it a direct child of the figure or table it describes, and name that element by it with aria-labelledby.",
        i18n: {
          summaryKey: "waiAriaCaptionContext_summary_cantTell",
          hintKey: "waiAriaCaptionContext_hint_cantTell",
        },
        data: { details: { reasonCode: "CAPTION_CONTEXT_MISSING" } },
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
    outcome: "cantTell",
    severity: rule.defaultSeverity,
    occurrences,
  };
}

module.exports = { id, meta, runInPage };
