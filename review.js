/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * How a person answers each question core's rules leave to WAI-ARIA, in
 * WAI-ARIA's words: the standard's review (core's standard.review), by core
 * rule and reason code. A finding only this standard's profile asks about
 * reads these in place of core's, which name WCAG; a scan that also runs a
 * WCAG profile reads core's.
 *
 * Each text may name what the finding found, {{name|text}}: the finding's
 * value for `name` (its i18n.params or data.details), or `text` where it has
 * none. Steps are short, in English, for someone without accessibility
 * training, and start from the element the report names.
 */

const PANE =
  "Open the Accessibility pane of the browser's developer tools (Chrome: Elements, then Accessibility; Firefox: Accessibility)";

// The roles each of core's name rules checks, as a step names them.
const NAME_RULES = {
  'binary-control-name-present': 'checkbox, radio or switch',
  'button-name-present': 'button',
  'combobox-name-present': 'combobox',
  'dialog-name-present': 'dialog',
  'empty-heading': 'heading',
  'link-name-present': 'link',
  'listbox-name-present': 'listbox',
  'menuitem-name-present': 'menu item',
  'meter-name-present': 'meter',
  'option-name-present': 'option',
  'progressbar-name-present': 'progress bar',
  'role-img-text-alternative-present': 'image',
  'searchbox-name-present': 'search box',
  'slider-name-present': 'slider',
  'spinbutton-name-present': 'spin button',
  'textbox-name-present': 'text box',
  'tooltip-name-present': 'tooltip',
  'treeitem-name-present': 'tree item'
};

// Why the scan could not read the name, by code: the first step.
const NAME_WHY = {
  name_internals: (what) =>
    `Inspect the ${what} the report names: a custom element, whose name its script may set through ElementInternals, which the scan cannot read.`,
  name_closedContent: (what) =>
    `Find the ${what} the report names and note the text or icon it shows: its content is in a closed shadow root, which the scan cannot read.`,
  name_contentTooDeep: (what) =>
    `Find the ${what} the report names and note the text it shows: its content is nested deeper than the scan reads.`
};

const nameReview = (ruleId, codes) => {
  const what = NAME_RULES[ruleId];
  return Object.fromEntries(
    codes.map((code) => [
      code,
      {
        steps: [
          NAME_WHY[code](what),
          `${PANE}, select the element, and read its Name.`,
          'With a screen reader, move to the element and listen to the name announced.'
        ],
        passWhen: `The Name is not empty and says what the ${what} is, and the screen reader announces it.`,
        failWhen: `The Name is empty, which fails WAI-ARIA 1.2: the ${what}'s role requires an accessible name.`
      }
    ])
  );
};

const ALL_NAME_CODES = ['name_internals', 'name_closedContent', 'name_contentTooDeep'];
const INTERNALS_ONLY = ['name_internals'];
const NAME_CODES = {
  'binary-control-name-present': INTERNALS_ONLY,
  'button-name-present': ALL_NAME_CODES,
  'combobox-name-present': INTERNALS_ONLY,
  'dialog-name-present': INTERNALS_ONLY,
  'empty-heading': ALL_NAME_CODES,
  'link-name-present': ALL_NAME_CODES,
  'listbox-name-present': INTERNALS_ONLY,
  'menuitem-name-present': ALL_NAME_CODES,
  'meter-name-present': INTERNALS_ONLY,
  'option-name-present': ALL_NAME_CODES,
  'progressbar-name-present': INTERNALS_ONLY,
  'role-img-text-alternative-present': INTERNALS_ONLY,
  'searchbox-name-present': INTERNALS_ONLY,
  'slider-name-present': INTERNALS_ONLY,
  'spinbutton-name-present': INTERNALS_ONLY,
  'textbox-name-present': INTERNALS_ONLY,
  'tooltip-name-present': ALL_NAME_CODES,
  'treeitem-name-present': ALL_NAME_CODES
};

const REVIEW = {
  '1.2': {
    ...Object.fromEntries(
      Object.entries(NAME_CODES).map(([ruleId, codes]) => [ruleId, nameReview(ruleId, codes)])
    ),
    'empty-table-header': {
      TABLE_HEADER_EMPTY: {
        steps: [
          'Find the header cell the report names and look at what it shows on screen.',
          `${PANE}, select the cell, and read its Name: an image with alt text or a labelled icon inside can give it one.`,
          'If it is the empty top-left corner of a table whose first column holds row headers, note that it heads nothing.'
        ],
        passWhen:
          'The Name is not empty and says what its column or row holds. A corner cell that heads nothing is better made a td, an ordinary cell.',
        failWhen:
          'The Name is empty, which fails WAI-ARIA 1.2: columnheader and rowheader require an accessible name.'
      }
    },
    'aria-allowed-attr': {
      ARIA_ATTR_DEPRECATED: {
        steps: [
          'Inspect the element the report names: it has {{attr|an aria-* attribute}} with role {{role|its role}}, on which WAI-ARIA 1.2 deprecates it.',
          'Work out what the attribute is meant to say here, such as that the element is disabled, has an error or opens a popup.',
          `${PANE} and check whether that state shows on the element.`,
          'Look for a way to say it that WAI-ARIA 1.2 supports: a native attribute (disabled), or a role that supports {{attr|the attribute}}, such as button.'
        ],
        passWhen:
          '{{attr|The attribute}} can be removed with nothing lost, or the element takes a role or native attribute that conveys the same state.',
        failWhen:
          'The state relies on {{attr|the attribute}} on role {{role|its role}}, which WAI-ARIA 1.2 deprecates there: authors SHOULD NOT use it, so replace it.'
      }
    },
    'aria-conditional-attr': {
      ARIA_ERRORMESSAGE_WITHOUT_TRUTHY_INVALID: {
        steps: [
          'Inspect the field the report names ({{element|the element}}): it has aria-errormessage, and its aria-invalid is {{ariaInvalid|absent or false}}.',
          'Enter an invalid value (or leave a required field empty) and submit or leave the field, so any error shows.',
          'When the error message shows, inspect the field again and read its aria-invalid.'
        ],
        passWhen:
          'Whenever the error message shows, the field has aria-invalid="true"; while no error shows, aria-invalid may be false.',
        failWhen:
          'The error message shows while aria-invalid is still absent or false, which fails WAI-ARIA 1.2 aria-errormessage: authors MUST use aria-invalid with it.'
      }
    },
    'aria-deprecated-role': {
      ARIA_ROLE_DEPRECATED: {
        steps: [
          'Inspect the element the report names: its role, {{role|a deprecated role}}, is deprecated in WAI-ARIA 1.2.',
          '{{guidance|Replace it with the role WAI-ARIA 1.2 gives in its place (list for directory).}}',
          `${PANE} and check which role the element and its items have after the change.`
        ],
        passWhen:
          'The element uses a current role that conveys the same structure, and its items keep the roles that role requires.',
        failWhen:
          'The element keeps role {{role|the deprecated role}}, which WAI-ARIA 1.2 deprecates: authors SHOULD NOT use it.'
      },
      ARIA_ROLE_AUTHOR_DISCOURAGED: {
        steps: [
          'Inspect the element the report names and note its tag and role="{{role|generic}}", which WAI-ARIA 1.2 keeps for browsers, not authors.',
          'If the tag is a plain container (div, span, b, i), the role changes nothing: remove it.',
          `Otherwise ${PANE.charAt(0).toLowerCase() + PANE.slice(1)} and check whether the element lost its own meaning (button, link, heading, list item, navigation).`
        ],
        passWhen:
          'The role is removed, or the element was a plain container and keeps nothing it needs.',
        failWhen:
          'The element keeps role="{{role|generic}}": WAI-ARIA 1.2 says authors SHOULD NOT use it, and an element that had a meaning of its own has lost it.'
      }
    },
    'aria-owns-valid': {
      ARIA_OWNS_ANCESTOR: {
        steps: [
          'Inspect the element the report names: its aria-owns names {{id|an id}}, which is the element itself or one of its ancestors.',
          'Work out which relationship the aria-owns was meant to state, and compare it with where the two elements sit in the page.',
          'Remove {{id|the id}} from aria-owns, and check in the Accessibility pane that the elements still have the parent and children they need.'
        ],
        passWhen:
          "The page's own structure gives the relationship, so the id can go. Remove it still: browsers ignore an element that owns its ancestor.",
        failWhen:
          'The relationship is stated only by an aria-owns that names {{id|an ancestor}}, which browsers ignore, so the element is not where its role needs it (WAI-ARIA 1.2 aria-owns).'
      }
    },
    'aria-required-attr': {
      ARIA_ATTR_REQUIRED_MISSING_IMPLICIT: {
        steps: [
          'Inspect the element the report names: role {{role|its role}} requires {{attr|a state}}, which it lacks, so browsers give it the default, {{implicit|the default value}}.',
          'Use the element as a person would: open and close a combobox popup with Alt+Down Arrow and Escape, or find where a heading sits in the page outline.',
          `${PANE} and check, at each step, whether {{attr|the state}} matches what the element shows.`
        ],
        passWhen:
          'The default {{implicit|value}} is right at every step, or the page sets {{attr|the state}} itself and keeps it up to date.',
        failWhen:
          'The element shows another value than the default {{implicit|value}} while {{attr|the state}} is not set, so role {{role|its role}} does not expose what WAI-ARIA 1.2 requires of it.'
      },
      state_internals: {
        steps: [
          'Inspect the custom element the report names and note its role and the state it lacks (such as checked or value): its script may set it through ElementInternals, which the scan cannot read.',
          `${PANE} and check whether that state shows for the element.`,
          'Operate the element (click it, press Space or the arrow keys) and check that the state shown changes.'
        ],
        passWhen: 'The state shows, and changes as the element is used.',
        failWhen:
          "The state is missing, or doesn't change when the element is used, which fails WAI-ARIA 1.2: its role requires it."
      }
    },
    'aria-valid-attr-value': {
      ARIA_ATTR_VALUE_TARGET_ABSENT: {
        steps: [
          'Inspect the element the report names: its {{attr|attribute}} refers to {{value|an id}}, and no element has that id yet.',
          'Use the page as a person would (open, expand, submit) to reach the state where that element should exist.',
          "In the developer tools console, run document.getElementById('…') with each id, and look in the markup for one that nearly matches (other case, a typo, or inside a shadow root)."
        ],
        passWhen:
          'An element with each id exists whenever {{attr|the attribute}} matters, and the Accessibility pane shows the name, description or relation it gives.',
        failWhen:
          '{{value|An id}} never names an element, so {{attr|the attribute}} refers to nothing, which WAI-ARIA 1.2 does not allow: an ID reference names an element in the same document.'
      },
      ARIA_HASPOPUP_ROLE_MISMATCH: {
        steps: [
          'Open the popup of the element the report names, with the mouse and with the keyboard (Enter, Space or Down Arrow).',
          `${PANE}, select the popup that appears, and read its role. When the page was scanned, the element it controls had role {{popupRole|another role}}.`,
          'Compare it with what aria-haspopup="{{haspopup|…}}" announces: a {{expectedRole|menu, listbox, tree, grid or dialog}} (true means menu).'
        ],
        passWhen: 'The popup that opens has role {{expectedRole|the one aria-haspopup names}}.',
        failWhen:
          'The popup has role {{popupRole|another role}}, not {{expectedRole|the one aria-haspopup names}}, which fails WAI-ARIA 1.2 aria-haspopup: the popup MUST have the role its value names.'
      }
    }
  }
};

module.exports = { REVIEW };
