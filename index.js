/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * WAI-ARIA 1.2 as a standard for @surea11y/core: one result per author
 * requirement the rules can check (names, roles, states and properties,
 * owned and context roles), from core's ARIA rules judged by WAI-ARIA.
 *
 *   runDomRulesInPage(url, null, { packs: [waiAria], profile: 'wai-aria-1.2' })
 *
 * Core's ARIA rules are WCAG rules, and a WCAG scan still reports each
 * WAI-ARIA violation they find, as a WCAG fail or a question. This pack
 * reads the same findings by WAI-ARIA's own wording (rule-map.js), which can
 * be certain where WCAG asks: an unnamed role="grid" is cantTell for WCAG
 * 4.1.2 and fails WAI-ARIA here.
 */

const { definePack, ruleMappedStandard } = require('@surea11y/core/pack');
const { name, version } = require('./package.json');
const { VERSIONS, REQUIREMENTS } = require('./requirements');
const { RULE_REQUIREMENTS } = require('./rule-map');
const { PROCEDURES, GROUPS } = require('./procedures');

const NAMESPACE = 'wai-aria';
const STANDARD = 'WAI-ARIA';

const wcagVersionOf = (v) => VERSIONS.find((x) => x.version === v).wcagVersion;

const { mappingsFor, composites, validate } = ruleMappedStandard({
  standard: STANDARD,
  tag: NAMESPACE,
  versions: VERSIONS,
  requirements: REQUIREMENTS,
  ruleMap: RULE_REQUIREMENTS
});

module.exports = definePack({
  name,
  version,
  namespace: NAMESPACE,
  core: '^1.14.2',
  // The pack's own rules, for the requirements no core rule checks, and a
  // variant of core's name rule for every role WAI-ARIA requires a name for.
  rules: [
    require('./rules/automatic/wai-aria-role-name-present'),
    require('./rules/automatic/wai-aria-scrollbar-controls'),
    require('./rules/automatic/wai-aria-feed-articles'),
    require('./rules/automatic/wai-aria-caption-context'),
    require('./rules/automatic/wai-aria-presentational-attributes')
  ],
  standard: {
    key: NAMESPACE,
    standard: STANDARD,
    versions: VERSIONS.map((v) => v.version),
    profiles: {
      // Exactly the standard: the rules rule-map.js lists, judged by it.
      'wai-aria-1.2': {
        version: '1.2',
        tags: [NAMESPACE],
        mappedRules: true,
        wcagVersion: wcagVersionOf('1.2')
      }
    },
    ruleTag: NAMESPACE,
    ruleMapped: true,
    mappingsFor,
    composites,
    validate,
    procedures: PROCEDURES,
    groups: GROUPS,
    report: { noteKey: 'waiAria_report_note' }
  },
  dictionaries: { en: require('./i18n/en.json') }
});
