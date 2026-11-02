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
