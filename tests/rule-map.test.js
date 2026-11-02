'use strict';

// Every reason code of every core rule the map lists is placed: a code core
// adds to one of them shows here before it counts toward a requirement by
// default. And every rule the map lists is one of core's.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { getChecksCatalog } = require('@surea11y/core');
const { RULE_REQUIREMENTS } = require('../rule-map');
const { REQUIREMENTS } = require('../requirements');

const coreDir = path.dirname(require.resolve('@surea11y/core/package.json'));
const { reasonCodes } = require(path.join(coreDir, 'scripts/data/finding-ids.json'));
const coreRules = new Set(getChecksCatalog().map((r) => r.ruleId));

// The pack's own rules and variants, with the codes each gives: a
// variant's are its core rule's.
const pack = require('..');
const OWN = Object.fromEntries(
  (pack.rules || []).map((r) => [
    r.id,
    r.from ? reasonCodes[r.from] || [] : (r.meta && r.meta.reasonCodes) || []
  ])
);

for (const [version, rows] of Object.entries(RULE_REQUIREMENTS)) {
  test(`${version}: every rule is core's or the pack's, and every one of its codes is placed`, () => {
    for (const [ruleId, row] of Object.entries(rows)) {
      const own = Object.prototype.hasOwnProperty.call(OWN, ruleId);
      assert.ok(own || coreRules.has(ruleId), `${ruleId} is a core rule or the pack's`);
      const placed = Object.keys(row.reasonCodes || {}).sort();
      assert.deepEqual(placed, [...((own ? OWN[ruleId] : reasonCodes[ruleId]) || [])].sort(), ruleId);
    }
  });

  test(`${version}: every requirement has a rule, and every code a known outcome`, () => {
    const used = new Set();
    for (const [ruleId, row] of Object.entries(rows)) {
      for (const id of row.requirements) used.add(id);
      for (const [code, c] of Object.entries(row.reasonCodes || {})) {
        assert.ok(
          c.outcome === undefined || c.outcome === 'fail' || c.outcome === 'cantTell',
          `${ruleId} ${code}`
        );
        for (const id of c.requirements || []) used.add(id);
      }
    }
    assert.deepEqual([...used].sort(), Object.keys(REQUIREMENTS[version]).sort());
  });
}
