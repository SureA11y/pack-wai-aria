# @surea11y/pack-wai-aria

[WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) as a standard for [`@surea11y/core`](https://github.com/SureA11y/core): one result per author requirement the rules can check, from core's ARIA rules judged by WAI-ARIA's own wording.

```js
const waiAria = require('@surea11y/pack-wai-aria');

runDomRulesInPage(url, null, { packs: [waiAria], profile: 'wai-aria-1.2' });
```

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

## How the findings are read

`rule-map.js` lists, for each of core's 30 rules that check a WAI-ARIA requirement, what each of its reason codes means under WAI-ARIA, from the specification's wording: `outcome: 'fail'` for a MUST, `outcome: 'cantTell'` for a SHOULD or what script decides, and `requirements: []` for a code WAI-ARIA states no author requirement for. Every code is placed; a test fails when core adds one the map doesn't.

## Development

```sh
npm install
npm test
```
