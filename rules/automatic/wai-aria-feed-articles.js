"use strict";

/**
 * @check wai-aria-feed-articles
 * @summary A feed owns articles, and only articles
 * @applicability
 *   Elements whose role attribute resolves to feed and that are in the
 *   accessibility tree.
 * @expectation
 *   The feed owns at least one article, and every element it owns has the
 *   article role (an <article>, or role="article"). Elements with no role of
 *   their own (a <div>, a <span>) are looked through, as the accessibility
 *   tree leaves them out.
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
  // The elements a feed owns: its children in the flat tree that are in the
  // accessibility tree, looking through those with no role of their own.
  const owned = (el, depth) => {
    const out = [];
    for (const child of helpers.flatChildElements(el)) {
      if (!helpers.isIncludedInAccessibilityTree(child, ctx)) continue;
      const role = tagOf(child) === "article" ? "article" : roleOf(child);
      if (
        !role ||
        role === "generic" ||
        role === "none" ||
        role === "presentation"
      ) {
        if (depth < 8) out.push(...owned(child, depth + 1));
      } else out.push({ el: child, role });
    }
    return out;
  };
  const occurrences = [];
  for (const feed of feeds) {
    const children = owned(feed, 0);
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
