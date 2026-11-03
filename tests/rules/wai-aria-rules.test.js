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

test("wai-aria-feed-articles: an embedded document, or a <dl>, is the feed's child, not looked into", () => {
  for (const child of [
    '<iframe title="ad" src="about:blank"></iframe>',
    '<embed type="image/svg+xml" src="about:blank">',
  ]) {
    const check = feedCheck(`<div role="feed" aria-label="n"><article>a</article>${child}</div>`);
    assert.equal(check.outcome, "fail", child);
    assert.deepEqual(
      check.occurrences.map((o) => o.data.details.reasonCode),
      ["FEED_CHILD_NOT_ARTICLE"],
      child,
    );
  }
  // One finding, on the <dl>: its terms and definitions are its own.
  const dl = feedCheck(
    '<div role="feed" aria-label="n"><article>a</article><dl><dt>t</dt><dd>d</dd><dt>u</dt><dd>e</dd></dl></div>',
  );
  assert.equal(dl.outcome, "fail");
  assert.equal(dl.occurrences.length, 1);
  assert.match(dl.occurrences[0].selector, /> dl$/);
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

test("wai-aria-feed-articles: an <article>'s explicit role decides, as an element's does", () => {
  // role="button" makes it a button, which a feed doesn't own.
  const button = feedCheck(
    '<div role="feed" aria-label="n"><article>a</article><article role="button" tabindex="0">b</article></div>',
  );
  assert.equal(button.outcome, "fail");
  assert.deepEqual(
    button.occurrences.map((o) => o.data.details.role),
    ["button"],
  );
  // role="none" takes its article role away: the feed owns no article.
  const none = feedCheck(
    '<div role="feed" aria-label="n"><article role="none">a</article></div>',
  );
  assert.equal(none.outcome, "fail");
  assert.equal(none.occurrences[0].data.details.reasonCode, "FEED_ARTICLE_MISSING");
  // ...unless browsers ignore it, on a focusable article.
  const ignored = feedCheck(
    '<div role="feed" aria-label="n"><article role="none" tabindex="0">a</article></div>',
  );
  assert.equal(ignored.outcome, "pass");
  // A plain <article>, and role="article" on a <div>, still count.
  assert.equal(
    feedCheck(
      '<div role="feed" aria-label="n"><article>a</article><div role="article">b</div></div>',
    ).outcome,
    "pass",
  );
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

test("wai-aria-feed-articles: a <li> outside a list is looked through", () => {
  for (const body of [
    '<ul role="feed" aria-label="n"><li><article>a</article></li><li><article>b</article></li></ul>',
    '<div role="feed" aria-label="n"><ul role="none"><li><article>a</article></li></ul></div>',
  ]) {
    assert.equal(feedCheck(body).outcome, "pass", body);
  }
  // In a list, the list is what the feed owns.
  assert.deepEqual(
    feedCheck(
      '<div role="feed" aria-label="n"><article>a</article><div role="list"><li>x</li></div></div>',
    ).occurrences.map((o) => o.data.details.role),
    ["list"],
  );
});

test("wai-aria-feed-articles: a control whose role of none browsers ignore keeps its implicit role", () => {
  for (const [child, role] of [
    ['<button role="none">b</button>', "button"],
    ['<a href="#" role="none">x</a>', "link"],
    ['<input role="none" aria-label="x">', "textbox"],
    ['<input type="checkbox" role="none" aria-label="x">', "checkbox"],
    ['<select role="none" aria-label="x"><option>1</option></select>', "combobox"],
    [
      '<select multiple role="none" aria-label="x"><option>1</option></select>',
      "listbox",
    ],
    ['<textarea role="none" aria-label="x"></textarea>', "textbox"],
    ['<summary role="none" tabindex="0">s</summary>', "button"],
  ]) {
    const check = feedCheck(
      `<div role="feed" aria-label="n"><article>a</article>${child}</div>`,
    );
    assert.deepEqual(
      check.occurrences.map((o) => o.data.details.role),
      [role],
      child,
    );
  }
});

test("wai-aria-feed-articles: an unnamed <aside> in main is complementary, in sectioning content generic", () => {
  assert.deepEqual(
    feedCheck(
      '<main><div role="feed" aria-label="n"><article>a</article><aside>x</aside></div></main>',
    ).occurrences.map((o) => o.data.details.role),
    ["complementary"],
  );
  assert.equal(
    feedCheck(
      '<section><div role="feed" aria-label="n"><article>a</article><aside>x</aside></div></section>',
    ).outcome,
    "pass",
  );
  // A header in main is still generic.
  assert.equal(
    feedCheck(
      '<main><div role="feed" aria-label="n"><article>a</article><header>x</header></div></main>',
    ).outcome,
    "pass",
  );
});

test("wai-aria-feed-articles: em, strong and s have roles of their own", () => {
  for (const [child, role] of [
    ["<em>new</em>", "emphasis"],
    ["<strong>new</strong>", "strong"],
    ["<s>old</s>", "deletion"],
  ]) {
    assert.deepEqual(
      feedCheck(
        `<div role="feed" aria-label="n"><article>a</article>${child}</div>`,
      ).occurrences.map((o) => o.data.details.role),
      [role],
      child,
    );
  }
  assert.equal(
    feedCheck(
      '<div role="feed" aria-label="n"><article>a</article><mark>x</mark></div>',
    ).outcome,
    "pass",
  );
});

test("wai-aria-feed-articles: a feed doesn't look into media or object fallback content", () => {
  for (const [child, role] of [
    ["<video><article>fallback</article></video>", "video"],
    ["<audio controls><article>fallback</article></audio>", "audio"],
    ['<object data="a.html"><article>fallback</article></object>', "object"],
  ]) {
    const check = feedCheck(`<div role="feed" aria-label="n">${child}</div>`);
    assert.deepEqual(
      check.occurrences.map((o) =>
        o.data.details.role || o.data.details.reasonCode,
      ),
      ["FEED_ARTICLE_MISSING", role],
      child,
    );
  }
});

test("wai-aria-feed-articles: aria-owns naming the owner's ancestor is ignored", () => {
  assert.equal(
    feedCheck(
      '<div id="w"><div role="feed" aria-label="n" aria-owns="w"><article>a</article></div><p>sibling</p></div>',
    ).outcome,
    "pass",
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

test("wai-aria-feed-articles: an unnamed explicit region or form is looked through, as browsers expose it", () => {
  for (const wrapper of [
    '<div role="region">',
    '<div role="form">',
    '<section role="region">',
  ]) {
    const close = wrapper.startsWith("<section") ? "</section>" : "</div>";
    const check = feedCheck(
      `<div role="feed" aria-label="n">${wrapper}<article>a</article>${close}</div>`,
    );
    assert.equal(check.outcome, "pass", wrapper);
  }
  // Named, it is a region, which a feed doesn't own.
  const named = feedCheck(
    '<div role="feed" aria-label="n"><div role="region" aria-label="r"><article>a</article></div></div>',
  );
  assert.equal(named.outcome, "fail");
  // The next role it names is taken first.
  const next = feedCheck(
    '<div role="feed" aria-label="n"><div role="region article">a</div></div>',
  );
  assert.equal(next.outcome, "pass");
  // A <form> is a form, named or not, as browsers expose it.
  const form = feedCheck(
    '<div role="feed" aria-label="n"><article>a</article><form>x</form></div>',
  );
  assert.equal(form.outcome, "fail");
});

test("wai-aria-feed-articles: generic wrappers are looked through at any depth", () => {
  const deep = (inner, n) => "<div>".repeat(n) + inner + "</div>".repeat(n);
  assert.equal(
    feedCheck(
      `<div role="feed" aria-label="n">${deep("<article>a</article>", 12)}</div>`,
    ).outcome,
    "pass",
  );
  assert.equal(
    feedCheck(
      `<div role="feed" aria-label="n"><article>a</article>${deep("<p>x</p>", 12)}</div>`,
    ).outcome,
    "fail",
  );
});

test("wai-aria-feed-articles: a child that sets visibility:visible inside a visibility:hidden one is the feed's", () => {
  const check = feedCheck(
    '<div role="feed" aria-label="n"><article>a</article><div style="visibility:hidden"><p style="visibility:visible">x</p></div></div>',
  );
  assert.equal(check.outcome, "fail");
  // Under display:none it stays hidden.
  const none = feedCheck(
    '<div role="feed" aria-label="n"><article>a</article><div style="display:none"><p style="visibility:visible">x</p></div></div>',
  );
  assert.equal(none.outcome, "pass");
});

test("wai-aria-caption-context: a caption's parent is read in the accessibility tree", () => {
  for (const body of [
    '<div role="figure" aria-label="f"><div><div role="caption">Cap</div></div><img src="x.png" alt="x"></div>',
    '<figure><span><span role="caption">Cap</span></span><img src="x.png" alt="x"></figure>',
    // HTML-AAM maps <pre> to generic and gives <picture> no role.
    '<figure><pre><div role="caption">Cap</div></pre><img src="x.png" alt="x"></figure>',
    '<figure><picture><div role="caption">Cap</div></picture><img src="x.png" alt="x"></figure>',
    '<div role="figure" aria-label="f" aria-owns="c"><img src="x.png" alt="x"></div><div role="caption" id="c">Cap</div>',
  ]) {
    assertRule(run("wai-aria-caption-context", body), "wai-aria-caption-context", "pass");
  }
  // A role between them is the caption's parent.
  assertRule(
    run(
      "wai-aria-caption-context",
      '<div role="figure" aria-label="f"><div role="group" aria-label="g"><div role="caption">Cap</div></div></div>',
    ),
    "wai-aria-caption-context",
    "cantTell",
  );
});

test("wai-aria-feed-articles: an element whose role depends on where it is, as HTML-AAM gives it", () => {
  // A <summary> outside a <details>, and an <area>, are no child of a feed.
  for (const child of [
    "<summary>s</summary>",
    '<map name="m"><area href="#" alt="a"></map>',
  ]) {
    const check = feedCheck(`<div role="feed" aria-label="n"><article>a</article>${child}</div>`);
    assert.equal(check.outcome, "pass", child);
  }
  // A focusable <img alt=""> keeps its image role.
  const img = feedCheck(
    '<div role="feed" aria-label="n"><article>a</article><img src="x.png" alt="" tabindex="0"></div>',
  );
  assert.equal(img.outcome, "fail");
});

test("wai-aria-feed-articles: what a feed claims with aria-owns is its, and content-visibility:hidden is not", () => {
  const claimed = (body) => feedCheck(body).outcome;
  assert.equal(
    claimed('<div role="group" aria-label="g" aria-owns="x"></div><div role="feed" aria-label="n" aria-owns="x"><article>a</article></div><p id="x">p</p>'),
    "fail",
  );
  assert.equal(
    claimed('<div role="feed" aria-label="n" aria-owns="y"><article>a</article></div><div aria-hidden="true"><p id="y">p</p></div>'),
    "fail",
  );
  assert.equal(
    claimed('<div role="feed" aria-label="n"><article>a</article><p style="content-visibility:hidden">x</p></div>'),
    "pass",
  );
});

test("wai-aria-caption-context: an element with a native role between is the caption's parent", () => {
  for (const body of [
    '<figure><ul><li><span role="caption">c</span></li></ul><img src="x.png" alt="x"></figure>',
    '<figure><p><span role="caption">c</span></p><img src="x.png" alt="x"></figure>',
    '<figure><blockquote><div role="caption">c</div></blockquote></figure>',
    '<figure><details open><div role="caption">c</div></details></figure>',
  ]) {
    assertRule(run("wai-aria-caption-context", body), "wai-aria-caption-context", "cantTell");
  }
  // A role of none browsers ignore leaves the figure its role.
  assertRule(
    run(
      "wai-aria-caption-context",
      '<figure role="none" tabindex="0"><div role="caption">c</div><img src="x.png" alt="x"></figure>',
    ),
    "wai-aria-caption-context",
    "pass",
  );
});

test("wai-aria-presentational-attributes: a name WAI-ARIA has no attribute of is left to aria-valid-attr", () => {
  assertRule(
    run("wai-aria-presentational-attributes", '<h1 role="none" aria-foo="x">t</h1>'),
    "wai-aria-presentational-attributes",
    "pass",
  );
});
