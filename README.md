# @surea11y/pack-wai-aria

[WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) as a standard for [`@surea11y/core`](https://github.com/SureA11y/core): one result per author requirement the rules can check, from core's ARIA rules judged by WAI-ARIA's own wording.

```sh
npm install @surea11y/core @surea11y/pack-wai-aria
```

It needs `@surea11y/core` 1.15.0 or later.

```js
const waiAria = require('@surea11y/pack-wai-aria');

runDomRulesInPage(url, null, { packs: [waiAria], profile: 'wai-aria-1.2' });
```

## With WCAG, or another standard

A scan can judge the page by WAI-ARIA and by WCAG, or by another pack's standard, at once (core 1.15): each profile judges it as it would alone, and the result reads as one profile with the rules of all.

```js
const result = runDomRulesInPage(url, null, {
  packs: [waiAria],
  profile: ['wcag22-aa', 'wai-aria-1.2']
});

// <div role="group" aria-checked="true">: an attribute the role doesn't
// support, a question for WCAG 4.1.2 and a failure of WAI-ARIA.
const check = result.checksResults.find((c) => c.ruleId === 'aria-allowed-attr');
check.verdicts;     // { 'wcag22-aa': 'cantTell', 'wai-aria-1.2': 'fail' }
check.outcome;      // 'fail', the worst of them, which SARIF and JUnit gate on
check.checkOutcome; // 'cantTell', the rule's own, which WCAG's criteria read

result.profiles['wai-aria-1.2'].rulesResults; // this standard's results, by id
```

A rule both profiles run is one check with a verdict from each, as above. Names are the exception: under this profile they are checked by the pack's variant of core's rule, `wai-aria-role-name-present`, which covers every role WAI-ARIA requires a name for. So an unnamed `role="grid"` is two checks, as two rules always are: core's `aria-role-name-present` (`{ 'wcag22-aa': 'cantTell' }`) and the variant (`{ 'wai-aria-1.2': 'fail' }`).

With `@surea11y/pack-en301549`, `profile: ['en301549-v4.1.1', 'wai-aria-1.2']` judges the page by EN 301 549 and WAI-ARIA. Core's [`OUTPUT_SCHEMA.md`](https://github.com/SureA11y/core/blob/main/docs/OUTPUT_SCHEMA.md#several-profiles) has the whole result, and what SARIF, JUnit, EARL, the HTML report and baselines do with it.

## Why a standard of its own

Core's ARIA rules are WCAG rules. A WCAG scan reports every WAI-ARIA violation they find, as a WCAG failure or as a question for a person. The two can differ: an unnamed `role="grid"` breaks WAI-ARIA's "Accessible Name Required" for certain, but whether it fails WCAG 4.1.2 depends on what the page shows, so WCAG asks. This pack reads the same findings by WAI-ARIA, where the grid fails.

## The requirements

| Requirement | Title |
|---|---|
| `name-required` | [Roles that require an accessible name have one](https://www.w3.org/TR/wai-aria-1.2/#namecalculation) |
| `roles` | [Roles are concrete and current](https://www.w3.org/TR/wai-aria-1.2/#roles) |
| `required-states` | [Required states and properties are present](https://www.w3.org/TR/wai-aria-1.2/#requiredState) |
| `supported-attributes` | [States and properties are supported by the role](https://www.w3.org/TR/wai-aria-1.2/#supportedState) |
| `prohibited-attributes` | [Prohibited states and properties are absent](https://www.w3.org/TR/wai-aria-1.2/#prohibitedattributes) |
| `attribute-values` | [States and properties have valid values](https://www.w3.org/TR/wai-aria-1.2/#propcharacteristic_value) |
| `owned-elements` | [Containers own the elements their role requires, each with one owner](https://www.w3.org/TR/wai-aria-1.2/#mustContain) |
| `context-roles` | [Elements are in the context their role requires](https://www.w3.org/TR/wai-aria-1.2/#scope) |

Each is a result, `wai-aria-1.2-<requirement>`:

- **fail** where a rule found what WAI-ARIA says an author MUST or MUST NOT do;
- **cantTell** otherwise: a finding WAI-ARIA only recommends against (SHOULD, "not recommended"), or no finding at all, since the rules check what the markup states, not everything the requirement covers (what script changes, what a browser computes). A requirement never passes on the rules alone. `proceduresFor('name-required', { packs: [waiAria], standard: 'wai-aria' })` says how a person checks the rest.

## How a person answers a question

A `cantTell` finding carries `howToCheck`, the steps a person follows to answer it. Under `wai-aria-1.2`, those of core's questions this standard asks are in WAI-ARIA's words ([`review.js`](review.js)) and name what the finding found:

> 1. Open the popup of the element the report names, with the mouse and with the keyboard (Enter, Space or Down Arrow).
> 2. Open the Accessibility pane of the browser's developer tools, select the popup that appears, and read its role. When the page was scanned, the element it controls had role dialog.
> 3. Compare it with what aria-haspopup="menu" announces: a menu (true means menu).
>
> Fails: The popup has role dialog, not menu, which fails WAI-ARIA 1.2 aria-haspopup: the popup MUST have the role its value names.

A scan that also runs a WCAG profile keeps core's steps, which name the WCAG criterion. `proceduresFor` gives each requirement's checklist, with the roles, states and values that are valid listed in full, from the Recommendation's tables.

## How the findings are read

`rule-map.js` lists, for each of core's rules that check a WAI-ARIA requirement, what each of its reason codes means under WAI-ARIA, from the specification's wording: `outcome: 'fail'` for a MUST, `outcome: 'cantTell'` for a SHOULD or what script decides, and `requirements: []` for a code WAI-ARIA states no author requirement for. Every code is placed; a test fails when core adds one the map doesn't.

## What it covers

[`docs/COVERAGE.md`](docs/COVERAGE.md) lists every WAI-ARIA 1.2 author requirement a rule can check from the markup, one case per role, state or property, and what the profile makes of each: a failure, a question, or nothing yet. `npm run inventory` builds it again from the Recommendation's own role tables ([`scripts/data/wai-aria-1.2.json`](scripts/data/wai-aria-1.2.json), read by `scripts/extract-spec.js`) and the core it runs with.

## Development

```sh
npm install
npm test
```
