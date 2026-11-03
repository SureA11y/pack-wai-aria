"use strict";

/**
 * @check wai-aria-feed-articles
 * @summary A feed owns articles, and only articles
 * @applicability
 *   Elements whose role attribute resolves to feed and that are in the
 *   accessibility tree.
 * @expectation
 *   The feed owns at least one article, and every element it owns has the
 *   article role (an <article>, or role="article"). What it owns are its
 *   children in the accessibility tree: those in the flat tree that no other
 *   element claims with aria-owns, and those it claims itself. Elements with
 *   no role of their own, generic or none by HTML-AAM (a <div>, an unnamed
 *   <section>, an <a> with no href, an <img alt="">), are looked through, as
 *   the accessibility tree leaves them out. A finding names the owned
 *   element's role (heading, paragraph, list), not its tag.
 * @reason-codes
 *   - `FEED_ARTICLE_MISSING` (fail): the feed owns no article.
 *     Basis: WAI-ARIA 1.2 feed, Required Owned Elements (MUST).
 *   - `FEED_CHILD_NOT_ARTICLE` (fail): the feed owns an element of another
 *     role.
 *     Basis: WAI-ARIA 1.2 feed, Required Owned Elements (MUST).
 */

const id = "wai-aria-feed-articles";

const meta = {
  title: "A feed owns articles, and only articles",
  description:
    "Checks that each feed owns at least one article and nothing of another role.",
  i18n: {
    titleKey: "waiAriaFeedArticles_title",
    descriptionKey: "waiAriaFeedArticles_description",
  },
  tags: ["wai-aria", "aria", "atomic", "automatic"],
  wcagSc: [],
  defaultSeverity: "moderate",
  type: "automatic",
  defaultConfidence: "high",
  reasonCodes: ["FEED_ARTICLE_MISSING", "FEED_CHILD_NOT_ARTICLE"],
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;
  const feeds = helpers
    .queryAllSmart('[role~="feed" i]')
    .filter((el) => helpers.aria.getExplicitRole(el) === "feed")
    .filter((el) => helpers.isIncludedInAccessibilityTree(el, ctx));
  if (!feeds.length) {
    return {
      ruleId: rule.ruleId,
      outcome: "notApplicable",
      severity: "minor",
      occurrences: [],
    };
  }
  const roleOf = (el) => {
    try {
      const info = helpers.getRoleInfo(el, ctx);
      return (info && info.role) || "";
    } catch {
      return "";
    }
  };
  const tagOf = (el) => String(helpers.dom.localName(el) || "").toLowerCase();
  const hasName = (el) => {
    try {
      const info = helpers.getAccessibleNameInfo(el, ctx);
      return !!(info && info.present);
    } catch {
      return false;
    }
  };
  // HTML elements with no role of their own (generic, or none): a feed is
  // looked through them.
  const GENERIC_TAGS = [
    "div",
    "span",
    "b",
    "i",
    "u",
    "s",
    "small",
    "big",
    "em",
    "strong",
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
    "slot",
    "template",
  ];
  // The implicit role HTML-AAM gives the elements that have one, whatever
  // their context. An element in neither list (a <pre>, a <tt>, a
  // <picture>, a <label>, a <canvas>) has no WAI-ARIA role, generic or
  // none, and is looked through.
  const IMPLICIT_ROLES = {
    address: "group",
    blockquote: "blockquote",
    caption: "caption",
    code: "code",
    datalist: "listbox",
    dd: "definition",
    del: "deletion",
    details: "group",
    dfn: "term",
    dialog: "dialog",
    dt: "term",
    fieldset: "group",
    figure: "figure",
    form: "form",
    h1: "heading",
    h2: "heading",
    h3: "heading",
    h4: "heading",
    h5: "heading",
    h6: "heading",
    hgroup: "group",
    hr: "separator",
    ins: "insertion",
    li: "listitem",
    main: "main",
    math: "math",
    menu: "list",
    meter: "meter",
    nav: "navigation",
    ol: "list",
    optgroup: "group",
    option: "option",
    output: "status",
    p: "paragraph",
    progress: "progressbar",
    search: "search",
    sub: "subscript",
    sup: "superscript",
    table: "table",
    time: "time",
    ul: "list",
  };
  // Whether an element is scoped to sectioning content or main, where
  // HTML-AAM makes a <header> or <footer> generic, not banner or
  // contentinfo, and an unnamed <aside> generic, not complementary.
  const SECTIONING_TAGS = ["article", "aside", "main", "nav", "section"];
  const SECTIONING_ROLES = [
    "article",
    "complementary",
    "main",
    "navigation",
    "region",
  ];
  const inSectioning = (el) => {
    let p = helpers.flatParentElement(el);
    for (let guard = 0; p && guard < 200; guard++) {
      if (SECTIONING_TAGS.includes(tagOf(p))) return true;
      if (SECTIONING_ROLES.includes(helpers.aria.getExplicitRole(p))) return true;
      p = helpers.flatParentElement(p);
    }
    return false;
  };
  // An HTML element's implicit role, by HTML-AAM: "" for one that has none
  // or is generic, "none" for an <img alt="">.
  const nativeRole = (el, tag) => {
    if (tag === "article") return "article";
    if (tag.includes("-") || GENERIC_TAGS.includes(tag)) return "";
    if (tag === "img") {
      const alt = helpers.dom.getAttribute(el, "alt");
      return alt === "" && !hasName(el) ? "none" : "img";
    }
    if (tag === "svg") {
      return helpers.flatChildElements(el).length || hasName(el)
        ? "graphics-document"
        : "";
    }
    if (tag === "section") return hasName(el) ? "region" : "";
    if (tag === "aside") {
      return !inSectioning(el) || hasName(el) ? "complementary" : "";
    }
    if (tag === "header") return inSectioning(el) ? "" : "banner";
    if (tag === "footer") return inSectioning(el) ? "" : "contentinfo";
    return Object.prototype.hasOwnProperty.call(IMPLICIT_ROLES, tag)
      ? IMPLICIT_ROLES[tag]
      : "";
  };
  const roleOfChild = (el) => {
    if (tagOf(el) === "article") return "article";
    let role = roleOf(el);
    // A role of none that browsers ignore (the element is focusable, or has
    // a global attribute) leaves the element its implicit role.
    if (
      (role === "none" || role === "presentation") &&
      helpers.isPresentationalRoleIgnored(el)
    ) {
      role = "";
    }
    if (!role || (role === "generic" && !helpers.aria.getExplicitRole(el))) {
      role = nativeRole(el, tagOf(el));
    }
    return role;
  };
  // The elements another element claims with aria-owns, each by the first
  // that does: they are that element's children in the accessibility tree,
  // not their parent's.
  const claimedBy = new Map();
  for (const owner of helpers.queryAllSmart("[aria-owns]")) {
    let refs = [];
    try {
      refs = helpers.resolveIdRefs(
        helpers.dom.getAttribute(owner, "aria-owns"),
        ctx,
        {},
        owner,
      ).refs;
    } catch {
      refs = [];
    }
    for (const ref of refs || []) {
      if (ref && ref !== owner && !claimedBy.has(ref)) claimedBy.set(ref, owner);
    }
  }
  // An element's children in the accessibility tree: its children in the
  // flat tree that no other element claims with aria-owns, then those it
  // claims itself.
  const axChildren = (el) => {
    const out = helpers
      .flatChildElements(el)
      .filter((c) => !claimedBy.has(c) || claimedBy.get(c) === el);
    for (const [ref, owner] of claimedBy) {
      if (owner === el && !out.includes(ref)) out.push(ref);
    }
    return out;
  };
  // The elements a feed owns: its children in the accessibility tree,
  // looking through those with no role of their own.
  const owned = (el, depth, seen) => {
    const out = [];
    for (const child of axChildren(el)) {
      if (seen.has(child)) continue;
      seen.add(child);
      if (!helpers.isIncludedInAccessibilityTree(child, ctx)) continue;
      const role = roleOfChild(child);
      if (
        !role ||
        role === "generic" ||
        role === "none" ||
        role === "presentation"
      ) {
        if (depth < 8) out.push(...owned(child, depth + 1, seen));
      } else out.push({ el: child, role });
    }
    return out;
  };
  const occurrences = [];
  for (const feed of feeds) {
    const children = owned(feed, 0, new Set([feed]));
    if (!children.some((c) => c.role === "article")) {
      occurrences.push(
        helpers.reportOccurrence(feed, {
          summary: "This feed owns no article.",
          hint: 'Put each item of the feed in an <article>, or give it role="article".',
          i18n: {
            summaryKey: "waiAriaFeedArticles_summary_fail_missing",
            hintKey: "waiAriaFeedArticles_hint_fail_missing",
          },
          data: { details: { reasonCode: "FEED_ARTICLE_MISSING" } },
        }),
      );
    }
    for (const c of children.filter((x) => x.role !== "article")) {
      occurrences.push(
        helpers.reportOccurrence(c.el, {
          summary: "A feed owns this element, which is not an article.",
          hint: "Move it out of the feed, or put it inside one of its articles.",
          i18n: {
            summaryKey: "waiAriaFeedArticles_summary_fail_child",
            hintKey: "waiAriaFeedArticles_hint_fail_child",
            params: { role: c.role },
          },
          data: {
            details: { reasonCode: "FEED_CHILD_NOT_ARTICLE", role: c.role },
          },
        }),
      );
    }
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
    outcome: "fail",
    severity: rule.defaultSeverity,
    occurrences,
  };
}

module.exports = { id, meta, runInPage };
