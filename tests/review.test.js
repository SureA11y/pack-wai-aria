'use strict';

// How a person answers each question: the steps a finding carries
// (howToCheck) name what it found, and, under this profile, are in
// WAI-ARIA's words (review.js), not WCAG's.

const test = require('node:test');
const assert = require('node:assert/strict');
const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const { addHowToCheck } = require('@surea11y/core');
const { definePack } = require('@surea11y/core/pack');
const pack = require('..');
const { REVIEW } = require('../review');

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
const scan = (body, profile = 'wai-aria-1.2') =>
  addHowToCheck(runa11yCoreOnHtml(page(body), { engineOptions: { packs: [pack], profile } }), {
    packs: [pack]
  });
const howOf = (result, ruleId, code) => {
  const check = result.checksResults.find((c) => c.ruleId === ruleId);
  const occ = check && check.occurrences.find((o) => o.data.details.reasonCode === code);
  assert.ok(occ, `${ruleId} reports ${code}`);
  assert.ok(occ.howToCheck, `${ruleId} ${code} has steps`);
  return occ.howToCheck;
};
const text = (how) => [...how.steps, how.passWhen, how.failWhen].join('\n');

const HASPOPUP =
  '<button aria-haspopup="menu" aria-controls="pop" aria-expanded="true">Options</button>' +
  '<div id="pop" role="dialog" aria-label="Options"><button>Close</button></div>';

test("core's questions read in WAI-ARIA's words under this profile, with the case found", () => {
  const how = howOf(scan(HASPOPUP), 'aria-valid-attr-value', 'ARIA_HASPOPUP_ROLE_MISMATCH');
  assert.match(how.steps[1], /had role dialog\./);
  assert.match(how.steps[2], /aria-haspopup="menu" announces: a menu/);
  assert.equal(how.passWhen, 'The popup that opens has role menu.');
  assert.match(how.failWhen, /role dialog, not menu, which fails WAI-ARIA 1\.2 aria-haspopup/);
  assert.doesNotMatch(text(how), /WCAG|\{\{/);
});

test('a scan that runs WCAG too reads core’s steps, which name WCAG', () => {
  const how = howOf(
    scan(HASPOPUP, ['wcag22-aa', 'wai-aria-1.2']),
    'aria-valid-attr-value',
    'ARIA_HASPOPUP_ROLE_MISMATCH'
  );
  assert.match(how.failWhen, /WCAG 4\.1\.2/);
});

test('each question names its attribute, role and value', () => {
  const deprecated = howOf(
    scan('<div role="alert" aria-disabled="true">Saved</div>'),
    'aria-allowed-attr',
    'ARIA_ATTR_DEPRECATED'
  );
  assert.match(deprecated.steps[0], /has aria-disabled with role alert/);

  const implicit = howOf(
    scan('<div role="heading">Title</div>'),
    'aria-required-attr',
    'ARIA_ATTR_REQUIRED_MISSING_IMPLICIT'
  );
  assert.match(implicit.steps[0], /role heading requires aria-level, .* the default, 2\./);

  const absent = howOf(
    scan('<div role="group" aria-labelledby="nope">Group</div>'),
    'aria-valid-attr-value',
    'ARIA_ATTR_VALUE_TARGET_ABSENT'
  );
  assert.match(absent.steps[0], /its aria-labelledby refers to nope/);

  const role = howOf(
    scan('<div role="directory"><div role="listitem">x</div></div>'),
    'aria-deprecated-role',
    'ARIA_ROLE_DEPRECATED'
  );
  assert.match(role.steps[0], /its role, directory, is deprecated/);
  assert.match(role.steps[1], /role="list"/);
});

test("the pack's own rules name what they found", () => {
  const presentational = howOf(
    scan('<div role="none" aria-checked="true">x</div>'),
    'wai-aria-presentational-attributes',
    'PRESENTATIONAL_ATTRIBUTE_UNSUPPORTED'
  );
  assert.match(presentational.steps[0], /has role none, .* and aria-checked, which/);

  const caption = howOf(
    scan('<div role="group" aria-label="g"><div role="caption">Sales</div></div>'),
    'wai-aria-caption-context',
    'CAPTION_CONTEXT_MISSING'
  );
  assert.match(caption.steps[0], /its parent is an element of role group\./);
});

test('every step reads without a finding, and core takes them all', () => {
  // definePack refuses steps it can't use: a rule or code core gives no
  // steps for, or a placeholder without its text.
  assert.doesNotThrow(() => definePack({ ...pack, standard: { ...pack.standard } }));
  for (const [ruleId, byCode] of Object.entries(REVIEW['1.2'])) {
    for (const [code, how] of Object.entries(byCode)) {
      for (const t of [...how.steps, how.passWhen, how.failWhen]) {
        assert.doesNotMatch(t, /WCAG/, `${ruleId} ${code}`);
      }
      assert.match(how.failWhen, /WAI-ARIA 1\.2/, `${ruleId} ${code} names WAI-ARIA`);
    }
  }
});
