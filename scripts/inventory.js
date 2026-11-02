/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The inventory of WAI-ARIA 1.2's author requirements that a rule can check
 * from the markup, and what the pack's profile makes of each: one page per
 * case, scanned with wai-aria-1.2, and the case's element looked for in the
 * findings.
 *
 *   node scripts/inventory.js           writes docs/COVERAGE.md and docs/coverage.json
 *   node scripts/inventory.js --json    prints the cases as JSON
 *
 * WAI-ARIA 1.2's roles, their states and properties, and their owned and
 * context roles come from the Recommendation's own tables
 * (scripts/data/wai-aria-1.2.json, from scripts/extract-spec.js). The
 * DPUB-ARIA and Graphics-ARIA roles, and the attributes' value types, come
 * from aria-query, which core's own ARIA tables are generated from.
 *
 * Each case's page is otherwise valid: the element has its required states
 * and properties, its required owned elements and context, and a name, but
 * for the one thing the case takes away or adds. Its element is
 * id="t". Each case is one of:
 *
 * - fail: a finding on the element fails the requirement under the profile;
 * - question: a finding on the element is a question under the profile
 *   (cantTell), or fails another of its requirements;
 * - wcag only: only a rule the profile doesn't map reports the element;
 * - missed: nothing reports the element.
 *
 * The pages run in jsdom, which has no layout: a case that depends on what a
 * browser renders is not among them.
 */

const fs = require('node:fs');
const path = require('node:path');
const { roles, aria } = require('aria-query');
const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const pack = require('..');

const ROOT = path.join(__dirname, '..');
const PROFILE = 'wai-aria-1.2';

const SPEC = require('./data/wai-aria-1.2.json').roles;
const moduleOf = (role) =>
  role.startsWith('doc-') ? 'DPUB-ARIA 1.1' : role.startsWith('graphics-') ? 'Graphics-ARIA 1.0' : 'WAI-ARIA 1.2';

// Each role as the cases read it: from the Recommendation for WAI-ARIA 1.2,
// from aria-query for the modules. requiredOwned is a list of paths from the
// container down; aria-query lists them the other way.
const DEFS = {};
for (const [role, r] of Object.entries(SPEC)) {
  DEFS[role] = {
    abstract: r.abstract,
    nameRequired: r.nameRequired,
    nameFrom: r.nameFrom,
    requiredProps: r.requiredProps,
    requiredContext: r.requiredContext,
    requiredOwned: r.requiredOwned,
    prohibitedProps: r.prohibitedProps,
    // The table lists required states apart from supported ones.
    supported: [...r.requiredProps, ...r.supportedProps, ...r.inheritedProps],
    implicitDefaults: r.implicitDefaults,
    deprecated: r.deprecated,
    deprecatedProps: r.deprecatedProps
  };
}
for (const role of roles.keys()) {
  if (moduleOf(role) === 'WAI-ARIA 1.2') continue;
  const r = roles.get(role);
  DEFS[role] = {
    abstract: r.abstract,
    nameRequired: r.accessibleNameRequired,
    nameFrom: r.nameFrom || [],
    requiredProps: Object.keys(r.requiredProps || {}),
    requiredContext: r.requiredContextRole || [],
    requiredOwned: (r.requiredOwnedElements || []).map((p) => p.slice().reverse()),
    prohibitedProps: r.prohibitedProps || [],
    supported: Object.keys(r.props || {}),
    implicitDefaults: {},
    deprecated: false,
    deprecatedProps: []
  };
}
const ALL = Object.keys(DEFS);
const def = (role) => DEFS[role];
const concrete = ALL.filter((r) => !def(r).abstract);
const GLOBALS = Object.keys(roles.get('roletype').props);

// A valid value of an attribute, and an invalid one (null: no value is
// invalid, as for a string).
function validValue(attr) {
  const a = aria.get(attr) || {};
  switch (a.type) {
    case 'boolean':
    case 'tristate':
    case 'true/false/undefined':
      return 'true';
    case 'integer':
    case 'number':
      return '1';
    case 'id':
    case 'idlist':
      return 'ref';
    case 'token':
    case 'tokenlist':
      return String((a.values || ['true'])[0]);
    default:
      return 'x';
  }
}
function invalidValue(attr) {
  const a = aria.get(attr) || {};
  switch (a.type) {
    case 'boolean':
    case 'tristate':
    case 'true/false/undefined':
    case 'token':
    case 'tokenlist':
      return 'bogus';
    case 'integer':
    case 'number':
      return 'one';
    case 'id':
    case 'idlist':
      return 'nowhere';
    default:
      return null;
  }
}

// The path a container's owned element takes, when one role will do.
function ownedPathOf(role) {
  const owned = def(role).requiredOwned || [];
  return owned.find((p) => p.length === 1) || owned[0] || null;
}

