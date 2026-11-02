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
 * Steps are short, in English, for someone without accessibility training.
 * failWhen names the requirement as {{requirement}}, which reads as
 * "WAI-ARIA <requirement>".
 */

const { REQUIREMENTS } = require('./requirements');

const TREE =
  "Open the developer tools' accessibility tree (Chrome: Elements, then Accessibility; Firefox: Accessibility).";

const facet = (id, label, steps, passWhen, failWhen, tools = ['devtools']) => ({
  facets: [{ id, label, automation: 'partial', tools, steps: [TREE, ...steps], passWhen, failWhen }]
});

const HOW = {
  '1.2': {
    'name-required': facet(
      'name-required',
      'Every element whose role requires an accessible name has one',
      [
        'Find the elements with a role that needs a name: dialogs, grids, tables, trees, tab panels, landmarks with a role repeated on the page, form fields and other widgets.',
        'Select each one and read its Name in the accessibility tree.'
      ],
      'Every such element has a name that says what it is.',
      'An element whose role requires a name has none, which fails {{requirement}}.',
      ['devtools', 'screen-reader']
    ),
    roles: facet(
      'roles-concrete',
      'Roles are ones authors may use, and not deprecated',
      [
        'In the Elements panel, search for role= and read each role attribute.',
        "Check each role against WAI-ARIA 1.2's list of roles: not an abstract role (command, widget, structure, landmark, input, range, section, sectionhead, select, composite, window, roletype), and not a deprecated one."
      ],
      'Every role is a concrete role WAI-ARIA 1.2 defines and does not deprecate.',
      'An element uses an abstract or prohibited role, which fails {{requirement}}.'
    ),
    'required-states': facet(
      'required-states',
      'Each role has the states and properties it requires',
      [
        "Select each element with an explicit role, and compare its states and properties with the role's \"Required States and Properties\" in WAI-ARIA 1.2 (a checkbox needs aria-checked, a slider aria-valuenow, a heading aria-level).",
        'Operate the widget, and check the states are still there after each change.'
      ],
      'Every element has the states and properties its role requires, at every step.',
      'An element lacks a state or property its role requires, which fails {{requirement}}.',
      ['devtools', 'keyboard']
    ),
    'supported-attributes': facet(
      'supported-attributes',
      'Each aria-* attribute is one the role supports',
      [
        'Select each element with aria-* attributes, and check that each attribute is a global one or listed among its role\'s "Supported States and Properties".'
      ],
      "Every aria-* attribute is global or supported by the element's role.",
      'An element carries an aria-* attribute its role does not support, which fails {{requirement}}.'
    ),
    'prohibited-attributes': facet(
      'prohibited-attributes',
      'No element carries a state or property its role prohibits',
      [
        'Select each element with aria-label, aria-labelledby or aria-roledescription, and check its role does not prohibit naming (generic, presentation, none, caption, code, deletion, insertion, paragraph, strong and the like).'
      ],
      "No element carries an attribute its role's \"Prohibited States and Properties\" lists.",
      'An element carries an attribute its role prohibits, which fails {{requirement}}.'
    ),
    'attribute-values': facet(
      'attribute-values',
      'Each state and property has a value of its type, in range',
      [
        'Select each element with aria-* attributes, and check each value against the attribute\'s type in WAI-ARIA 1.2: true/false, a token from its list, an integer, a number, or the id of an element on the page.',
        'For a range (slider, spinbutton, progressbar, meter), check aria-valuenow lies between aria-valuemin and aria-valuemax; for a set, that aria-posinset is not above aria-setsize.'
      ],
      'Every value is of its type, every reference names an element on the page, and every range value is in range.',
      'An attribute has a value its type does not allow, which fails {{requirement}}.'
    ),
    'owned-elements': facet(
      'owned-elements',
      'Containers own the elements their role requires, and each element has one owner',
      [
        'Select each container with a role (list, listbox, menu, grid, row, table, tablist, tree, radiogroup), and expand its children in the accessibility tree.',
        'Check its owned elements have the roles its "Required Owned Elements" lists, and that no element is named in two aria-owns.'
      ],
      'Every container owns only elements of the roles it requires, and no element has two owners.',
      'A container lacks an element its role requires, owns one it does not allow, or shares one with another owner, which fails {{requirement}}.'
    ),
    'context-roles': facet(
      'context-roles',
      'Elements are in the context their role requires',
      [
        'Select each element whose role needs a parent (listitem, option, menuitem, row, cell, gridcell, tab, treeitem), and look at its ancestors in the accessibility tree.',
        'Check it sits in a container of a role its "Required Context Role" lists.'
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

module.exports = { PROCEDURES, GROUPS };
