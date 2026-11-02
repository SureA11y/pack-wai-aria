'use strict';

// What the wai-aria-1.2 profile runs and how it judges: core's ARIA rules,
// read by WAI-ARIA's wording, one result per requirement.

const test = require('node:test');
const assert = require('node:assert/strict');
const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const pack = require('..');
const { RULE_REQUIREMENTS } = require('../rule-map');

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
const scan = (body, engineOptions = { packs: [pack], profile: 'wai-aria-1.2' }) =>
  runa11yCoreOnHtml(page(body), { engineOptions });
const outcomeOf = (result, requirement) =>
  result.rulesResults.find((r) => r.ruleId === `wai-aria-1.2-${requirement}`).outcome;
const checkOf = (result, ruleId) => result.checksResults.find((c) => c.ruleId === ruleId);

test('the profile runs the rules the map lists, and reports one result per requirement', () => {
  const result = scan('<p>Hello</p>');
  assert.deepEqual(
    result.checksResults.map((c) => c.ruleId).sort(),
    Object.keys(RULE_REQUIREMENTS['1.2']).sort()
  );
  assert.equal(result.rulesResults.length, 8);
  assert.ok(result.rulesResults.every((r) => r.ruleId.startsWith('wai-aria-1.2-')));
});

test('an unnamed grid: a question for WCAG, a failure of WAI-ARIA', () => {
  const grid = '<div role="grid"><div role="row"><div role="gridcell">1</div></div></div>';
  const result = scan(grid);
  assert.equal(checkOf(result, 'wai-aria-role-name-present').outcome, 'cantTell');
  assert.equal(outcomeOf(result, 'name-required'), 'fail');
  const wcag = scan(grid, { profile: 'wcag22-aa' });
  assert.equal(
    wcag.rulesResults.find((r) => r.ruleId === 'wcag-4.1.2-name').outcome,
    'cantTell'
  );
});

test('a checkbox with no state fails required states', () => {
  const result = scan('<div role="checkbox" tabindex="0">Agree</div>');
  assert.equal(outcomeOf(result, 'required-states'), 'fail');
});

test('a finding WAI-ARIA only recommends against is a question', () => {
  // role="directory" is deprecated in 1.2: authors SHOULD NOT use it.
  const result = scan('<div role="directory"><a href="/a">A</a></div>');
  assert.equal(outcomeOf(result, 'roles'), 'cantTell');
});

test('a requirement no rule fails is a question, never a pass', () => {
  const result = scan('<button>Save</button>');
  for (const r of result.rulesResults) assert.equal(r.outcome, 'cantTell', r.ruleId);
});
