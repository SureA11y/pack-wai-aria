/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Which of WAI-ARIA 1.2's requirements each of core's rules checks, and
 * what each of its findings means under WAI-ARIA, by reason code.
 *
 * Core's rules are WCAG rules: a finding's outcome there is its WCAG one.
 * WAI-ARIA can be certain where WCAG asks: an unnamed role="grid" is
 * cantTell for WCAG 4.1.2, which depends on what the page shows, and breaks
 * WAI-ARIA's "Accessible Name Required" for certain. So each code says, from
 * the specification's own wording:
 *
 * - outcome: 'fail' where WAI-ARIA says MUST or MUST NOT: the finding fails
 *   the requirement, whatever WCAG makes of it;
 * - outcome: 'cantTell' where WAI-ARIA recommends (SHOULD, "not
 *   recommended") or what script does decides: a question here, though
 *   WCAG may fail it;
 * - requirements: [] for a code WAI-ARIA states no author requirement for
 *   (an unknown role token, a required state the role's native element
 *   gives): the finding doesn't count here.
 *
 * Every reason code of every rule listed is placed, so a code core adds
 * shows in tests/rule-map.test.js before it counts by default. Reason codes
 * are core's stable contract (its docs/API_STABILITY.md).
 */

const ROWS = {
  'aria-allowed-attr': {
    requirements: ['supported-attributes'],
    reasonCodes: {
      ARIA_ATTR_DEPRECATED: { outcome: 'cantTell' },
      ARIA_ATTR_NOT_ALLOWED: { outcome: 'fail' },
      ARIA_ATTR_NOT_ALLOWED_ROLELESS: { outcome: 'fail' }
    }
  },
  'aria-conditional-attr': {
    requirements: ['attribute-values'],
    reasonCodes: {
      ARIA_ERRORMESSAGE_WITHOUT_TRUTHY_INVALID: { outcome: 'cantTell' }
    }
  },
  'aria-deprecated-role': {
    requirements: ['roles'],
    reasonCodes: {
      ARIA_ROLE_AUTHOR_DISCOURAGED: { outcome: 'cantTell' },
      ARIA_ROLE_AUTHOR_PROHIBITED: { outcome: 'fail' },
      ARIA_ROLE_DEPRECATED: { outcome: 'cantTell' }
    }
  },
  'aria-owns-valid': {
    requirements: ['owned-elements'],
    reasonCodes: {
      ARIA_OWNS_ANCESTOR: { outcome: 'cantTell' },
      ARIA_OWNS_DUPLICATE: { outcome: 'fail' }
    }
  },
  'aria-prohibited-attr': {
    requirements: ['prohibited-attributes'],
    reasonCodes: {
      ARIA_ATTR_PROHIBITED: { outcome: 'fail' },
      ARIA_ATTR_PROHIBITED_ROLELESS: { outcome: 'fail' },
      ARIA_ATTR_PROHIBITED_ROLELESS_NEEDS_REVIEW: { outcome: 'fail' }
    }
  },
  'aria-prohibited-children': {
    requirements: ['owned-elements'],
    reasonCodes: {
      ARIA_PROHIBITED_CHILD: { outcome: 'fail' },
      ARIA_PROHIBITED_CHILD_ROLELESS: { outcome: 'fail' }
    }
  },
  'aria-required-attr': {
    requirements: ['required-states'],
    reasonCodes: {
      ARIA_ATTR_REQUIRED_MISSING: { outcome: 'fail' },
      state_internals: { outcome: 'cantTell' },
      ARIA_ATTR_REQUIRED_MISSING_IMPLICIT: { requirements: [] }
    }
  },
  'aria-required-children': {
    requirements: ['owned-elements'],
    reasonCodes: {
      ARIA_REQUIRED_CHILD_MISSING: { outcome: 'fail' },
      ARIA_REQUIRED_CHILD_TEXT_ONLY: { outcome: 'fail' }
    }
  },
  'aria-required-parent': {
    requirements: ['context-roles'],
    reasonCodes: {
      ARIA_REQUIRED_PARENT_MISSING: { outcome: 'fail' }
    }
  },
  'aria-role-name-present': {
    requirements: ['name-required'],
    reasonCodes: {
      name_missing: { outcome: 'fail' },
      name_internals: { outcome: 'cantTell' }
    }
  },
  'aria-roles-valid': {
    requirements: ['roles'],
    reasonCodes: {
      ARIA_ROLE_ABSTRACT: { outcome: 'fail' },
      ARIA_ROLE_INVALID: { requirements: [] }
    }
  },
  'aria-valid-attr-value': {
    requirements: ['attribute-values'],
    reasonCodes: {
      ARIA_ACTIVEDESCENDANT_OUTSIDE: { outcome: 'fail' },
      ARIA_ATTR_VALUE_INVALID: { outcome: 'fail' },
      ARIA_ATTR_VALUE_TARGET_ABSENT: { outcome: 'cantTell' },
      ARIA_HASPOPUP_ROLE_MISMATCH: { outcome: 'cantTell' },
      ARIA_POSINSET_EXCEEDS_SETSIZE: { outcome: 'fail' },
      ARIA_VALUENOW_OUT_OF_RANGE: { outcome: 'cantTell' },
      ARIA_VALUE_RANGE_INVERTED: { outcome: 'cantTell' }
    }
  },
  'binary-control-name-present': {
    requirements: ['name-required'],
    reasonCodes: {
      name_internals: { outcome: 'cantTell' },
      name_missing: { outcome: 'fail' }
    }
  },
  'button-name-present': {
    requirements: ['name-required'],
    reasonCodes: {
      name_closedContent: { outcome: 'cantTell' },
      name_contentTooDeep: { outcome: 'cantTell' },
      name_internals: { outcome: 'cantTell' },
      name_missing: { outcome: 'fail' }
    }
  },
  'combobox-name-present': {
    requirements: ['name-required'],
    reasonCodes: {
      name_internals: { outcome: 'cantTell' },
      name_missing: { outcome: 'fail' }
    }
  },
  'dialog-name-present': {
    requirements: ['name-required'],
    reasonCodes: {
      name_internals: { outcome: 'cantTell' },
      name_missing: { outcome: 'fail' }
    }
  },
  'landmark-role-name-present': {
    requirements: ['name-required'],
    reasonCodes: {
      LANDMARK_ROLE_NAME_MISSING: { outcome: 'fail' }
    }
  },
  'link-name-present': {
    requirements: ['name-required'],
    reasonCodes: {
      name_closedContent: { outcome: 'cantTell' },
      name_contentTooDeep: { outcome: 'cantTell' },
      name_internals: { outcome: 'cantTell' },
      name_missing: { outcome: 'fail' }
    }
  },
  'listbox-name-present': {
    requirements: ['name-required'],
    reasonCodes: {
      name_internals: { outcome: 'cantTell' },
      name_missing: { outcome: 'fail' }
    }
  },
  'menuitem-name-present': {
    requirements: ['name-required'],
    reasonCodes: {
      name_closedContent: { outcome: 'cantTell' },
      name_contentTooDeep: { outcome: 'cantTell' },
      name_internals: { outcome: 'cantTell' },
      name_missing: { outcome: 'fail' }
    }
  },
  'meter-name-present': {
    requirements: ['name-required'],
    reasonCodes: {
      name_internals: { outcome: 'cantTell' },
      name_missing: { outcome: 'fail' }
    }
  },
  'option-name-present': {
    requirements: ['name-required'],
    reasonCodes: {
      name_closedContent: { outcome: 'cantTell' },
      name_contentTooDeep: { outcome: 'cantTell' },
      name_internals: { outcome: 'cantTell' },
      name_missing: { outcome: 'fail' }
    }
  },
  'progressbar-name-present': {
    requirements: ['name-required'],
    reasonCodes: {
      name_internals: { outcome: 'cantTell' },
      name_missing: { outcome: 'fail' }
    }
  },
  'role-img-text-alternative-present': {
    requirements: ['name-required'],
    reasonCodes: {
      emptyAriaLabel: { outcome: 'fail' },
      emptyAriaLabelledby: { outcome: 'fail' },
      missingTextAlternative: { outcome: 'fail' },
      nameNotResolved: { outcome: 'fail' },
      name_internals: { outcome: 'cantTell' }
    }
  },
  'searchbox-name-present': {
    requirements: ['name-required'],
    reasonCodes: {
      name_internals: { outcome: 'cantTell' },
      name_missing: { outcome: 'fail' }
    }
  },
  'slider-name-present': {
    requirements: ['name-required'],
    reasonCodes: {
      name_internals: { outcome: 'cantTell' },
      name_missing: { outcome: 'fail' }
    }
  },
  'spinbutton-name-present': {
    requirements: ['name-required'],
    reasonCodes: {
      name_internals: { outcome: 'cantTell' },
      name_missing: { outcome: 'fail' }
    }
  },
  'textbox-name-present': {
    requirements: ['name-required'],
    reasonCodes: {
      name_internals: { outcome: 'cantTell' },
      name_missing: { outcome: 'fail' }
    }
  },
  'tooltip-name-present': {
    requirements: ['name-required'],
    reasonCodes: {
      name_closedContent: { outcome: 'cantTell' },
      name_contentTooDeep: { outcome: 'cantTell' },
      name_internals: { outcome: 'cantTell' },
      name_missing: { outcome: 'fail' }
    }
  },
  'treeitem-name-present': {
    requirements: ['name-required'],
    reasonCodes: {
      name_closedContent: { outcome: 'cantTell' },
      name_contentTooDeep: { outcome: 'cantTell' },
      name_internals: { outcome: 'cantTell' },
      name_missing: { outcome: 'fail' }
    }
  }
};

const RULE_REQUIREMENTS = { '1.2': ROWS };

module.exports = { RULE_REQUIREMENTS };
