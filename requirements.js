/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * WAI-ARIA 1.2's author requirements that rules can check, one per kind of
 * requirement the specification states: names, roles, states and
 * properties, and the structure of owned and context roles. Each links to
 * the section of the specification it comes from.
 *
 * WAI-ARIA is not built on WCAG and restates none of its criteria, so no
 * requirement names one (wcagSc: []). `wcagVersion` is only the WCAG
 * version core's rules are run at under the profile, which decides nothing
 * here.
 *
 * Every requirement is `partial`: the rules check what the markup states,
 * not every case the specification covers (what script changes, what a
 * user agent computes), so a requirement whose rules all pass or find
 * nothing is cantTell, never pass.
 */

const VERSIONS = [{ version: '1.2', wcagVersion: '2.2' }];

const SPEC = 'https://www.w3.org/TR/wai-aria-1.2/';

const REQUIREMENTS = {
  '1.2': {
    'name-required': {
      title: 'Roles that require an accessible name have one',
      url: `${SPEC}#namecalculation`,
      wcagSc: [],
      partial: true
    },
    roles: {
      title: 'Roles are concrete and current',
      url: `${SPEC}#roles`,
      wcagSc: [],
      partial: true
    },
    'required-states': {
      title: 'Required states and properties are present',
      url: `${SPEC}#requiredState`,
      wcagSc: [],
      partial: true
    },
    'supported-attributes': {
      title: 'States and properties are supported by the role',
      url: `${SPEC}#supportedState`,
      wcagSc: [],
      partial: true
    },
    'prohibited-attributes': {
      title: 'Prohibited states and properties are absent',
      url: `${SPEC}#prohibitedattributes`,
      wcagSc: [],
      partial: true
    },
    'attribute-values': {
      title: 'States and properties have valid values',
      url: `${SPEC}#propcharacteristic_value`,
      wcagSc: [],
      partial: true
    },
    'owned-elements': {
      title: 'Containers own the elements their role requires, each with one owner',
      url: `${SPEC}#mustContain`,
      wcagSc: [],
      partial: true
    },
    'context-roles': {
      title: 'Elements are in the context their role requires',
      url: `${SPEC}#scope`,
      wcagSc: [],
      partial: true
    }
  }
};

module.exports = { VERSIONS, REQUIREMENTS };
