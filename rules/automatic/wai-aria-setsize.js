"use strict";

/**
 * @check wai-aria-setsize
 * @summary aria-setsize is the number of items in the set
 * @applicability
 *   Elements in the accessibility tree with an integer aria-setsize other
 *   than -1 (unknown) and a role, grouped into sets: the elements of the
 *   same role with the same parent element. An element's role is the one
 *   its role attribute gives, or else the one its tag gives (HTML-AAM)
 *   where that role supports aria-setsize: an <li> is a listitem, an
 *   <option> an option, an <article> an article, a <tr> a row.
 * @expectation
 *   "Authors MUST set the value of aria-setsize to an integer equal to the
 *   number of items in the set": every item of a set gives the same size,
 *   and no size is below the number of items the set has on the page, its
 *   items counted by their role attribute or their tag. A value that is no
 *   integer is aria-valid-attr-value's to report.
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
  // The roles WAI-ARIA 1.2 gives aria-setsize to: a role an element's tag
  // gives it makes it an item only if it is one of these.
  const SET_ROLES = [
    "article",
    "comment",
    "listitem",
    "menuitem",
    "menuitemcheckbox",
    "menuitemradio",
    "option",
    "radio",
    "row",
    "tab",
    "treeitem",
  ];
  // The role an element's tag gives it (HTML-AAM): core's lookup, and for
  // the tags it leaves out, or an older core without it, the ones an item
  // of a set most often is.
  const tagRoleOf = (el) => {
    let role = "";
    try {
      if (typeof helpers.aria.getNativeRoleForElement === "function") {
        role = helpers.aria.getNativeRoleForElement(el) || "";
      }
    } catch {
      role = "";
    }
    if (role) return role;
    const tag = String(dom.localName(el) || "").toLowerCase();
    if (tag === "select") {
      const size = parseInt(String(dom.getAttribute(el, "size") || ""), 10);
      const multiple = dom.getAttribute(el, "multiple") != null;
      return multiple || size > 1 ? "listbox" : "combobox";
    }
    const BY_TAG = {
      article: "article",
      datalist: "listbox",
      dialog: "dialog",
      li: "listitem",
      menu: "list",
      ol: "list",
      option: "option",
      table: "table",
      tr: "row",
      ul: "list",
    };
    return Object.prototype.hasOwnProperty.call(BY_TAG, tag) ? BY_TAG[tag] : "";
  };
  // An element's role: the one core reads (its role attribute, or a
  // control's tag), or else the one its tag gives, if items of a set take it.
  const roleOf = (el) => {
    try {
      const info = helpers.getRoleInfo(el, ctx);
      if (info && info.role) return info.role;
    } catch {
      // Read the tag's role below.
    }
    const role = tagRoleOf(el);
    return SET_ROLES.includes(role) ? role : "";
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
  // How a message names an element: its tag, and its id.
  const describe = (el) => {
    const elId = String(dom.getAttribute(el, "id") || "").trim();
    return `<${String(dom.localName(el) || "").toLowerCase()}${elId ? ` id="${elId}"` : ""}>`;
  };
  const occurrences = [];
  for (const [parent, byRole] of sets) {
    // The set, as a message names it: its role and its parent element.
    const where = parent ? describe(parent) : "the page";
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
      // The size most of the set's items give, where more than half give
      // one and it is not below the items on the page: the near-right
      // value for the others.
      let usual = null;
      for (const size of sizes) {
        if (size >= count && list.filter((i) => i.size === size).length * 2 > list.length) usual = size;
      }
      for (const item of list) {
        if (item.size < count) {
          const params = { setsize: String(item.size), count: String(count), role, parent: where };
          occurrences.push(
            helpers.reportOccurrence(item.el, {
              summary: `This item's aria-setsize (${item.size}) is below the ${count} items of its set on the page, the elements of role ${role} in ${where}.`,
              hint: `Set aria-setsize to the number of items in the whole set, at least ${count}, or to -1 if it is not known.`,
              i18n: {
                summaryKey: "waiAriaSetsize_summary_fail_below",
                hintKey: "waiAriaSetsize_hint_fail_below",
                params,
              },
              data: {
                details: { reasonCode: "SETSIZE_BELOW_ITEMS", setsize: item.size, count, role, parent: where },
              },
            }),
          );
        } else if (sizes.length > 1) {
          const others = sizes.filter((x) => x !== item.size).join(", ");
          const suggest = usual !== null && usual !== item.size;
          const params = {
            setsize: String(item.size),
            others,
            sizes: sizes.join(", "),
            role,
            parent: where,
            ...(suggest ? { suggestion: String(usual) } : {}),
          };
          occurrences.push(
            helpers.reportOccurrence(item.el, {
              summary: `This item's aria-setsize is ${item.size}, and other items of its set, the elements of role ${role} in ${where}, give ${others}.`,
              hint: suggest
                ? `Set it to ${usual}, as most items of its set do, if the whole set has ${usual} items: every item gives the same aria-setsize.`
                : "Give every item of the set the same aria-setsize, the number of items in the whole set.",
              i18n: {
                summaryKey: "waiAriaSetsize_summary_fail_inconsistent",
                hintKey: suggest
                  ? "waiAriaSetsize_hint_fail_inconsistentUsual"
                  : "waiAriaSetsize_hint_fail_inconsistent",
                params,
              },
              data: {
                details: {
                  reasonCode: "SETSIZE_INCONSISTENT",
                  setsize: item.size,
                  sizes,
                  role,
                  parent: where,
                  ...(suggest ? { suggestion: usual } : {}),
                },
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
