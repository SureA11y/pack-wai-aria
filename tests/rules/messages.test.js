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
  // A <dialog> isn't said to have no role.
  o = one("wai-aria-combobox-popup", '<input role="combobox" aria-controls="pop"><dialog id="pop" open>x</dialog>');
  assert.equal(o.i18n.summaryKey, "waiAriaComboboxPopup_summary_fail_unread");
  assert.doesNotMatch(o.summary, /no role/);
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

test("wai-aria-toolbar-names: says what the other toolbars are called, and every id aria-labelledby misses", () => {
  const named = '<div role="toolbar" aria-label="Formatting"><button>a</button></div><div role="toolbar" aria-label="Insert"><button>a</button></div>';
  let o = one("wai-aria-toolbar-names", `${named}<div role="toolbar"><button>b</button></div>`);
  assert.equal(o.summary, 'This toolbar has no name, and the page has 3 toolbars: the others are called "Formatting", "Insert".');
  assert.equal(o.hint, "Name it as the others are named, with aria-label or aria-labelledby, so the toolbars can be told apart.");
  assert.equal(o.data.details.cause, undefined);
  let list = messages(
    "wai-aria-toolbar-names",
    '<div role="toolbar" aria-label="Formatting"><button>a</button></div><div role="toolbar"><button>b</button></div><div role="toolbar"><button>c</button></div>',
  );
  assert.equal(list.length, 2);
  assert.equal(list[0].summary, 'This toolbar has no name, and the page has 3 toolbars: 2 have no name, and the others are called "Formatting".');
  list = messages("wai-aria-toolbar-names", '<div role="toolbar"><button>a</button></div><div role="toolbar"><button>b</button></div>');
  assert.equal(list[0].summary, "This toolbar has no name, and none of the page's 2 toolbars has one.");
  o = messages(
    "wai-aria-toolbar-names",
    '<div role="toolbar" aria-label="Formatting"><button>a</button></div><div id="empty"></div><div role="toolbar" aria-labelledby="empty gone"><button>b</button></div>',
  ).find((x) => x.data.details.cause);
  assert.equal(o.data.details.cause, "labelledbyEmptyMissing");
  assert.match(o.summary, /points at <div id="empty">, which has no text, and names the id "gone", which no element on the page has\.$/);
});

test("wai-aria-setsize: names the set, the sizes the other items give, and the size most give", () => {
  let list = messages(
    "wai-aria-setsize",
    '<div role="list" id="l"><div role="listitem" aria-setsize="3">a</div><div role="listitem" aria-setsize="3">b</div><div role="listitem" aria-setsize="4">c</div></div>',
  );
  assert.equal(list.length, 3);
  const odd = list.find((x) => x.data.details.setsize === 4);
  assert.equal(odd.summary, 'This item\'s aria-setsize is 4, and other items of its set, the elements of role listitem in <div id="l">, give 3.');
  assert.equal(odd.hint, "Set it to 3, as most items of its set do, if the whole set has 3 items: every item gives the same aria-setsize.");
  assert.equal(odd.data.details.suggestion, 3);
  const usual = list.find((x) => x.data.details.setsize === 3);
  assert.equal(usual.i18n.hintKey, "waiAriaSetsize_hint_fail_inconsistent");
  assert.equal(usual.data.details.reasonCode, "SETSIZE_INCONSISTENT");
  const o = one("wai-aria-setsize", '<div role="list" id="l"><div role="listitem" aria-setsize="1">a</div><div role="listitem">b</div></div>');
  assert.equal(o.summary, 'This item\'s aria-setsize (1) is below the 2 items of its set on the page, the elements of role listitem in <div id="l">.');
  assert.equal(o.hint, "Set aria-setsize to the number of items in the whole set, at least 2, or to -1 if it is not known.");
});

test("wai-aria-table-indexes: names the earlier cell or row, the widest row and the cell that spans it", () => {
  let o = one("wai-aria-table-indexes", '<table><tr><td aria-colindex="1">Name</td><td aria-colindex="1">Price</td></tr></table>');
  assert.equal(o.summary, 'This cell\'s aria-colindex (1) is the same as that of the cell before it in its row, <td> "Name".');
  assert.equal(o.hint, 'Give each cell its own column: if this one comes right after <td> "Name", its aria-colindex is 2.');
  assert.equal(o.data.details.reasonCode, "COLINDEX_NOT_INCREASING");
  o = one("wai-aria-table-indexes", '<table><tr><td aria-colindex="2" colspan="2">Name</td><td aria-colindex="1">Price</td></tr></table>');
  assert.equal(o.summary, 'This cell\'s aria-colindex (1) is below that of an earlier cell in its row, <td> "Name" (2).');
  assert.equal(o.data.details.suggestion, 4);
  o = one("wai-aria-table-indexes", '<table aria-colcount="2"><tr><td>a</td></tr><tr><td>b</td><td colspan="2">Wide</td></tr></table>');
  assert.equal(
    o.summary,
    'This table\'s aria-colcount (2) is below the 3 columns that row 2 of it on the page spans, where <td> "Wide" spans 2 columns.',
  );
  assert.match(o.hint, /at least 3, counting the columns a colspan spans/);
  o = one("wai-aria-table-indexes", '<table aria-colcount="1"><tr><td>a</td><td>b</td></tr></table>');
  assert.equal(o.summary, "This table's aria-colcount (1) is below the 2 columns that row 1 of it on the page spans.");
  o = one("wai-aria-table-indexes", '<table><tr aria-rowindex="2"><td>a</td></tr><tr aria-rowindex="2"><td>b</td></tr></table>');
  assert.equal(o.summary, "This row's aria-rowindex (2) is not greater than 2, which row 1 of the table on the page gives, before it.");
  assert.equal(o.hint, "Number the rows from top to bottom, each above the one before: if this row comes right after row 1, its aria-rowindex is 3.");
});

