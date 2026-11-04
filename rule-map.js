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
  // The pack's own rules and its variant of core's name rule
  // (rules/automatic). The variant checks every name-from-author role
  // WAI-ARIA requires a name for, core's five and the five no WCAG rule owns,
  // so it takes the place of aria-role-name-present here.
  'wai-aria-role-name-present': {
    requirements: ['name-required'],
    reasonCodes: {
      name_missing: { outcome: 'fail' },
      name_internals: { outcome: 'cantTell' }
    }
  },
  'wai-aria-scrollbar-controls': {
    requirements: ['required-states'],
    reasonCodes: { SCROLLBAR_CONTROLS_MISSING: { outcome: 'fail' } }
  },
  'wai-aria-feed-articles': {
    requirements: ['owned-elements'],
    reasonCodes: {
      FEED_ARTICLE_MISSING: { outcome: 'fail' },
      FEED_CHILD_NOT_ARTICLE: { outcome: 'fail' }
    }
  },
  'wai-aria-caption-context': {
    requirements: ['context-roles'],
    reasonCodes: { CAPTION_CONTEXT_MISSING: { outcome: 'cantTell' } }
  },
  'wai-aria-presentational-attributes': {
    requirements: ['supported-attributes'],
    reasonCodes: { PRESENTATIONAL_ATTRIBUTE_UNSUPPORTED: { outcome: 'cantTell' } }
  },
  // Author requirements WAI-ARIA 1.2 states in a role's or an attribute's
  // text rather than its tables, each a MUST.
  'wai-aria-toolbar-names': {
    requirements: ['name-required'],
    reasonCodes: { TOOLBAR_NAME_MISSING: { outcome: 'fail' } }
  },
  'wai-aria-combobox-popup': {
    requirements: ['attribute-values'],
    reasonCodes: { COMBOBOX_POPUP_ROLE: { outcome: 'fail' } }
  },
  'wai-aria-spinbutton-owned': {
    requirements: ['owned-elements'],
    reasonCodes: {
      SPINBUTTON_OWNS_OTHER: { outcome: 'fail' },
      SPINBUTTON_OWNS_TOO_MANY: { outcome: 'fail' }
    }
  },
  'wai-aria-table-indexes': {
    requirements: ['attribute-values'],
    reasonCodes: {
      COLINDEX_NOT_INCREASING: { outcome: 'fail' },
      COLINDEX_ABOVE_COUNT: { outcome: 'fail' },
      ROWINDEX_NOT_INCREASING: { outcome: 'fail' },
      ROWINDEX_ABOVE_COUNT: { outcome: 'fail' },
      COLCOUNT_BELOW_COLUMNS: { outcome: 'fail' },
      ROWCOUNT_BELOW_ROWS: { outcome: 'fail' }
    }
  },
  'wai-aria-setsize': {
    requirements: ['attribute-values'],
    reasonCodes: {
      SETSIZE_BELOW_ITEMS: { outcome: 'fail' },
      SETSIZE_INCONSISTENT: { outcome: 'fail' }
    }
  },
  'wai-aria-keyshortcuts': {
    requirements: ['attribute-values'],
    reasonCodes: {
      KEYSHORTCUTS_MODIFIER_NAME: { outcome: 'fail' },
      KEYSHORTCUTS_MODIFIER_ORDER: { outcome: 'fail' }
    }
  },
  // Core's empty-heading and empty-table-header: a heading, column header or
  // row header takes its name from its content, so an empty one has none. A
  // header cell with no visible text may still be named by text only a
  // screen reader reads, so that stays a question.
  'empty-heading': {
    requirements: ['name-required'],
    reasonCodes: {
      HEADING_EMPTY: { outcome: 'fail' },
      name_closedContent: { outcome: 'cantTell' },
      name_contentTooDeep: { outcome: 'cantTell' },
      name_internals: { outcome: 'cantTell' }
    }
  },
  'empty-table-header': {
    requirements: ['name-required'],
    reasonCodes: {
      TABLE_HEADER_EMPTY: { outcome: 'cantTell' },
      TABLE_HEADER_NAME_NOT_VISIBLE_TEXT: { requirements: [] }
    }
  },
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
      // A required state left to its default (a heading's level, a
      // combobox's expanded state): WAI-ARIA's role table gives none, so it is
      // a question here, not nothing.
      ARIA_ATTR_REQUIRED_MISSING_IMPLICIT: { outcome: 'cantTell' }
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
      // "Authors MUST ensure the value of aria-valuemax is greater than or
      // equal to the value of aria-valuemin" (aria-valuemax, aria-valuemin).
      ARIA_VALUE_RANGE_INVERTED: { outcome: 'fail' }
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
