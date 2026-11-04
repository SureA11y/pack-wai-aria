/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * How a person assesses each of WAI-ARIA 1.2's requirements by hand: what
 * core's proceduresFor gives for a requirement. Each is a requirement of
 * its own, with the test objective a person checks. The rules check what
 * the markup states (automation: 'partial'); a person checks the rest, in
 * the browser's accessibility tree, which shows each element's computed
 * role, name, states and properties.
 *
 * The steps list what is valid, not only where to look it up: which roles
 * need a name, which states each role requires, supports and prohibits,
 * which parents and children each role needs, and what value each attribute
 * takes. The lists are written from the Recommendation's own role tables
 * (scripts/data/wai-aria-1.2.json, the inventory's source), so they can't
 * drift from what the rules and docs/COVERAGE.md read; what the tables don't
 * hold, the attributes' value types and the author requirements stated only
 * in a role's or attribute's text, is written here, from the same
 * Recommendation (tests/procedures.test.js checks the types against
 * aria-query).
 *
 * Steps are in English, for someone without accessibility training.
 * failWhen names the requirement as {{requirement}}, which reads as
 * "WAI-ARIA <requirement>".
 */

const { REQUIREMENTS } = require('./requirements');
const SPEC = require('./scripts/data/wai-aria-1.2.json').roles;

const TREE =
  "Open the developer tools' accessibility tree (Chrome: Elements, then Accessibility; Firefox: Accessibility).";

const facet = (id, label, steps, passWhen, failWhen, tools = ['devtools']) => ({
  facets: [{ id, label, automation: 'partial', tools, steps: [TREE, ...steps], passWhen, failWhen }]
});

// WAI-ARIA 1.2's global states and properties, which any role takes. Four
// more are global in earlier versions and deprecated as such in 1.2
// (aria-disabled, aria-errormessage, aria-haspopup, aria-invalid): a role
// takes them only where its own table lists them.
const GLOBAL = [
  'aria-atomic',
  'aria-busy',
  'aria-controls',
  'aria-current',
  'aria-describedby',
  'aria-details',
  'aria-dropeffect',
  'aria-flowto',
  'aria-grabbed',
  'aria-hidden',
  'aria-keyshortcuts',
  'aria-label',
  'aria-labelledby',
  'aria-live',
  'aria-owns',
  'aria-relevant',
  'aria-roledescription'
];

// The value each state and property takes (WAI-ARIA 1.2, 6.6 and each
// attribute's "Value"), and what more its text requires of it.
const VALUES = {
  'true/false': [
    'aria-atomic',
    'aria-busy',
    'aria-disabled',
    'aria-modal',
    'aria-multiline',
    'aria-multiselectable',
    'aria-readonly',
    'aria-required'
  ],
  'true/false/undefined': ['aria-expanded', 'aria-grabbed', 'aria-hidden', 'aria-selected'],
  'true/false/mixed/undefined': ['aria-checked', 'aria-pressed'],
  integer: [
    'aria-colcount',
    'aria-colindex',
    'aria-colspan',
    'aria-level',
    'aria-posinset',
    'aria-rowcount',
    'aria-rowindex',
    'aria-rowspan',
    'aria-setsize'
  ],
  number: ['aria-valuemax', 'aria-valuemin', 'aria-valuenow'],
  'the id of one element on the page': ['aria-activedescendant', 'aria-details', 'aria-errormessage'],
  'the ids of elements on the page, separated by spaces': [
    'aria-controls',
    'aria-describedby',
    'aria-flowto',
    'aria-labelledby',
    'aria-owns'
  ],
  text: ['aria-keyshortcuts', 'aria-label', 'aria-placeholder', 'aria-roledescription', 'aria-valuetext']
};
const TOKENS = {
  'aria-autocomplete': ['inline', 'list', 'both', 'none'],
  'aria-current': ['page', 'step', 'location', 'date', 'time', 'true', 'false'],
  'aria-dropeffect': ['copy', 'execute', 'link', 'move', 'none', 'popup'],
  'aria-haspopup': ['false', 'true', 'menu', 'listbox', 'tree', 'grid', 'dialog'],
  'aria-invalid': ['grammar', 'false', 'spelling', 'true'],
  'aria-live': ['assertive', 'off', 'polite'],
  'aria-orientation': ['horizontal', 'undefined', 'vertical'],
  'aria-relevant': ['additions', 'all', 'removals', 'text'],
  'aria-sort': ['ascending', 'descending', 'none', 'other']
};
const TOKEN_LISTS = ['aria-dropeffect', 'aria-relevant'];

const ROLES = Object.entries(SPEC).filter(([, r]) => !r.abstract);
const ABSTRACT = Object.keys(SPEC).filter((role) => SPEC[role].abstract);
const list = (items) => items.join(', ');
// "a, b: x, y; c: z", for each role whose `pick` lists something, the roles
// that list the same together.
const byRole = (pick) => {
  const groups = new Map(); // "x, y" -> roles
  for (const [role, r] of ROLES) {
    const items = pick(r);
    if (!items.length) continue;
    const key = list(items);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(role);
  }
  return [...groups].map(([items, roles]) => `${list(roles)}: ${items}`).join('; ');
};
const rolesWhere = (test) => ROLES.filter(([, r]) => test(r)).map(([role]) => role);
// Whether a role is a widget: widget is among its superclasses, however far
// up.
const isWidget = (r, seen = new Set()) =>
  r.superclass.some(
    (sup) =>
      sup === 'widget' ||
      (!seen.has(sup) && SPEC[sup] && (seen.add(sup), isWidget(SPEC[sup], seen)))
  );

// A role's states and properties of its own: those it supports or inherits
// that are not global, nor deprecated on it.
const ownProps = (r) =>
  [...new Set([...r.requiredProps, ...r.supportedProps, ...r.inheritedProps])]
    .filter((p) => !GLOBAL.includes(p) && !r.deprecatedProps.includes(p))
    .sort();
// A required owned element as a step names it: "group > option".
const path = (p) => p.join(' > ');

const HOW = {
  '1.2': {
    'name-required': facet(
      'name-required',
      'Every element whose role requires an accessible name has one',
      [
        `Find every element with one of these roles, from its role attribute or its HTML element (<button>, <a href>, <img alt>, <table>, <dialog>, <input>, <select>, <h1>-<h6> and so on): ${list(rolesWhere((r) => r.nameRequired))}.`,
        'Find also every element of role form and every toolbar: WAI-ARIA 1.2 requires a name for each form, and for each toolbar when the page has more than one.',
        'Select each one and read its Name in the accessibility tree. Names come from aria-labelledby, aria-label, a <label>, alt, title, or, for roles named from their content (button, link, heading, cell, option, tab, treeitem and the like), the text inside.'
      ],
      'Every such element has a Name that says what it is.',
      'An element whose role requires a name has none, which fails {{requirement}}.',
      ['devtools', 'screen-reader']
    ),
    roles: facet(
      'roles-concrete',
      'Roles are ones authors may use, and not deprecated',
      [
        'In the Elements panel, search for role= and read each role attribute. Where it lists several roles, the first WAI-ARIA 1.2 defines is the one used.',
        `Check that it is none of the abstract roles, which authors MUST NOT use: ${list(ABSTRACT)}.`,
        `Note the deprecated roles, which authors SHOULD NOT use: ${list(rolesWhere((r) => r.deprecated))} (use list instead of directory). Note also role="generic", which WAI-ARIA 1.2 keeps for browsers: authors SHOULD NOT use it.`,
        'Note any role WAI-ARIA 1.2 does not define (a typo, or a role of another module such as doc-* or graphics-*): browsers ignore it, so check the element still has the role it needs.'
      ],
      'Every role is a concrete role WAI-ARIA 1.2 defines, and none is deprecated.',
      'An element uses an abstract role, which fails {{requirement}}. A deprecated role, or generic, goes against its recommendation: replace it.'
    ),
    'required-states': facet(
      'required-states',
      'Each role has the states and properties it requires',
      [
        `Find every element with one of these roles, and check it has the states and properties listed: ${byRole((r) => r.requiredProps)}. A separator needs aria-valuenow only when it can be focused.`,
        'A native element gives some of them itself: <input type="checkbox"> its checked state, <h2> its level, <input type="range"> its value. Check the accessibility tree shows each one.',
        'Operate each widget (click it, press Space, Enter or the arrow keys; open and close a combobox), and check the states are still there, with the right values, after each change.'
      ],
      'Every element has the states and properties its role requires, at every step.',
      'An element lacks a state or property its role requires, which fails {{requirement}}.',
      ['devtools', 'keyboard']
    ),
    'supported-attributes': facet(
      'supported-attributes',
      'Each aria-* attribute is one the role supports',
      [
        'Select each element with aria-* attributes and note its role.',
        `Any role takes the global states and properties: ${list(GLOBAL)}.`,
        `Besides those, each widget role takes only its own: ${byRole((r) => (isWidget(r) ? ownProps(r) : []))}.`,
        `And each other role: ${byRole((r) => (isWidget(r) ? [] : ownProps(r)))}. A role not listed takes only the global ones.`,
        `WAI-ARIA 1.2 deprecates aria-disabled, aria-errormessage, aria-haspopup and aria-invalid on the roles that don't list them above, and aria-dropeffect and aria-grabbed on every role: authors SHOULD NOT use them there.`
      ],
      "Every aria-* attribute is global or one of its role's own.",
      'An element carries an aria-* attribute its role does not support, which fails {{requirement}}. A deprecated one goes against its recommendation: remove it.'
    ),
    'prohibited-attributes': facet(
      'prohibited-attributes',
      'No element carries a state or property its role prohibits',
      [
        'Select each element with aria-label, aria-labelledby or aria-roledescription, and note its role. An element with no role of its own, such as a <div> or <span>, has role generic.',
        `Check its role does not prohibit them: ${byRole((r) => r.prohibitedProps)}.`
      ],
      "No element carries an attribute its role's \"Prohibited States and Properties\" lists.",
      'An element carries an attribute its role prohibits, which fails {{requirement}}.'
    ),
    'attribute-values': facet(
      'attribute-values',
      'Each state and property has a value of its type, in range',
      [
        'Select each element with aria-* attributes, and read each value.',
        `Check it is of the attribute's type: ${Object.entries(VALUES)
          .map(([type, attrs]) => `${type} for ${list(attrs)}`)
          .join('; ')}.`,
        `Check a token is one the attribute lists (${Object.entries(TOKENS)
          .map(([attr, tokens]) => `${attr}: ${list(tokens)}`)
          .join('; ')}), and ${list(TOKEN_LISTS)} take several, separated by spaces.`,
        'Check every id names an element on the page, and aria-activedescendant one the element contains or owns.',
        'For a range (slider, spinbutton, scrollbar, progressbar, meter, separator), check aria-valuemin is not above aria-valuemax, and aria-valuenow lies between them.',
        'For a set, check aria-posinset is at least 1 and not above aria-setsize, and aria-setsize is the number of items, or -1 when it is unknown; aria-level is at least 1.',
        'For a table or grid, check aria-colcount and aria-rowcount are the number of columns and rows (or -1 when unknown), aria-colindex and aria-rowindex are at least 1, grow along each row and column, and are not above the counts; aria-colspan is at least 1 and aria-rowspan at least 0, and no cell spans over the next.'
      ],
      'Every value is of its type and in range, and every reference names an element on the page.',
      'An attribute has a value its type does not allow, or out of its range, which fails {{requirement}}.'
    ),
    'owned-elements': facet(
      'owned-elements',
      'Containers own the elements their role requires, and each element has one owner',
      [
        'Select each container and expand its children in the accessibility tree: its owned elements are its children there, through aria-owns or with only plain containers (div, span) between.',
        `Check it owns at least one element of the roles its role requires, and only those (a group between where shown): ${byRole((r) => r.requiredOwned.map(path))}.`,
        'A spinbutton may own only a textbox and up to two buttons.',
        'Check that no element\'s id is named in the aria-owns of two elements.'
      ],
      'Every container owns only elements of the roles it requires, and no element has two owners.',
      'A container lacks an element its role requires, owns one it does not allow, or shares one with another owner, which fails {{requirement}}.'
    ),
    'context-roles': facet(
      'context-roles',
      'Elements are in the context their role requires',
      [
        'Select each element whose role needs a parent, and look at its parent in the accessibility tree: through aria-owns, or with only plain containers (div, span) between.',
        `Check its parent has a role it requires: ${byRole((r) => r.requiredContext)}. An option may also sit in a group within a listbox, and a treeitem in a group within a tree.`
      ],
      'Every such element is owned by a container of a role it requires.',
      'An element is outside the context its role requires, which fails {{requirement}}.'
    )
  }
};

const titled = (byVersion) =>
  Object.fromEntries(
    Object.entries(byVersion).map(([version, entries]) => [
      version,
      Object.fromEntries(
        Object.entries(entries).map(([id, entry]) => {
          const req = (REQUIREMENTS[version] || {})[id];
          return [id, req ? { title: req.title, ...entry } : entry];
        })
      )
    ])
  );

const PROCEDURES = titled(HOW);

const GROUPS = {
  '1.2': [
    {
      id: 'roles',
      title: 'Roles and structure',
      requirements: ['roles', 'name-required', 'owned-elements', 'context-roles']
    },
    {
      id: 'states',
      title: 'States and properties',
      requirements: [
        'required-states',
        'supported-attributes',
        'prohibited-attributes',
        'attribute-values'
      ]
    }
  ]
};

module.exports = { PROCEDURES, GROUPS, GLOBAL, VALUES, TOKENS };