test("wai-aria-spinbutton-owned: names the extra elements, and says when aria-owns owns them", () => {
  let o = one(
    "wai-aria-spinbutton-owned",
    '<div role="spinbutton" aria-valuenow="1" aria-owns="x3"><input type="text"><button>+</button><button>-</button></div><button id="x3">x</button>',
  );
  assert.equal(
    o.summary,
    'This spinbutton owns more than one text box and two buttons (text boxes: 1, buttons: 3): past the first text box and two buttons, it owns <button id="x3"> (through aria-owns).',
  );
  assert.deepEqual(o.data.details.extra, ['<button id="x3"> (through aria-owns)']);
  o = one("wai-aria-spinbutton-owned", '<div role="spinbutton" aria-valuenow="1" aria-owns="lk"><input type="text"></div><a id="lk" href="#">x</a>');
  assert.equal(o.summary, "A spinbutton owns this <a>, of role link, through its aria-owns, though it may own only a textbox and buttons.");
  assert.equal(o.hint, "Take its id out of the spinbutton's aria-owns, or make it the spinbutton's text box or one of its two buttons.");
  assert.equal(o.data.details.reasonCode, "SPINBUTTON_OWNS_OTHER");
});

test("wai-aria-feed-articles: an article another element owns, one whose role replaces article, and fallback content", () => {
  let o = one("wai-aria-feed-articles", '<div role="feed"><article id="a1">a</article></div><div role="list" id="l" aria-owns="a1"></div>');
  assert.equal(
    o.summary,
    'This feed owns no article: its <article id="a1"> is in it in the markup, but <div id="l"> claims it with aria-owns, so it is that element\'s child in the accessibility tree, not the feed\'s.',
  );
  assert.equal(o.hint, 'Take its id out of the aria-owns of <div id="l">, so the feed owns it.');
  let list = messages("wai-aria-feed-articles", '<div role="feed"><article role="button">a</article></div>');
  assert.equal(list[0].summary, 'This feed owns no article: its <article> has role="button", which replaces the article role.');
  assert.equal(list[1].summary, "A feed owns this <article>, of role button, which is not an article.");
  assert.equal(list[1].hint, 'Its role="button" replaces the article role: remove it, so it is an article, and put what it is inside it.');
  list = messages("wai-aria-feed-articles", '<div role="feed"><video><article>a</article></video></div>');
  assert.equal(
    list[0].summary,
    "This feed owns no article: its articles are inside <video>, as fallback content, which is shown only where the video can't be, so the feed owns the video instead.",
  );
  assert.equal(list[1].i18n.hintKey, "waiAriaFeedArticles_hint_fail_childFallback");
  assert.equal(list[1].hint, "Its articles are inside it as fallback content, shown only where the video can't be: take them out of <video>.");
});

test("wai-aria-caption-context: says when the caption's parent comes from aria-owns", () => {
  let o = one(
    "wai-aria-caption-context",
    '<div role="figure"><div role="caption" id="c">c</div><img alt="x" src="x.png"></div><div role="region" id="r" aria-label="r" aria-owns="c"></div>',
  );
  assert.equal(
    o.summary,
    'This caption is in the figure (<div>) in the markup, but its parent in the accessibility tree is the <div id="r"> element of role region, which claims it with aria-owns.',
  );
  assert.equal(o.hint, 'Take its id out of the aria-owns of <div id="r">, so it stays a child of the figure (<div>), and name that element by it with aria-labelledby.');
  assert.equal(o.data.details.throughAriaOwns, true);
  o = one("wai-aria-caption-context", '<div role="caption" id="c">c</div><p id="o" aria-owns="c"></p>');
  assert.equal(
    o.summary,
    'This caption is not in a figure or a table: its parent in the accessibility tree is the <p id="o"> element, which claims it with aria-owns.',
  );
});
