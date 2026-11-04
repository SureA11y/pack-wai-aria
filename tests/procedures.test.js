'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { listProcedures, proceduresFor } = require('@surea11y/core');
const pack = require('..');
const { REQUIREMENTS } = require('../requirements');

const read = (id, options) =>
  proceduresFor(id, { packs: [pack], standard: 'wai-aria', ...options });

test('every requirement says how a person assesses it', () => {
  for (const [version, requirements] of Object.entries(REQUIREMENTS)) {
    for (const id of Object.keys(requirements)) {
      const r = read(id, { version });
      assert.ok(r, `${version} ${id} has procedures (procedures.js)`);
      assert.equal(r.complete, true, `${version} ${id} has a procedure for every facet`);
      assert.match(r.facets[0].procedure.failWhen, new RegExp(`WAI-ARIA ${id}`));
    }
  }
});

test('the standard lists its requirements, by title, in its groups', () => {
  const list = listProcedures({ packs: [pack], standard: 'wai-aria' });
  assert.equal(list.version, '1.2');
  for (const r of list.requirements) {
    assert.equal(r.title, REQUIREMENTS['1.2'][r.id].title, r.id);
  }
  assert.deepEqual(
    list.groups.flatMap((g) => g.requirements).sort(),
    Object.keys(REQUIREMENTS['1.2']).sort()
  );
});

// The steps list what is valid, from the Recommendation's role tables, so a
// person needs no copy of the specification at hand.
const { PROCEDURES, GLOBAL, VALUES, TOKENS } = require('../procedures');
const SPEC = require('../scripts/data/wai-aria-1.2.json').roles;
const stepsOf = (id) => PROCEDURES['1.2'][id].facets[0].steps.join('\n');

test('the steps list every role, state and value the requirement covers', () => {
  const names = stepsOf('name-required');
  for (const [role, r] of Object.entries(SPEC)) {
    if (r.nameRequired) assert.match(names, new RegExp(`\\b${role}\\b`), `name-required: ${role}`);
  }
  const roles = stepsOf('roles');
  for (const [role, r] of Object.entries(SPEC)) {
    if (r.abstract) assert.match(roles, new RegExp(`\\b${role}\\b`), `roles: ${role}`);
  }
  const required = stepsOf('required-states');
  for (const [role, r] of Object.entries(SPEC)) {
    if (r.requiredProps.length) {
      assert.ok(required.includes(`${role}`), `required-states: ${role}`);
      for (const p of r.requiredProps) assert.ok(required.includes(p), `${role} ${p}`);
    }
  }
  assert.match(stepsOf('prohibited-attributes'), /generic: aria-label, aria-labelledby, aria-roledescription/);
  assert.match(stepsOf('supported-attributes'), /button: aria-disabled, aria-expanded, aria-haspopup, aria-pressed/);
  assert.match(stepsOf('owned-elements'), /listbox: group > option, option/);
  assert.match(stepsOf('context-roles'), /tab: tablist/);
});

test("the attributes' value types are WAI-ARIA 1.2's", () => {
  const { aria } = require('aria-query');
  const TYPE = {
    'true/false': 'boolean',
    'true/false/undefined': 'boolean',
    'true/false/mixed/undefined': 'tristate',
    integer: 'integer',
    number: 'number',
    'the id of one element on the page': 'id',
    'the ids of elements on the page, separated by spaces': 'idlist',
    text: 'string'
  };
  const listed = new Set([...Object.values(VALUES).flat(), ...Object.keys(TOKENS)]);
  for (const [attr, def] of aria.entries()) {
    // WAI-ARIA 1.3's, which 1.2 doesn't have.
    if (['aria-braillelabel', 'aria-brailleroledescription', 'aria-description'].includes(attr)) continue;
    assert.ok(listed.has(attr), `${attr} has a type in procedures.js`);
    if (TOKENS[attr]) assert.deepEqual([...TOKENS[attr]].sort(), [...def.values].map(String).sort(), attr);
    else {
      const type = Object.entries(VALUES).find(([, attrs]) => attrs.includes(attr))[0];
      assert.equal(TYPE[type], def.type, attr);
    }
  }
  assert.ok(GLOBAL.every((a) => aria.has(a)));
});
