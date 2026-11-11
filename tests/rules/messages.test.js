"use strict";

// What the rules' messages say of a finding's cause: the element, attribute
// or value at fault, and the near-right value where one is close. Each
// message reads the same from the rule's own English and from i18n/en.json.

const test = require("node:test");
const assert = require("node:assert/strict");
const { runa11yCoreOnHtml } = require("@surea11y/core/testing");
const pack = require("../..");
const en = require("../../i18n/en.json");

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body><main><span id="ref">Content</span>${body}</main></body></html>`;
// The pack without its dictionary: occurrences keep the rule's own text.
const bare = { ...pack, dictionaries: {} };
const occurrencesOf = (p, rule, body) =>
  runa11yCoreOnHtml(page(body), {
    engineOptions: { packs: [p] },
    runOnly: [rule],
  }).checksResults.find((c) => c.ruleId === rule).occurrences;
const fill = (text, params) =>
  text.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in (params || {}) ? params[k] : m));

// The occurrences of a rule on a page, after checking that each key is in
// en.json and reads there as the rule writes it.
function messages(rule, body) {
  const own = occurrencesOf(bare, rule, body);
  const dict = occurrencesOf(pack, rule, body);
  assert.equal(own.length, dict.length);
  own.forEach((o, i) => {
    const { summaryKey, hintKey, params } = o.i18n;
    assert.ok(summaryKey in en, `${summaryKey} is in en.json`);
    assert.ok(hintKey in en, `${hintKey} is in en.json`);
    assert.equal(fill(en[summaryKey], params), o.summary, summaryKey);
    assert.equal(fill(en[hintKey], params), o.hint, hintKey);
    assert.equal(dict[i].summary, o.summary);
    assert.equal(dict[i].hint, o.hint);
  });
  return own;
}
const one = (rule, body) => {
  const list = messages(rule, body);
  assert.equal(list.length, 1, body);
  return list[0];
};

test("wai-aria-scrollbar-controls: an empty or misspelt aria-controls is named", () => {
  let o = one("wai-aria-scrollbar-controls", '<div role="scrollbar" aria-valuenow="5" aria-control="ref"></div>');
  assert.equal(o.i18n.summaryKey, "waiAriaScrollbarControls_summary_fail_misspelled");
  assert.match(o.summary, /has aria-control, which is not an ARIA attribute \(did you mean aria-controls\?\)/);
  assert.equal(o.hint, "Rename aria-control to aria-controls, with the id of the content it scrolls.");
  assert.equal(o.data.details.reasonCode, "SCROLLBAR_CONTROLS_MISSING");
  o = one("wai-aria-scrollbar-controls", '<div role="scrollbar" aria-valuenow="5" aria-controls=" "></div>');
  assert.equal(o.summary, "This scrollbar's aria-controls is empty, so it does not say what it scrolls.");
  o = one("wai-aria-scrollbar-controls", '<div role="scrollbar" aria-valuenow="5"></div>');
  assert.equal(o.summary, "This scrollbar does not say what it scrolls.");
});

test("wai-aria-combobox-popup: names the element aria-controls points at, and why it is no popup", () => {
  let o = one("wai-aria-combobox-popup", '<input role="combobox" aria-controls="pop"><ul id="pop" role="lisbox"><li>a</li></ul>');
  assert.equal(
    o.summary,
    'This combobox controls <ul id="pop">, whose role="lisbox" is not an ARIA role (did you mean "listbox"?), so it is not a listbox, tree, grid or dialog.',
  );
  assert.equal(o.hint, 'Correct the role to role="listbox".');
  assert.equal(o.data.details.suggestion, "listbox");
  assert.equal(o.data.details.reasonCode, "COMBOBOX_POPUP_ROLE");
  o = one("wai-aria-combobox-popup", '<input role="combobox" aria-controls="pop"><div id="pop"><div role="listbox" id="lb"><div role="option">a</div></div></div>');
  assert.equal(o.i18n.summaryKey, "waiAriaComboboxPopup_summary_fail_inside");
  assert.match(o.summary, /the listbox is <div id="lb">, inside it/);
  assert.equal(o.hint, 'Point aria-controls at the listbox itself: aria-controls="lb".');
  o = one("wai-aria-combobox-popup", '<input role="combobox" aria-controls="pop"><ul id="pop"><li role="option">a</li></ul>');
  assert.equal(o.summary, 'This combobox controls <ul id="pop">, whose tag gives it role list, not a listbox, tree, grid or dialog.');
  o = one("wai-aria-combobox-popup", '<input role="combobox" aria-controls="ref">');
  assert.equal(o.i18n.summaryKey, "waiAriaComboboxPopup_summary_fail_noRole");
  assert.match(o.summary, /<span id="ref">, which has no role/);
  o = one("wai-aria-combobox-popup", '<input role="combobox" aria-controls="pop"><ul id="pop" role="foo"><li>a</li></ul>');
  assert.equal(o.i18n.summaryKey, "waiAriaComboboxPopup_summary_fail_invalidRole");
  o = one("wai-aria-combobox-popup", '<input role="combobox" aria-controls="pop"><div id="pop" role="menu"><div role="menuitem">a</div></div>');
  assert.equal(o.summary, 'This combobox controls <div id="pop">, of role menu, not a listbox, tree, grid or dialog.');
});

test("wai-aria-toolbar-names: says why the toolbar's naming attribute gives no name", () => {
  const others = '<div role="toolbar"><button>a</button></div>';
  const cases = [
    ['aria-labelledby="nowhere"', "labelledbyMissing", /aria-labelledby names the id "nowhere", which no element on the page has\.$/],
    ['aria-labelledby="toolbr-name"', "labelledbyNear", /\(did you mean "toolbar-name"\?\)/],
    ['aria-labelledby="empty"', "labelledbyEmpty", /points at <div id="empty">, which has no text/],
    ['aria-label=" "', "labelEmpty", /its aria-label is empty/],
    ['aria-labeledby="ref"', "misspelled", /it has aria-labeledby, which is not an ARIA attribute \(did you mean aria-labelledby\?\)/],
  ];
  for (const [attrs, cause, text] of cases) {
    const list = messages(
      "wai-aria-toolbar-names",
      `${others}<div id="empty"></div><span id="toolbar-name">Format</span><div role="toolbar" ${attrs}><button>b</button></div>`,
    );
    const o = list.find((x) => x.data.details.cause);
    assert.ok(o, attrs);
    assert.equal(o.data.details.cause, cause);
    assert.equal(o.i18n.summaryKey, `waiAriaToolbarNames_summary_fail_${cause}`);
    assert.match(o.summary, text);
    assert.match(o.summary, /^This toolbar has no name, and the page has 2 toolbars: /);
  }
  const misspelt = messages(
    "wai-aria-toolbar-names",
    `${others}<div role="toolbar" aria-lable="Format"><button>b</button></div>`,
  ).find((x) => x.data.details.cause);
  assert.equal(misspelt.hint, "Rename aria-lable to aria-label.");
});

test("wai-aria-feed-articles: says why a feed owns no article, and what a child is", () => {
  let o = one("wai-aria-feed-articles", '<div role="feed"><article hidden>a</article></div>');
  assert.equal(o.summary, "This feed owns no article: its <article> has the hidden attribute, which hides it from assistive technology.");
  o = one("wai-aria-feed-articles", '<div role="feed"><div style="display: none"><article>a</article></div></div>');
  assert.equal(o.i18n.summaryKey, "waiAriaFeedArticles_summary_fail_missingHiddenBy");
  assert.match(o.summary, /inside <div>, which has display: none/);
  o = one("wai-aria-feed-articles", '<div role="feed"><div role="artcle">x</div></div>');
  assert.match(o.summary, /role="artcle" of its <div> is not an ARIA role \(did you mean "article"\?\)/);
  assert.equal(o.hint, 'Correct the role to role="article".');
  const nested = messages("wai-aria-feed-articles", '<div role="feed"><ul><li><article>a</article></li></ul></div>');
  assert.equal(nested.length, 2);
  assert.equal(nested[0].summary, "This feed owns no article: its articles are inside <ul>, of role list, which the feed owns instead.");
  assert.equal(nested[1].summary, "A feed owns this <ul>, of role list, which is not an article.");
  assert.equal(nested[1].i18n.hintKey, "waiAriaFeedArticles_hint_fail_childWrapper");
  o = one("wai-aria-feed-articles", '<div role="feed"><h2>T</h2><article>a</article></div>');
  assert.equal(o.summary, "A feed owns this <h2>, of role heading, which is not an article.");
  assert.equal(o.hint, "Move it out of the feed, or put it inside one of its articles.");
  o = one("wai-aria-feed-articles", '<div role="feed"></div>');
  assert.equal(o.summary, "This feed owns no article.");
});

test("wai-aria-caption-context: names the caption's parent, and the figure or table above it", () => {
  let o = one("wai-aria-caption-context", '<div role="figure"><p><span role="caption">c</span></p><img alt="x" src="x.png"></div>');
  assert.equal(
    o.summary,
    "This caption is in the figure (<div>), but its parent in the accessibility tree is the <p> element, which comes between them.",
  );
  assert.equal(o.data.details.parent, "the <p> element");
  o = one("wai-aria-caption-context", '<div role="caption">c</div>');
  assert.equal(o.summary, "This caption is not in a figure or a table: its parent in the accessibility tree is the <main> element.");
  o = one("wai-aria-caption-context", '<div role="region" aria-label="r"><div role="caption">c</div></div>');
  assert.match(o.summary, /the <div> element of role region\.$/);
});

test("wai-aria-presentational-attributes: names the role, and the roles the attribute belongs to", () => {
  let o = one("wai-aria-presentational-attributes", '<div role="none" aria-checked="true">x</div>');
  assert.equal(
    o.summary,
    'This element\'s role="none" hides it from assistive technology, but it has aria-checked, which role none does not support.',
  );
  assert.equal(o.hint, "Give it a role that takes aria-checked (checkbox, menuitemcheckbox, option, radio, switch), or remove the attribute.");
  o = one("wai-aria-presentational-attributes", '<li role="presentation" aria-selected="true" aria-expanded="false">x</li>');
  assert.deepEqual(o.data.details.roles, ["gridcell", "row", "tab"]);
  o = one("wai-aria-presentational-attributes", '<div role="none" aria-checked="true" aria-sort="none">x</div>');
  assert.equal(o.hint, "Give it the role the attribute belongs to, or remove the attribute.");
});

test("wai-aria-spinbutton-owned: names the element it owns", () => {
  const o = one("wai-aria-spinbutton-owned", '<div role="spinbutton" aria-valuenow="1"><input type="text"><a href="#">x</a></div>');
  assert.equal(o.summary, "A spinbutton owns this <a>, of role link, though it may own only a textbox and buttons.");
});

test("wai-aria-keyshortcuts: names every misnamed modifier, and gives the shortcut as it should be", () => {
  let o = one("wai-aria-keyshortcuts", '<button aria-keyshortcuts="ctrl+s">s</button>');
  assert.equal(o.hint, "Write it Control+s: UI Events names modifier keys Alt, AltGraph, Control, Meta, Shift.");
  o = one("wai-aria-keyshortcuts", '<button aria-keyshortcuts="s+Ctrl+shift">s</button>');
  assert.equal(o.summary, 'The shortcut s+Ctrl+shift names modifier keys "Ctrl", "shift", which UI Events calls "Control", "Shift".');
  assert.equal(o.data.details.corrected, "Control+Shift+s");
  assert.equal(o.data.details.reasonCode, "KEYSHORTCUTS_MODIFIER_NAME");
});
