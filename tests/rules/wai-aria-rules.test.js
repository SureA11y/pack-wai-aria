"use strict";

// The pack's own rules, each on what it fails or asks about and what it
// leaves alone, and how the profile reads them.

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  runa11yCoreOnHtml,
  runa11yCoreOnDom,
  createDom,
  assertRule,
} = require("@surea11y/core/testing");
const pack = require("../..");

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body><main><span id="ref">Content</span>${body}</main></body></html>`;
const run = (rule, body) =>
  runa11yCoreOnHtml(page(body), {
    engineOptions: { packs: [pack] },
    runOnly: [rule],
  });
const profile = (body) =>
  runa11yCoreOnHtml(page(body), {
    engineOptions: { packs: [pack], profile: "wai-aria-1.2" },
  });
const requirement = (result, id) =>
  result.rulesResults.find((r) => r.ruleId === `wai-aria-1.2-${id}`).outcome;

test("wai-aria-role-name-present: an unnamed table, tabpanel or treegrid fails WAI-ARIA", () => {
  for (const body of [
    '<div role="table"><div role="row"><div role="cell">1</div></div></div>',
    '<div role="tabpanel">Panel</div>',
    '<div role="treegrid"><div role="row"><div role="gridcell">1</div></div></div>',
  ]) {
    assertRule(
      run("wai-aria-role-name-present", body),
      "wai-aria-role-name-present",
      "cantTell",
    );
    assert.equal(requirement(profile(body), "name-required"), "fail", body);
  }
});

test("wai-aria-role-name-present: a native table with no role is left to WCAG", () => {
  assertRule(
    run("wai-aria-role-name-present", "<table><tr><td>1</td></tr></table>"),
    "wai-aria-role-name-present",
    "notApplicable",
  );
});

test("wai-aria-scrollbar-controls: a scrollbar with no aria-controls fails", () => {
  assertRule(
    run(
      "wai-aria-scrollbar-controls",
      '<div role="scrollbar" aria-valuenow="5"></div>',
    ),
    "wai-aria-scrollbar-controls",
    "fail",
    { minOccurrences: 1, maxOccurrences: 1 },
  );
  assertRule(
    run(
      "wai-aria-scrollbar-controls",
      '<div role="scrollbar" aria-valuenow="5" aria-controls="ref"></div>',
    ),
    "wai-aria-scrollbar-controls",
    "pass",
  );
  assert.equal(
    requirement(
      profile('<div role="scrollbar" aria-valuenow="5"></div>'),
      "required-states",
    ),
    "fail",
  );
});

test("wai-aria-feed-articles: a feed must own articles, and only articles", () => {
  assertRule(
    run("wai-aria-feed-articles", '<div role="feed"></div>'),
    "wai-aria-feed-articles",
    "fail",
    {
      minOccurrences: 1,
      maxOccurrences: 1,
    },
  );
  assertRule(
    run(
      "wai-aria-feed-articles",
      '<div role="feed"><article>One</article><div role="button" tabindex="0">More</div></div>',
    ),
    "wai-aria-feed-articles",
    "fail",
    { minOccurrences: 1, maxOccurrences: 1 },
  );
  // A generic wrapper is looked through.
  assertRule(
    run(
      "wai-aria-feed-articles",
      '<div role="feed"><div><article>One</article><div role="article">Two</div></div></div>',
    ),
    "wai-aria-feed-articles",
    "pass",
  );
  assert.equal(
    requirement(profile('<div role="feed"></div>'), "owned-elements"),
    "fail",
  );
});

test("wai-aria-caption-context: a caption outside a figure or table is a question", () => {
  assertRule(
    run("wai-aria-caption-context", '<div role="caption">Prices</div>'),
    "wai-aria-caption-context",
    "cantTell",
  );
  assertRule(
    run(
      "wai-aria-caption-context",
      '<div role="figure"><div role="caption">Prices</div><img src="a.png" alt="Chart"></div>',
    ),
    "wai-aria-caption-context",
    "pass",
  );
});

test("wai-aria-presentational-attributes: a hidden role with a state of its own is a question", () => {
  const result = run(
    "wai-aria-presentational-attributes",
    '<div role="none" aria-checked="true">x</div>',
  );
  assertRule(result, "wai-aria-presentational-attributes", "cantTell");
  const check = result.checksResults.find(
    (c) => c.ruleId === "wai-aria-presentational-attributes",
  );
  assert.deepEqual(check.occurrences[0].data.details.attributes, [
    "aria-checked",
  ]);
  // A global attribute makes browsers ignore the role: not this rule's.
  assertRule(
    run(
      "wai-aria-presentational-attributes",
      '<div role="presentation" aria-label="x">x</div>',
    ),
    "wai-aria-presentational-attributes",
    "notApplicable",
  );
});

test("core's empty-heading and a heading with no level count under WAI-ARIA", () => {
  assert.equal(
    requirement(
      profile('<div role="heading" aria-level="2"></div>'),
      "name-required",
    ),
    "fail",
  );
  const noLevel = profile('<div role="heading">Title</div>');
  const check = noLevel.checksResults.find(
    (c) => c.ruleId === "aria-required-attr",
  );
  assert.equal(check.outcome, "cantTell");
  assert.equal(requirement(noLevel, "required-states"), "cantTell");
});

test("wai-aria-feed-articles: a native element with a role of its own is owned, a generic one looked through", () => {
  for (const child of [
    "<h2>News</h2>",
    "<p>Intro</p>",
    "<ul><li>x</li></ul>",
  ]) {
    assertRule(
      run(
        "wai-aria-feed-articles",
        `<div role="feed" aria-label="n">${child}<article>a</article></div>`,
      ),
      "wai-aria-feed-articles",
      "fail",
    );
  }
  assertRule(
    run(
      "wai-aria-feed-articles",
      '<div role="feed" aria-label="n"><div><span>x</span><article>a</article></div><my-item><article>b</article></my-item></div>',
    ),
    "wai-aria-feed-articles",
    "pass",
  );
});

test("wai-aria-presentational-attributes: an element hidden from assistive technology is left alone", () => {
  assertRule(
    run(
      "wai-aria-presentational-attributes",
      '<div aria-hidden="true"><div role="presentation" aria-pressed="true">x</div></div>',
    ),
    "wai-aria-presentational-attributes",
    "notApplicable",
  );
});

const feedCheck = (body) =>
  run("wai-aria-feed-articles", body).checksResults.find(
    (c) => c.ruleId === "wai-aria-feed-articles",
  );

test("wai-aria-feed-articles: an element HTML-AAM makes generic or none is looked through", () => {
  for (const child of [
    '<img src="a.png" alt="">',
    "<section><article>b</article></section>",
    "<a><article>b</article></a>",
    "<pre><article>b</article></pre>",
    "<tt><article>b</article></tt>",
    "<picture></picture>",
    "<header><article>b</article></header>",
    "<footer><article>b</article></footer>",
    "<aside><article>b</article></aside>",
  ]) {
    const check = feedCheck(
      `<section aria-label="s"><div role="feed" aria-label="n"><article>a</article>${child}</div></section>`,
    );
    assert.equal(check.outcome, "pass", child);
  }
});

test("wai-aria-feed-articles: an owned element is reported by its role, not its tag", () => {
  for (const [child, role] of [
    ["<p>Intro</p>", "paragraph"],
    ['<nav aria-label="x">x</nav>', "navigation"],
    ["<table><tr><td>1</td></tr></table>", "table"],
    ["<ul><li>x</li></ul>", "list"],
    ["<h2>News</h2>", "heading"],
    ['<img src="a.png" alt="Logo">', "img"],
    ['<section aria-label="s">x</section>', "region"],
    ['<h2 role="none" tabindex="0">News</h2>', "heading"],
  ]) {
    const check = feedCheck(
      `<div role="feed" aria-label="n"><article>a</article>${child}</div>`,
    );
    assert.equal(check.outcome, "fail", child);
    assert.deepEqual(
      check.occurrences.map((o) => o.data.details.role),
      [role],
      child,
    );
  }
  // Outside sectioning content, a header is a banner.
  const banner = runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><div role="feed" aria-label="n"><article>a</article><header>Top</header></div></body></html>',
    { engineOptions: { packs: [pack] }, runOnly: ["wai-aria-feed-articles"] },
  ).checksResults.find((c) => c.ruleId === "wai-aria-feed-articles");
  assert.deepEqual(
    banner.occurrences.map((o) => o.data.details.role),
    ["banner"],
  );
});

test("wai-aria-feed-articles: aria-owns adds to a feed's owned elements, and takes from them", () => {
  assert.equal(
    feedCheck(
      '<div role="feed" aria-label="owned" aria-owns="a1 a2"></div><article id="a1">One</article><article id="a2">Two</article>',
    ).outcome,
    "pass",
  );
  const owned = feedCheck(
    '<div role="feed" aria-label="owned" aria-owns="h"><article>One</article></div><h2 id="h">News</h2>',
  );
  assert.equal(owned.outcome, "fail");
  assert.deepEqual(
    owned.occurrences.map((o) => o.data.details.role),
    ["heading"],
  );
  // A child another element owns is that element's, not the feed's.
  assert.equal(
    feedCheck(
      '<div role="feed" aria-label="n"><article>One</article><h2 id="h">News</h2></div><div role="group" aria-label="g" aria-owns="h"></div>',
    ).outcome,
    "pass",
  );
  assert.equal(
    feedCheck(
      '<div role="feed" aria-label="n"><article id="a">One</article></div><div role="region" aria-label="g" aria-owns="a"></div>',
    ).occurrences[0].data.details.reasonCode,
    "FEED_ARTICLE_MISSING",
  );
});

test("wai-aria-presentational-attributes: a shadow host's child that no slot takes is left alone", () => {
  const scan = (slot) => {
    const dom = createDom(
      page(
        '<div id="host"><div role="none" aria-pressed="true">x</div></div>',
      ),
    );
    const doc = dom.window.document;
    doc.getElementById("host").attachShadow({ mode: "open" }).innerHTML =
      slot ? "<div><slot></slot></div>" : "<p>No slot</p>";
    return runa11yCoreOnDom(dom, {
      engineOptions: { packs: [pack] },
      runOnly: ["wai-aria-presentational-attributes"],
    });
  };
  assertRule(scan(false), "wai-aria-presentational-attributes", "notApplicable");
  assertRule(scan(true), "wai-aria-presentational-attributes", "cantTell");
});
