"use strict";

/**
 * @check wai-aria-feed-articles
 * @summary A feed owns articles, and only articles
 * @applicability
 *   Elements whose role attribute resolves to feed and that are in the
 *   accessibility tree.
 * @expectation
 *   The feed owns at least one article, and every element it owns has the
 *   article role (an <article> with no other role, or role="article"). What it owns are its
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
    em: "emphasis",
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
    s: "deletion",
    search: "search",
    strong: "strong",
    sub: "subscript",
    sup: "superscript",
    table: "table",
    textarea: "textbox",
    time: "time",
    ul: "list",
  };
  // Whether an element has an ancestor of the given tags or roles. HTML-AAM
  // makes a <header> or <footer> generic, not banner or contentinfo, inside
  // sectioning content or main, and an unnamed <aside> generic, not
  // complementary, inside sectioning content only (in main it stays one).
  const SECTIONING_TAGS = ["article", "aside", "nav", "section"];
  const SECTIONING_ROLES = ["article", "complementary", "navigation", "region"];
  const hasAncestor = (el, tags, roles) => {
    let p = helpers.flatParentElement(el);
    for (let guard = 0; p && guard < 200; guard++) {
      if (tags.includes(tagOf(p))) return true;
      if (roles.includes(helpers.aria.getExplicitRole(p))) return true;
      p = helpers.flatParentElement(p);
    }
    return false;
  };
  const inSectioning = (el) =>
    hasAncestor(el, [...SECTIONING_TAGS, "main"], [...SECTIONING_ROLES, "main"]);
  const inSectioningContent = (el) =>
    hasAncestor(el, SECTIONING_TAGS, SECTIONING_ROLES);
  // Elements whose content is fallback, or another document, not their
  // children in the accessibility tree: a feed doesn't look into them.
  const OPAQUE_TAGS = ["audio", "embed", "frame", "iframe", "object", "video"];
  // An HTML element's implicit role, by HTML-AAM: "" for one that has none
  // or is generic, "none" for an <img alt="">. parentRole is the role of
  // its parent in the accessibility tree.
  const nativeRole = (el, tag, parentRole) => {
    if (tag === "article") return "article";
    // A <li> is a listitem only in a list; elsewhere (in a feed, or in a
    // list whose role is none) the accessibility tree looks through it.
    if (tag === "li") return parentRole === "list" ? "listitem" : "";
    // A <video>, <audio>, <object>, <iframe> or <embed> has no WAI-ARIA
    // role, but is in the accessibility tree: it is named by its tag. So is
    // a <dl>, whose terms and definitions are its own children, not the
    // feed's.
    if (OPAQUE_TAGS.includes(tag) || tag === "dl") return tag;
    if ((tag === "a" || tag === "area") && helpers.dom.hasAttribute(el, "href")) {
      return "link";
    }
    if (tag === "button" || tag === "summary") return "button";
    if (tag === "input") {
      const type = String(helpers.dom.getAttribute(el, "type") || "");
      if (type.toLowerCase() === "hidden") return "";
      // Password, date, color and file inputs have no WAI-ARIA role, but
      // are in the accessibility tree: they are named by their tag.
      return (helpers.aria.getInputRole && helpers.aria.getInputRole(el)) || tag;
    }
    if (tag === "select") {
      const size = parseInt(helpers.dom.getAttribute(el, "size") || "", 10);
      return helpers.dom.hasAttribute(el, "multiple") || size > 1
        ? "listbox"
        : "combobox";
    }
    if (tag.includes("-") || GENERIC_TAGS.includes(tag)) return "";
    if (tag === "img") {
      // alt="" makes it none, unless browsers ignore that (it is focusable,
      // or has a global attribute), as they ignore an explicit none.
      const alt = helpers.dom.getAttribute(el, "alt");
      return alt === "" && !hasName(el) && !keepsRole(el) ? "none" : "img";
    }
    if (tag === "svg") {
      return helpers.flatChildElements(el).length || hasName(el)
        ? "graphics-document"
        : "";
    }
    if (tag === "section") return hasName(el) ? "region" : "";
    if (tag === "aside") {
      return !inSectioningContent(el) || hasName(el) ? "complementary" : "";
    }
    if (tag === "header") return inSectioning(el) ? "" : "banner";
    if (tag === "footer") return inSectioning(el) ? "" : "contentinfo";
    return Object.prototype.hasOwnProperty.call(IMPLICIT_ROLES, tag)
      ? IMPLICIT_ROLES[tag]
      : "";
  };
  // Whether browsers keep an element's role where its markup makes it
  // none: it is focusable, or has a global ARIA attribute.
  const keepsRole = (el) => {
    try {
      // The globals WAI-ARIA 1.2 deprecates don't count, as browsers don't
      // count them (core 1.15 reads exceptDeprecated).
      return (
        (helpers.aria.hasGlobalAriaAttr &&
          helpers.aria.hasGlobalAriaAttr(el, { exceptDeprecated: true })) ||
        !!(helpers.getFocusableInfo && helpers.getFocusableInfo(el).focusable)
      );
    } catch {
      return false;
    }
  };
  // Whether a <summary> is its <details>'s summary: the first <summary>
  // child of a <details>.
  const isDetailsSummary = (el) => {
    const parent = helpers.flatParentElement(el);
    if (!parent || tagOf(parent) !== "details") return false;
    return helpers.flatChildElements(parent).find((c) => tagOf(c) === "summary") === el;
  };
  // An explicit role replaces the implicit one, on an <article> as on any
  // element: <article role="button"> is a button, and <article role="none">
  // nothing a feed owns, unless browsers ignore that none.
  const roleOfChild = (el, parentRole) => {
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
      role = nativeRole(el, tagOf(el), parentRole);
    }
    // Where an element's own role depends on its context (HTML-AAM): with
    // no explicit role, an <area> is a link of the image that uses its map,
    // in the image's place in the tree, never a child of the map's parent;
    // a <summary> is a button as its <details>'s summary only; an
    // <img alt=""> that browsers can't make none (it is focusable, or has
    // a global attribute) is an image.
    if (!helpers.aria.getExplicitRole(el)) {
      const tag = tagOf(el);
      if (tag === "area") return "none";
      if (tag === "summary" && !isDetailsSummary(el)) return "";
      if (tag === "img" && (role === "none" || role === "presentation") && keepsRole(el)) {
        return "img";
      }
    }
    // An explicit region or form needs a name to be one (Core-AAM): an
    // unnamed role="region" or role="form" is exposed with the next role
    // its role attribute names, or its element's own, a <div>'s generic,
    // and looked through like it. A <form> keeps its own role, as browsers
    // expose it.
    const explicit = helpers.aria.getExplicitRole(el);
    if (
      (explicit === "region" || explicit === "form") &&
      role === explicit &&
      !hasName(el)
    ) {
      const tokens = String(helpers.dom.getAttribute(el, "role") || "")
        .trim()
        .toLowerCase()
        .split(/\s+/);
      const next = tokens
        .slice(tokens.indexOf(explicit) + 1)
        .find(
          (t) =>
            t !== "region" &&
            t !== "form" &&
            typeof helpers.aria.isValidConcreteRole === "function" &&
            helpers.aria.isValidConcreteRole(t),
        );
      role = next || nativeRole(el, tagOf(el), parentRole);
    }
    return role;
  };
  // The elements another element claims with aria-owns, each by the first
  // that does: they are that element's children in the accessibility tree,
  // not their parent's.
  const claimedBy = new Map();
  const hasAncestorElement = (el, anc) => {
    let p = el;
    for (let guard = 0; p && guard < 200; guard++) {
      if (p === anc) return true;
      p = helpers.flatParentElement(p);
    }
    return false;
  };
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
    // A feed's claim is the feed's whoever else claims the element, as
    // Chromium gives it; between others, the first claim holds.
    const isFeed = feeds.includes(owner);
    for (const ref of refs || []) {
      // An element can't own its own ancestor: browsers ignore that claim.
      if (!ref || hasAncestorElement(owner, ref)) continue;
      const held = claimedBy.get(ref);
      if (!held || (isFeed && !feeds.includes(held))) claimedBy.set(ref, owner);
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
  // Whether an element is hidden by visibility alone (hidden or collapse),
  // which its descendants can override; not by display:none, which they
  // can't.
  const isVisibilityHidden = (el) => {
    try {
      const cs = helpers.computedStyle(el) || {};
      const visibility = String(cs.visibility || "");
      const ariaHidden = String(helpers.dom.getAttribute(el, "aria-hidden") || "");
      return (
        (visibility === "hidden" || visibility === "collapse") &&
        String(cs.display || "") !== "none" &&
        ariaHidden.trim().toLowerCase() !== "true"
      );
    } catch {
      return false;
    }
  };
  const isContentHidden = (el) => {
    try {
      const cs = helpers.computedStyle(el) || {};
      return String(cs.contentVisibility || cs["content-visibility"] || "") === "hidden";
    } catch {
      return false;
    }
  };
  // Whether an element is hidden by itself, not by an element around it.
  const isSelfHidden = (el) => {
    try {
      const cs = helpers.computedStyle(el) || {};
      const ariaHidden = String(helpers.dom.getAttribute(el, "aria-hidden") || "");
      return (
        ariaHidden.trim().toLowerCase() === "true" ||
        helpers.dom.hasAttribute(el, "hidden") ||
        String(cs.display || "") === "none" ||
        String(cs.visibility || "") === "hidden"
      );
    } catch {
      return true;
    }
  };
  // The elements a feed owns: its children in the accessibility tree,
  // looking through those with no role of their own.
  const owned = (el, elRole, depth, seen) => {
    const out = [];
    for (const child of axChildren(el)) {
      if (seen.has(child)) continue;
      seen.add(child);
      // content-visibility:hidden keeps the element's box and hides what
      // is in it: browsers leave it out of the tree.
      if (isContentHidden(child)) continue;
      // An element the feed claims with aria-owns moves into the feed: an
      // aria-hidden around where it sits in the DOM no longer hides it.
      const included =
        helpers.isIncludedInAccessibilityTree(child, ctx) ||
        (claimedBy.get(child) === el && !isSelfHidden(child));
      if (!included) {
        // visibility:hidden hides an element and not the descendants that
        // set visibility:visible: they are the feed's still.
        if (depth < 200 && isVisibilityHidden(child)) {
          out.push(...owned(child, elRole, depth + 1, seen));
        }
        continue;
      }
      const role = roleOfChild(child, elRole);
      if (
        !role ||
        role === "generic" ||
        role === "none" ||
        role === "presentation"
      ) {
        // Looked through at any depth, as browsers do; the guard only stops
        // a pathological tree.
        if (depth < 200 && !OPAQUE_TAGS.includes(tagOf(child))) {
          out.push(...owned(child, role, depth + 1, seen));
        }
      } else out.push({ el: child, role });
    }
    return out;
  };
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
  // What hides an element by itself, as a message says it, or "".
  const hiderOf = (el) => {
    try {
      if (String(helpers.dom.getAttribute(el, "aria-hidden") || "").trim().toLowerCase() === "true") {
        return 'aria-hidden="true"';
      }
      if (helpers.dom.hasAttribute(el, "hidden")) return "the hidden attribute";
      const cs = helpers.computedStyle(el) || {};
      if (String(cs.display || "") === "none") return "display: none";
      if (String(cs.visibility || "") === "hidden") return "visibility: hidden";
      if (String(cs.contentVisibility || cs["content-visibility"] || "") === "hidden") {
        return "content-visibility: hidden";
      }
    } catch {
      return "";
    }
    return "";
  };
  // Why a feed owns no article, where the markup shows one was meant: an
  // article in it that something hides, articles inside an element the feed
  // owns instead, or a role that misspells article.
  const missingCause = (feed, children) => {
    let inside = [];
    try {
      inside = [...(helpers.dom.querySelectorAll(feed, "article, [role]") || [])];
    } catch {
      inside = [];
    }
    const articles = inside.filter((x) => {
      const explicit = helpers.aria.getExplicitRole(x);
      return explicit ? explicit === "article" : tagOf(x) === "article";
    });
    for (const a of articles) {
      for (let p = a, guard = 0; p && p !== feed && guard < 200; guard++) {
        const hider = hiderOf(p);
        if (hider) {
          return p === a
            ? { key: "missingHidden", params: { element: describe(a), hider } }
            : { key: "missingHiddenBy", params: { element: describe(a), ancestor: describe(p), hider } };
        }
        p = helpers.flatParentElement(p);
      }
    }
    for (const a of articles) {
      const wrapper = children.find((c) => c.role !== "article" && hasAncestorElement(a, c.el));
      if (wrapper) {
        return { key: "missingNested", params: { element: describe(wrapper.el), role: wrapper.role } };
      }
    }
    for (const x of inside) {
      const value = String(helpers.dom.getAttribute(x, "role") || "").trim();
      const token = value.toLowerCase().split(/\s+/)[0];
      if (!token || token === "article" || helpers.aria.getExplicitRole(x)) continue;
      if (editDistance(token, "article") <= 2) {
        return { key: "missingMisspelled", params: { element: describe(x), value } };
      }
    }
    return { key: "missing", params: {} };
  };
  const MISSING = {
    missing: {
      summary: () => "This feed owns no article.",
      hint: () => 'Put each item of the feed in an <article>, or give it role="article".',
    },
    missingHidden: {
      summary: (p) => `This feed owns no article: its ${p.element} has ${p.hider}, which hides it from assistive technology.`,
      hint: () => "Show the feed's articles to assistive technology: remove what hides them, or leave the feed out until they load.",
    },
    missingHiddenBy: {
      summary: (p) => `This feed owns no article: its ${p.element} is inside ${p.ancestor}, which has ${p.hider} and hides it from assistive technology.`,
      hint: () => "Show the feed's articles to assistive technology: remove what hides them, or leave the feed out until they load.",
    },
    missingNested: {
      summary: (p) => `This feed owns no article: its articles are inside ${p.element}, of role ${p.role}, which the feed owns instead.`,
      hint: (p) => `Make the articles the feed's own: take them out of ${p.element}, or give it role="none".`,
    },
    missingMisspelled: {
      summary: (p) => `This feed owns no article: the role="${p.value}" of its ${p.element} is not an ARIA role (did you mean "article"?).`,
      hint: () => 'Correct the role to role="article".',
    },
  };
  const occurrences = [];
  for (const feed of feeds) {
    const children = owned(feed, "feed", 0, new Set([feed]));
    if (!children.some((c) => c.role === "article")) {
      const cause = missingCause(feed, children);
      const keySuffix = cause.key === "missing" ? "" : cause.key.slice("missing".length);
      occurrences.push(
        helpers.reportOccurrence(feed, {
          summary: MISSING[cause.key].summary(cause.params),
          hint: MISSING[cause.key].hint(cause.params),
          i18n: {
            summaryKey: `waiAriaFeedArticles_summary_fail_missing${keySuffix}`,
            hintKey: `waiAriaFeedArticles_hint_fail_missing${keySuffix}`,
            params: cause.params,
          },
          data: {
            details: {
              reasonCode: "FEED_ARTICLE_MISSING",
              ...(keySuffix ? { cause: cause.key } : {}),
              // The cause's elements and values; the role of the element
              // around the articles as wrapperRole, as role names an owned
              // element's own.
              ...Object.fromEntries(
                Object.entries(cause.params).map(([k, v]) => [k === "role" ? "wrapperRole" : k, v]),
              ),
            },
          },
        }),
      );
    }
    for (const c of children.filter((x) => x.role !== "article")) {
      const element = describe(c.el);
      // An element the feed owns around articles: the articles are its, not
      // the feed's.
      let wraps = false;
      try {
        wraps = [...(helpers.dom.querySelectorAll(c.el, 'article, [role~="article" i]') || [])].some(
          (a) => {
            const explicit = helpers.aria.getExplicitRole(a);
            return explicit ? explicit === "article" : tagOf(a) === "article";
          },
        );
      } catch {
        wraps = false;
      }
      occurrences.push(
        helpers.reportOccurrence(c.el, {
          summary: `A feed owns this ${element}, of role ${c.role}, which is not an article.`,
          hint: wraps
            ? `Its articles are inside it, so they are not the feed's: take them out of ${element}, or give it role="none".`
            : "Move it out of the feed, or put it inside one of its articles.",
          i18n: {
            summaryKey: "waiAriaFeedArticles_summary_fail_child",
            hintKey: wraps
              ? "waiAriaFeedArticles_hint_fail_childWrapper"
              : "waiAriaFeedArticles_hint_fail_child",
            params: { role: c.role, element },
          },
          data: {
            details: { reasonCode: "FEED_CHILD_NOT_ARTICLE", role: c.role, element },
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