// The context a role is built in: one that needs no context itself where it
// can, so a page has as few levels as it can.
function requiredContextOf(role) {
  return def(role).requiredContext || [];
}
// group and rowgroup are themselves only valid inside a container, which
// aria-query doesn't say: a container comes first.
const WRAPPERS = ['group', 'rowgroup'];
function contextOf(role) {
  const list = requiredContextOf(role);
  return (
    list.find((c) => !WRAPPERS.includes(c) && !requiredContextOf(c).length) ||
    list.find((c) => !WRAPPERS.includes(c)) ||
    list[0] ||
    null
  );
}

const attrs = (o) =>
  Object.entries(o)
    .map(([k, v]) => ` ${k}="${String(v).replace(/"/g, '&quot;')}"`)
    .join('');

/**
 * A valid element of `role`, as HTML: its required states and properties,
 * a name, an owned element of the role it requires, inside the context it
 * requires; `opts` takes one of these away or changes the element's
 * attributes. `depth` stops the context and owned chains.
 */
function build(role, opts = {}, depth = 0, id = 't') {
  const d = def(role);
  const a = { role };
  if (id) a.id = id;
  for (const p of d.requiredProps || []) {
    if (opts.omitProp !== p) a[p] = validValue(p);
  }
  if (d.nameRequired && !opts.omitName) a['aria-label'] = 'Name';
  Object.assign(a, opts.attrs || {});
  for (const k of Object.keys(opts.remove || {})) delete a[k];
  let inner = '';
  if (opts.children !== undefined) inner = opts.children;
  else if (!opts.omitOwned && depth < 3) {
    const owned = ownedPathOf(role);
    if (owned) {
      inner = build(owned[owned.length - 1], { omitContext: true }, depth + 1, null);
      for (const wrapper of owned.slice(0, -1).reverse()) {
        inner = build(wrapper, { children: inner, omitContext: true }, depth + 1, null);
      }
    }
  }
  if (!inner && !d.nameRequired && (d.nameFrom || []).includes('contents')) inner = 'Text';
  let html = `<div${attrs(a)}>${inner}</div>`;
  const context = contextOf(role);
  if (context && !opts.omitContext && depth < 3) {
    html = build(context, { children: html }, depth + 1, null);
  }
  return html;
}

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>Inventory</title></head><body><main><span id="ref">Reference</span>${body}</main></body></html>`;

// What the profile makes of the element id="t": the requirements a finding
// on it fails, those it asks about, and the rules that report it.
function judge(body) {
  const result = runa11yCoreOnHtml(page(body), {
    engineOptions: { packs: [pack], profile: PROFILE }
  });
  const onTarget = (o) => /\bid="t"/.test(String((o && o.html) || ''));
  const fails = new Set();
  const asks = new Set();
  const rules = new Set();
  const byId = new Map(result.checksResults.map((c) => [c.ruleId, c]));
  for (const c of result.checksResults) {
    if ((c.occurrences || []).some(onTarget)) rules.add(c.ruleId);
  }
  for (const rollup of result.rulesResults) {
    const requirement = String(rollup.ruleId).replace(`${PROFILE}-`, '');
    for (const contributor of (rollup.data && rollup.data.details && rollup.data.details.contributors) || []) {
      const check = byId.get(contributor.testId);
      if (!check) continue;
      (check.occurrences || []).forEach((o, i) => {
        if (!onTarget(o)) return;
        const verdict = Array.isArray(contributor.findingOutcomes)
          ? contributor.findingOutcomes[i]
          : o.occurrenceOutcome || check.outcome;
        if (verdict === 'fail') fails.add(requirement);
        else if (verdict === 'cantTell') asks.add(requirement);
      });
    }
  }
  return { fails: [...fails].sort(), asks: [...asks].sort(), rules: [...rules].sort() };
}

function statusOf(requirement, j) {
  if (j.fails.includes(requirement)) return 'fail';
  if (j.fails.length || j.asks.length) return 'question';
  if (j.rules.length) return 'wcag only';
  return 'missed';
}

const cases = [];
function add(requirement, role, label, body, note) {
  const j = judge(body);
  cases.push({
    requirement,
    module: role ? moduleOf(role) : 'WAI-ARIA 1.2',
    role: role || null,
    case: label,
    status: statusOf(requirement, j),
    failsUnder: j.fails,
    asksUnder: j.asks,
    reportedBy: j.rules,
    ...(note ? { note } : {})
  });
}

// Names required: the role with no name from any source.
for (const role of concrete.filter((r) => def(r).nameRequired)) {
  add('name-required', role, 'no accessible name', build(role, { omitName: true }));
}

// Roles: abstract roles, and those 1.2 deprecates.
for (const role of ALL.filter((r) => def(r).abstract)) {
  add('roles', role, 'abstract role used', `<div id="t" role="${role}">Text</div>`);
}
for (const role of concrete.filter((r) => def(r).deprecated)) {
  add('roles', role, 'deprecated role used', build(role), 'Deprecated in 1.2: authors SHOULD NOT use it, a question at most.');
}

// Required states and properties: each one left out.
for (const role of concrete) {
  for (const p of def(role).requiredProps || []) {
    const implicit = (def(role).implicitDefaults || {})[p];
    // A separator needs a value only when it can be focused, as a splitter.
    const focusable = role === 'separator' ? { tabindex: '0' } : {};
    add('required-states', role, `no ${p}${role === 'separator' ? ' (focusable)' : ''}`, build(role, { omitProp: p, attrs: focusable }),
      implicit ? `1.2 gives it a default (${implicit}): no failure.` : undefined);
  }
}

// Supported states and properties 1.2 deprecates on a role: one case per
// attribute, on the first role that has it deprecated.
const deprecatedSeen = new Set();
for (const role of concrete) {
  for (const p of def(role).deprecatedProps || []) {
    if (deprecatedSeen.has(p)) continue;
    deprecatedSeen.add(p);
    add('supported-attributes', role, `${p} deprecated on the role`, build(role, { attrs: { [p]: validValue(p) } }),
      'Deprecated on this role in 1.2: authors SHOULD NOT use it, a question at most.');
  }
}

// Supported states and properties: one the role doesn't support. The
// first non-global attribute the role leaves out, in this order.
const PROBES = ['aria-checked', 'aria-selected', 'aria-expanded', 'aria-valuenow', 'aria-level', 'aria-pressed', 'aria-required'];
for (const role of concrete) {
  const supported = new Set([...GLOBALS, ...(def(role).supported || [])]);
  const prohibited = new Set(def(role).prohibitedProps || []);
  const probe = PROBES.find((p) => !supported.has(p) && !prohibited.has(p));
  if (probe) add('supported-attributes', role, `${probe} not supported`, build(role, { attrs: { [probe]: validValue(probe) } }));
}

// Prohibited states and properties: each one the role prohibits.
for (const role of concrete) {
  for (const p of def(role).prohibitedProps || []) {
    add('prohibited-attributes', role, `${p} prohibited`, build(role, { attrs: { [p]: p === 'aria-labelledby' ? 'ref' : 'Name' } }));
  }
}

// Values: an invalid value of each attribute, on a role that supports it.
for (const attr of [...aria.keys()]) {
  const bad = invalidValue(attr);
  if (bad === null) continue;
  const role = GLOBALS.includes(attr)
    ? 'group'
    : concrete.find((r) => (def(r).supported || []).includes(attr) && moduleOf(r) === 'WAI-ARIA 1.2');
  if (!role) continue;
  add('attribute-values', role, `${attr}="${bad}" (${(aria.get(attr) || {}).type})`, build(role, { attrs: { [attr]: bad } }));
}
// Values in range, and references to the right elements.
const RANGES = [
  ['slider', { 'aria-valuemin': '0', 'aria-valuemax': '10', 'aria-valuenow': '20' }, 'aria-valuenow above aria-valuemax'],
  ['slider', { 'aria-valuemin': '10', 'aria-valuemax': '0', 'aria-valuenow': '5' }, 'aria-valuemin above aria-valuemax'],
  ['heading', { 'aria-level': '0' }, 'aria-level 0'],
  ['option', { 'aria-posinset': '5', 'aria-setsize': '3' }, 'aria-posinset above aria-setsize'],
  ['option', { 'aria-posinset': '0', 'aria-setsize': '3' }, 'aria-posinset 0'],
  ['row', { 'aria-rowindex': '0' }, 'aria-rowindex 0'],
  ['gridcell', { 'aria-colindex': '0' }, 'aria-colindex 0'],
  ['gridcell', { 'aria-colspan': '0' }, 'aria-colspan 0'],
  ['gridcell', { 'aria-rowspan': '-1' }, 'aria-rowspan below 0']
];
for (const [role, a, label] of RANGES) add('attribute-values', role, label, build(role, { attrs: a }));
add('attribute-values', 'listbox', 'aria-activedescendant names an element it does not own',
  build('listbox', { attrs: { tabindex: '0', 'aria-activedescendant': 'ref' } }));
add('attribute-values', 'textbox', 'aria-errormessage without aria-invalid',
  build('textbox', { attrs: { 'aria-errormessage': 'ref' } }));
add('attribute-values', 'group', 'aria-labelledby names no element',
  build('group', { attrs: { 'aria-labelledby': 'nowhere' } }));

// Owned elements: a container with none of the roles it requires, and with
// a child of a role it doesn't allow.
for (const role of concrete.filter((r) => (def(r).requiredOwned || []).length)) {
  add('owned-elements', role, 'owns none of its required roles', build(role, { children: '' }));
  add('owned-elements', role, 'owns a button', build(role, { children: '<div role="button" tabindex="0">Go</div>' }));
}
add('owned-elements', 'option', 'owned twice (aria-owns)',
  `<div role="listbox" aria-label="A" aria-owns="t"></div><div role="listbox" aria-label="B" aria-owns="t"></div><div id="t" role="option" aria-selected="false">One</div>`);

// Context roles: an element outside the context it requires.
for (const role of concrete.filter((r) => requiredContextOf(r).length)) {
  add('context-roles', role, 'outside its required context', build(role, { omitContext: true }));
}

// The output.
const order = ['name-required', 'roles', 'required-states', 'supported-attributes', 'prohibited-attributes', 'attribute-values', 'owned-elements', 'context-roles'];
const { REQUIREMENTS } = require('../requirements');
const STATUS = ['fail', 'question', 'wcag only', 'missed'];

if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify(cases, null, 2) + '\n');
  process.exit(0);
}

const count = (list, s) => list.filter((c) => c.status === s).length;
const lines = [];
lines.push('# Coverage of WAI-ARIA 1.2');
lines.push('');
lines.push(
  "What the `wai-aria-1.2` profile makes of each author requirement a rule can check from the markup. Each case is a page that breaks one requirement, and nothing else, scanned with the profile. `npm run inventory` writes this file and `docs/coverage.json` again, from the core it runs with; [`scripts/inventory.js`](../scripts/inventory.js) says how each page is built."
);
lines.push('');
lines.push('- **fail**: a finding on the element fails the requirement.');
lines.push('- **question**: a finding on the element is a question for the requirement, or fails another of the profile\'s requirements.');
lines.push("- **wcag only**: only a rule the profile doesn't map reports it.");
lines.push('- **missed**: nothing reports it.');
lines.push('');
lines.push("WAI-ARIA 1.2's roles, states and properties are the Recommendation's own tables ([`scripts/data/wai-aria-1.2.json`](../scripts/data/wai-aria-1.2.json)). The DPUB-ARIA and Graphics-ARIA roles come from `aria-query`, and are listed apart: they are modules of their own, not WAI-ARIA 1.2.");
lines.push('');
lines.push('## Summary');
lines.push('');
lines.push('| Requirement | Cases | fail | question | wcag only | missed |');
lines.push('| --- | --- | --- | --- | --- | --- |');
const core = cases.filter((c) => c.module === 'WAI-ARIA 1.2');
for (const r of order) {
  const list = core.filter((c) => c.requirement === r);
  lines.push(`| ${REQUIREMENTS['1.2'][r].title} (\`${r}\`) | ${list.length} | ${STATUS.map((s) => count(list, s)).join(' | ')} |`);
}
lines.push(`| **All** | ${core.length} | ${STATUS.map((s) => count(core, s)).join(' | ')} |`);
lines.push('');
const modules = cases.filter((c) => c.module !== 'WAI-ARIA 1.2');
if (modules.length) {
  lines.push(`DPUB-ARIA and Graphics-ARIA roles: ${modules.length} cases, ${STATUS.map((s) => `${count(modules, s)} ${s}`).join(', ')}.`);
  lines.push('');
}
for (const r of order) {
  const list = cases.filter((c) => c.requirement === r);
  if (!list.length) continue;
  lines.push(`## ${REQUIREMENTS['1.2'][r].title}`);
  lines.push('');
  lines.push('| Role | Case | Status | Reported by | Note |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const c of list) {
    const by = c.reportedBy.length ? c.reportedBy.map((x) => `\`${x}\``).join(', ') : '';
    const where = c.status === 'question' && c.failsUnder.length ? `fails ${c.failsUnder.join(', ')}` : '';
    const note = [where, c.note || '', c.module !== 'WAI-ARIA 1.2' ? c.module : ''].filter(Boolean).join('; ');
    lines.push(`| \`${c.role}\` | ${c.case.replace(/\|/g, '\\|')} | ${c.status} | ${by} | ${note} |`);
  }
  lines.push('');
}

fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs', 'COVERAGE.md'), lines.join('\n'));
fs.writeFileSync(path.join(ROOT, 'docs', 'coverage.json'), JSON.stringify(cases, null, 2) + '\n');
process.stdout.write(
  `${cases.length} cases: ${STATUS.map((s) => `${count(cases, s)} ${s}`).join(', ')}\n`
);
