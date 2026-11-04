# Coverage of WAI-ARIA 1.2

What the `wai-aria-1.2` profile makes of each author requirement a rule can check from the markup. Each case is a page that breaks one requirement, and nothing else, scanned with the profile. `npm run inventory` writes this file and `docs/coverage.json` again, from the core it runs with; [`scripts/inventory.js`](../scripts/inventory.js) says how each page is built.

- **fail**: a finding on the element fails the requirement.
- **question**: a finding on the element is a question for the requirement, or fails another of the profile's requirements.
- **wcag only**: only a rule the profile doesn't map reports it.
- **missed**: nothing reports it.
- **not required**: nothing reports it, and rightly: the specification gives the state a default, so leaving it out is no author error.

WAI-ARIA 1.2's roles, states and properties are the Recommendation's own tables ([`scripts/data/wai-aria-1.2.json`](../scripts/data/wai-aria-1.2.json)). The DPUB-ARIA and Graphics-ARIA roles come from `aria-query`, and are listed apart: they are modules of their own, not WAI-ARIA 1.2.

## Summary

| Requirement | Cases | fail | question | wcag only | missed | not required |
| --- | --- | --- | --- | --- | --- | --- |
| Roles that require an accessible name have one (`name-required`) | 36 | 34 | 2 | 0 | 0 | 0 |
| Roles are concrete and current (`roles`) | 13 | 12 | 1 | 0 | 0 | 0 |
| Required states and properties are present (`required-states`) | 13 | 10 | 2 | 0 | 0 | 1 |
| States and properties are supported by the role (`supported-attributes`) | 86 | 80 | 6 | 0 | 0 | 0 |
| Prohibited states and properties are absent (`prohibited-attributes`) | 23 | 23 | 0 | 0 | 0 | 0 |
| States and properties have valid values (`attribute-values`) | 66 | 56 | 10 | 0 | 0 | 0 |
| Containers own the elements their role requires, each with one owner (`owned-elements`) | 29 | 29 | 0 | 0 | 0 | 0 |
| Elements are in the context their role requires (`context-roles`) | 14 | 13 | 1 | 0 | 0 | 0 |
| **All** | 280 | 257 | 22 | 0 | 0 | 1 |

DPUB-ARIA and Graphics-ARIA roles: 61 cases, 46 fail, 0 question, 0 wcag only, 15 missed, 0 not required.

## Roles that require an accessible name have one

| Role | Case | Status | Reported by | Note |
| --- | --- | --- | --- | --- |
| `alertdialog` | no accessible name | fail | `dialog-name-present` |  |
| `application` | no accessible name | fail | `wai-aria-role-name-present` |  |
| `button` | no accessible name | fail | `button-name-present` |  |
| `checkbox` | no accessible name | fail | `binary-control-name-present` |  |
| `columnheader` | no accessible name | question | `empty-table-header` |  |
| `combobox` | no accessible name | fail | `combobox-name-present`, `wai-aria-combobox-popup` |  |
| `dialog` | no accessible name | fail | `dialog-name-present` |  |
| `grid` | no accessible name | fail | `wai-aria-role-name-present` |  |
| `heading` | no accessible name | fail | `empty-heading` |  |
| `img` | no accessible name | fail | `role-img-text-alternative-present` |  |
| `link` | no accessible name | fail | `link-name-present` |  |
| `listbox` | no accessible name | fail | `listbox-name-present` |  |
| `marquee` | no accessible name | fail | `wai-aria-role-name-present` |  |
| `meter` | no accessible name | fail | `meter-name-present`, `wai-aria-role-name-present` |  |
| `menuitem` | no accessible name | fail | `menuitem-name-present` |  |
| `menuitemcheckbox` | no accessible name | fail | `menuitem-name-present` |  |
| `menuitemradio` | no accessible name | fail | `aria-required-attr`, `menuitem-name-present` |  |
| `option` | no accessible name | fail | `option-name-present` |  |
| `progressbar` | no accessible name | fail | `progressbar-name-present`, `wai-aria-role-name-present` |  |
| `radio` | no accessible name | fail | `binary-control-name-present` |  |
| `radiogroup` | no accessible name | fail | `wai-aria-role-name-present` |  |
| `region` | no accessible name | fail | `landmark-role-name-present` |  |
| `rowheader` | no accessible name | question | `empty-table-header` |  |
| `searchbox` | no accessible name | fail | `searchbox-name-present` |  |
| `slider` | no accessible name | fail | `slider-name-present` |  |
| `spinbutton` | no accessible name | fail | `spinbutton-name-present` |  |
| `switch` | no accessible name | fail | `binary-control-name-present` |  |
| `table` | no accessible name | fail | `wai-aria-role-name-present` |  |
| `tabpanel` | no accessible name | fail | `wai-aria-role-name-present` |  |
| `textbox` | no accessible name | fail | `textbox-name-present` |  |
| `tooltip` | no accessible name | fail | `tooltip-name-present` |  |
| `tree` | no accessible name | fail | `wai-aria-role-name-present` |  |
| `treegrid` | no accessible name | fail | `wai-aria-role-name-present` |  |
| `treeitem` | no accessible name | fail | `treeitem-name-present` |  |
| `doc-backlink` | no accessible name | missed |  | DPUB-ARIA 1.1 |
| `doc-biblioentry` | no accessible name | missed |  | DPUB-ARIA 1.1 |
| `doc-biblioref` | no accessible name | missed |  | DPUB-ARIA 1.1 |
| `doc-glossref` | no accessible name | missed |  | DPUB-ARIA 1.1 |
| `doc-noteref` | no accessible name | missed |  | DPUB-ARIA 1.1 |
| `doc-pagebreak` | no accessible name | missed |  | DPUB-ARIA 1.1 |
| `doc-part` | no accessible name | missed |  | DPUB-ARIA 1.1 |
| `graphics-document` | no accessible name | fail | `role-img-text-alternative-present` | Graphics-ARIA 1.0 |
| `graphics-symbol` | no accessible name | fail | `role-img-text-alternative-present` | Graphics-ARIA 1.0 |
| `form` | no accessible name (text: "MUST give each element with role form a brief label") | fail | `landmark-role-name-present` |  |
| `toolbar` | no accessible name, one of two toolbars (text) | fail | `wai-aria-toolbar-names` |  |

## Roles are concrete and current

| Role | Case | Status | Reported by | Note |
| --- | --- | --- | --- | --- |
| `command` | abstract role used | fail | `aria-roles-valid` |  |
| `composite` | abstract role used | fail | `aria-roles-valid` |  |
| `input` | abstract role used | fail | `aria-roles-valid` |  |
| `landmark` | abstract role used | fail | `aria-roles-valid` |  |
| `range` | abstract role used | fail | `aria-roles-valid` |  |
| `roletype` | abstract role used | fail | `aria-roles-valid` |  |
| `section` | abstract role used | fail | `aria-roles-valid` |  |
| `sectionhead` | abstract role used | fail | `aria-roles-valid` |  |
| `select` | abstract role used | fail | `aria-roles-valid` |  |
| `structure` | abstract role used | fail | `aria-roles-valid` |  |
| `widget` | abstract role used | fail | `aria-roles-valid` |  |
| `window` | abstract role used | fail | `aria-roles-valid` |  |
| `directory` | deprecated role used | question | `aria-deprecated-role` | Deprecated in 1.2: authors SHOULD NOT use it, a question at most. |

## Required states and properties are present

| Role | Case | Status | Reported by | Note |
| --- | --- | --- | --- | --- |
| `checkbox` | no aria-checked | fail | `aria-required-attr` |  |
| `combobox` | no aria-controls | fail | `aria-required-attr` |  |
| `combobox` | no aria-expanded | question | `aria-required-attr`, `wai-aria-combobox-popup` | fails attribute-values |
| `heading` | no aria-level | question | `aria-required-attr` |  |
| `meter` | no aria-valuenow | fail | `aria-required-attr` |  |
| `menuitemcheckbox` | no aria-checked | fail | `aria-required-attr` |  |
| `option` | no aria-selected | not required |  | 1.2 gives it a default (false): no failure. |
| `radio` | no aria-checked | fail | `aria-required-attr` |  |
| `scrollbar` | no aria-controls | fail | `wai-aria-scrollbar-controls` |  |
| `scrollbar` | no aria-valuenow | fail | `aria-required-attr` |  |
| `separator` | no aria-valuenow (focusable) | fail | `aria-required-attr` |  |
| `slider` | no aria-valuenow | fail | `aria-required-attr` |  |
| `switch` | no aria-checked | fail | `aria-required-attr` |  |

## States and properties are supported by the role

| Role | Case | Status | Reported by | Note |
| --- | --- | --- | --- | --- |
| `alert` | aria-disabled deprecated on the role | question | `aria-allowed-attr` | Deprecated on this role in 1.2: authors SHOULD NOT use it, a question at most. |
| `alert` | aria-errormessage deprecated on the role | question | `aria-allowed-attr`, `aria-conditional-attr` | Deprecated on this role in 1.2: authors SHOULD NOT use it, a question at most. |
| `alert` | aria-haspopup deprecated on the role | question | `aria-allowed-attr` | Deprecated on this role in 1.2: authors SHOULD NOT use it, a question at most. |
| `alert` | aria-invalid deprecated on the role | question | `aria-allowed-attr` | Deprecated on this role in 1.2: authors SHOULD NOT use it, a question at most. |
| `alert` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `alertdialog` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `application` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `article` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `banner` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `blockquote` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `button` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `caption` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `cell` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `checkbox` | aria-selected not supported | fail | `aria-allowed-attr` |  |
| `code` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `columnheader` | aria-checked not supported | fail | `aria-allowed-attr`, `empty-table-header` |  |
| `combobox` | aria-checked not supported | fail | `aria-allowed-attr`, `wai-aria-combobox-popup` |  |
| `complementary` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `contentinfo` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `definition` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `deletion` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `dialog` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `directory` | aria-checked not supported | fail | `aria-allowed-attr`, `aria-deprecated-role` |  |
| `document` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `emphasis` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `feed` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `figure` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `form` | aria-checked not supported | fail | `aria-allowed-attr`, `landmark-role-name-present` |  |
| `generic` | aria-checked not supported | fail | `aria-allowed-attr`, `aria-deprecated-role` |  |
| `grid` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `gridcell` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `group` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `heading` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `img` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `insertion` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `link` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `list` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `listbox` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `listitem` | aria-checked not supported | fail | `aria-allowed-attr`, `aria-deprecated-role` |  |
| `log` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `main` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `marquee` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `math` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `meter` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `menu` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `menubar` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `menuitem` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `menuitemcheckbox` | aria-selected not supported | fail | `aria-allowed-attr` |  |
| `menuitemradio` | aria-selected not supported | fail | `aria-allowed-attr`, `aria-required-attr` |  |
| `navigation` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `none` | aria-checked not supported | question | `wai-aria-presentational-attributes` |  |
| `note` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `option` | aria-expanded not supported | fail | `aria-allowed-attr` |  |
| `paragraph` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `presentation` | aria-checked not supported | question | `wai-aria-presentational-attributes` |  |
| `progressbar` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `radio` | aria-selected not supported | fail | `aria-allowed-attr` |  |
| `radiogroup` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `region` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `row` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `rowgroup` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `rowheader` | aria-checked not supported | fail | `aria-allowed-attr`, `empty-table-header` |  |
| `scrollbar` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `search` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `searchbox` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `separator` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `slider` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `spinbutton` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `status` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `strong` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `subscript` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `superscript` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `switch` | aria-selected not supported | fail | `aria-allowed-attr` |  |
| `tab` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `table` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `tablist` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `tabpanel` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `term` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `textbox` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `time` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `timer` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `toolbar` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `tooltip` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `tree` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `treegrid` | aria-checked not supported | fail | `aria-allowed-attr` |  |
| `treeitem` | aria-valuenow not supported | fail | `aria-allowed-attr` |  |
| `doc-abstract` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-acknowledgments` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-afterword` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-appendix` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-backlink` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-biblioentry` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-bibliography` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-biblioref` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-chapter` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-colophon` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-conclusion` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-cover` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-credit` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-credits` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-dedication` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-endnote` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-endnotes` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-epigraph` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-epilogue` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-errata` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-example` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-footnote` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-foreword` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-glossary` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-glossref` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-index` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-introduction` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-noteref` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-notice` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-pagebreak` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-pagefooter` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-pageheader` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-pagelist` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-part` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-preface` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-prologue` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-pullquote` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-qna` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-subtitle` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-tip` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `doc-toc` | aria-checked not supported | fail | `aria-allowed-attr` | DPUB-ARIA 1.1 |
| `graphics-document` | aria-checked not supported | fail | `aria-allowed-attr` | Graphics-ARIA 1.0 |
| `graphics-object` | aria-checked not supported | fail | `aria-allowed-attr` | Graphics-ARIA 1.0 |
| `graphics-symbol` | aria-checked not supported | fail | `aria-allowed-attr` | Graphics-ARIA 1.0 |

## Prohibited states and properties are absent

| Role | Case | Status | Reported by | Note |
| --- | --- | --- | --- | --- |
| `caption` | aria-label prohibited | fail | `aria-prohibited-attr` |  |
| `caption` | aria-labelledby prohibited | fail | `aria-prohibited-attr` |  |
| `code` | aria-label prohibited | fail | `aria-prohibited-attr` |  |
| `code` | aria-labelledby prohibited | fail | `aria-prohibited-attr` |  |
| `deletion` | aria-label prohibited | fail | `aria-prohibited-attr` |  |
| `deletion` | aria-labelledby prohibited | fail | `aria-prohibited-attr` |  |
| `emphasis` | aria-label prohibited | fail | `aria-prohibited-attr` |  |
| `emphasis` | aria-labelledby prohibited | fail | `aria-prohibited-attr` |  |
| `generic` | aria-label prohibited | fail | `aria-deprecated-role`, `aria-prohibited-attr` |  |
| `generic` | aria-labelledby prohibited | fail | `aria-deprecated-role`, `aria-prohibited-attr` |  |
| `generic` | aria-roledescription prohibited | fail | `aria-deprecated-role`, `aria-prohibited-attr` |  |
| `insertion` | aria-label prohibited | fail | `aria-prohibited-attr` |  |
| `insertion` | aria-labelledby prohibited | fail | `aria-prohibited-attr` |  |
| `paragraph` | aria-label prohibited | fail | `aria-prohibited-attr` |  |
| `paragraph` | aria-labelledby prohibited | fail | `aria-prohibited-attr` |  |
| `presentation` | aria-label prohibited | fail | `aria-prohibited-attr` |  |
| `presentation` | aria-labelledby prohibited | fail | `aria-prohibited-attr` |  |
| `strong` | aria-label prohibited | fail | `aria-prohibited-attr` |  |
| `strong` | aria-labelledby prohibited | fail | `aria-prohibited-attr` |  |
| `subscript` | aria-label prohibited | fail | `aria-prohibited-attr` |  |
| `subscript` | aria-labelledby prohibited | fail | `aria-prohibited-attr` |  |
| `superscript` | aria-label prohibited | fail | `aria-prohibited-attr` |  |
| `superscript` | aria-labelledby prohibited | fail | `aria-prohibited-attr` |  |

## States and properties have valid values

| Role | Case | Status | Reported by | Note |
| --- | --- | --- | --- | --- |
| `application` | aria-activedescendant="nowhere" (id) | fail | `aria-valid-attr-value` |  |
| `group` | aria-atomic="bogus" (boolean) | fail | `aria-valid-attr-value` |  |
| `combobox` | aria-autocomplete="bogus" (token) | fail | `aria-valid-attr-value`, `wai-aria-combobox-popup` |  |
| `group` | aria-busy="bogus" (boolean) | fail | `aria-valid-attr-value` |  |
| `checkbox` | aria-checked="bogus" (tristate) | fail | `aria-valid-attr-value` |  |
| `grid` | aria-colcount="one" (integer) | fail | `aria-valid-attr-value` |  |
| `cell` | aria-colindex="one" (integer) | fail | `aria-valid-attr-value` |  |
| `cell` | aria-colspan="one" (integer) | fail | `aria-valid-attr-value` |  |
| `group` | aria-controls="nowhere" (idlist) | question | `aria-valid-attr-value` |  |
| `group` | aria-current="bogus" (token) | fail | `aria-valid-attr-value` |  |
| `group` | aria-describedby="nowhere" (idlist) | question | `aria-valid-attr-value` |  |
| `group` | aria-details="nowhere" (id) | question | `aria-valid-attr-value` |  |
| `alert` | aria-disabled="bogus" (boolean) | fail | `aria-allowed-attr`, `aria-valid-attr-value` |  |
| `group` | aria-dropeffect="bogus" (tokenlist) | fail | `aria-valid-attr-value` |  |
| `alert` | aria-errormessage="nowhere" (id) | question | `aria-allowed-attr`, `aria-conditional-attr` |  |
| `application` | aria-expanded="bogus" (boolean) | fail | `aria-valid-attr-value` |  |
| `group` | aria-flowto="nowhere" (idlist) | question | `aria-valid-attr-value` |  |
| `group` | aria-grabbed="bogus" (boolean) | fail | `aria-valid-attr-value` |  |
| `alert` | aria-haspopup="bogus" (token) | fail | `aria-allowed-attr`, `aria-valid-attr-value` |  |
| `group` | aria-hidden="bogus" (boolean) | fail | `aria-valid-attr-value` |  |
| `alert` | aria-invalid="bogus" (token) | fail | `aria-allowed-attr`, `aria-valid-attr-value` |  |
| `group` | aria-labelledby="nowhere" (idlist) | question | `aria-valid-attr-value` |  |
| `heading` | aria-level="one" (integer) | fail | `aria-valid-attr-value` |  |
| `group` | aria-live="bogus" (token) | fail | `aria-valid-attr-value` |  |
| `alertdialog` | aria-modal="bogus" (boolean) | fail | `aria-valid-attr-value` |  |
| `searchbox` | aria-multiline="bogus" (boolean) | fail | `aria-valid-attr-value` |  |
| `grid` | aria-multiselectable="bogus" (boolean) | fail | `aria-valid-attr-value` |  |
| `listbox` | aria-orientation="bogus" (token) | fail | `aria-valid-attr-value` |  |
| `group` | aria-owns="nowhere" (idlist) | question | `aria-valid-attr-value` |  |
| `article` | aria-posinset="one" (integer) | fail | `aria-valid-attr-value` |  |
| `button` | aria-pressed="bogus" (tristate) | fail | `aria-valid-attr-value` |  |
| `checkbox` | aria-readonly="bogus" (boolean) | fail | `aria-valid-attr-value` |  |
| `group` | aria-relevant="bogus" (tokenlist) | fail | `aria-valid-attr-value` |  |
| `checkbox` | aria-required="bogus" (boolean) | fail | `aria-valid-attr-value` |  |
| `grid` | aria-rowcount="one" (integer) | fail | `aria-valid-attr-value` |  |
| `cell` | aria-rowindex="one" (integer) | fail | `aria-valid-attr-value` |  |
| `cell` | aria-rowspan="one" (integer) | fail | `aria-valid-attr-value` |  |
| `columnheader` | aria-selected="bogus" (boolean) | fail | `aria-valid-attr-value`, `empty-table-header` |  |
| `article` | aria-setsize="one" (integer) | fail | `aria-valid-attr-value` |  |
| `columnheader` | aria-sort="bogus" (token) | fail | `aria-valid-attr-value`, `empty-table-header` |  |
| `meter` | aria-valuemax="one" (number) | fail | `aria-valid-attr-value` |  |
| `meter` | aria-valuemin="one" (number) | fail | `aria-valid-attr-value` |  |
| `meter` | aria-valuenow="one" (number) | fail | `aria-valid-attr-value` |  |
| `slider` | aria-valuenow above aria-valuemax | question | `aria-valid-attr-value` |  |
| `slider` | aria-valuemin above aria-valuemax | fail | `aria-valid-attr-value` |  |
| `heading` | aria-level 0 | fail | `aria-valid-attr-value` |  |
| `option` | aria-posinset above aria-setsize | fail | `aria-valid-attr-value` |  |
| `option` | aria-posinset 0 | fail | `aria-valid-attr-value` |  |
| `row` | aria-rowindex 0 | fail | `aria-valid-attr-value` |  |
| `gridcell` | aria-colindex 0 | fail | `aria-valid-attr-value` |  |
| `gridcell` | aria-colspan 0 | fail | `aria-valid-attr-value` |  |
| `gridcell` | aria-rowspan below 0 | fail | `aria-valid-attr-value` |  |
| `listbox` | aria-activedescendant names an element it does not own | fail | `aria-valid-attr-value` |  |
| `textbox` | aria-errormessage without aria-invalid | question | `aria-conditional-attr` |  |
| `group` | aria-labelledby names no element | question | `aria-valid-attr-value` |  |
| `combobox` | popup of role menu (text: listbox, tree, grid or dialog) | fail | `wai-aria-combobox-popup` |  |
| `cell` | aria-colindex not above the cell before it | fail | `wai-aria-table-indexes` |  |
| `cell` | aria-colindex above aria-colcount | fail | `wai-aria-table-indexes` |  |
| `row` | aria-rowindex not above the row before it | fail | `wai-aria-table-indexes` |  |
| `row` | aria-rowindex above aria-rowcount | fail | `wai-aria-table-indexes` |  |
| `table` | aria-colcount below the columns on the page | fail | `wai-aria-table-indexes` |  |
| `table` | aria-rowcount below the rows on the page | fail | `wai-aria-table-indexes` |  |
| `option` | aria-setsize below the items of its set | fail | `wai-aria-setsize` |  |
| `option` | items of a set give different aria-setsize | fail | `wai-aria-setsize` |  |
| `button` | aria-keyshortcuts names a modifier "Ctrl" | fail | `wai-aria-keyshortcuts` |  |
| `button` | aria-keyshortcuts puts a modifier last | fail | `wai-aria-keyshortcuts` |  |

## Containers own the elements their role requires, each with one owner

| Role | Case | Status | Reported by | Note |
| --- | --- | --- | --- | --- |
| `feed` | owns none of its required roles | fail | `wai-aria-feed-articles` |  |
| `feed` | owns a button | fail | `wai-aria-feed-articles` |  |
| `grid` | owns none of its required roles | fail | `aria-required-children` |  |
| `grid` | owns a button | fail | `aria-required-children` |  |
| `list` | owns none of its required roles | fail | `aria-required-children` |  |
| `list` | owns a button | fail | `aria-required-children` |  |
| `listbox` | owns none of its required roles | fail | `aria-required-children` |  |
| `listbox` | owns a button | fail | `aria-required-children` |  |
| `menu` | owns none of its required roles | fail | `aria-required-children` |  |
| `menu` | owns a button | fail | `aria-required-children` |  |
| `menubar` | owns none of its required roles | fail | `aria-required-children` |  |
| `menubar` | owns a button | fail | `aria-required-children` |  |
| `radiogroup` | owns none of its required roles | fail | `aria-required-children` |  |
| `radiogroup` | owns a button | fail | `aria-required-children` |  |
| `row` | owns none of its required roles | fail | `aria-required-children` |  |
| `row` | owns a button | fail | `aria-required-children` |  |
| `rowgroup` | owns none of its required roles | fail | `aria-required-children` |  |
| `rowgroup` | owns a button | fail | `aria-required-children` |  |
| `table` | owns none of its required roles | fail | `aria-required-children` |  |
| `table` | owns a button | fail | `aria-required-children` |  |
| `tablist` | owns none of its required roles | fail | `aria-required-children` |  |
| `tablist` | owns a button | fail | `aria-required-children` |  |
| `tree` | owns none of its required roles | fail | `aria-required-children` |  |
| `tree` | owns a button | fail | `aria-required-children` |  |
| `treegrid` | owns none of its required roles | fail | `aria-required-children` |  |
| `treegrid` | owns a button | fail | `aria-required-children` |  |
| `doc-bibliography` | owns none of its required roles | missed |  | DPUB-ARIA 1.1 |
| `doc-bibliography` | owns a button | missed |  | DPUB-ARIA 1.1 |
| `doc-endnotes` | owns none of its required roles | missed |  | DPUB-ARIA 1.1 |
| `doc-endnotes` | owns a button | missed |  | DPUB-ARIA 1.1 |
| `doc-glossary` | owns none of its required roles | missed |  | DPUB-ARIA 1.1 |
| `doc-glossary` | owns a button | missed |  | DPUB-ARIA 1.1 |
| `option` | owned twice (aria-owns) | fail | `aria-owns-valid` |  |
| `spinbutton` | owns a link (text: a textbox and/or two buttons) | fail | `wai-aria-spinbutton-owned` |  |
| `spinbutton` | owns three buttons (text) | fail | `wai-aria-spinbutton-owned` |  |

## Elements are in the context their role requires

| Role | Case | Status | Reported by | Note |
| --- | --- | --- | --- | --- |
| `caption` | outside its required context | question | `wai-aria-caption-context` |  |
| `cell` | outside its required context | fail | `aria-required-parent` |  |
| `columnheader` | outside its required context | fail | `aria-required-parent`, `empty-table-header` |  |
| `gridcell` | outside its required context | fail | `aria-required-parent` |  |
| `listitem` | outside its required context | fail | `aria-required-parent` |  |
| `menuitem` | outside its required context | fail | `aria-required-parent` |  |
| `menuitemcheckbox` | outside its required context | fail | `aria-required-parent` |  |
| `menuitemradio` | outside its required context | fail | `aria-required-attr`, `aria-required-parent` |  |
| `option` | outside its required context | fail | `aria-required-parent` |  |
| `row` | outside its required context | fail | `aria-required-parent` |  |
| `rowgroup` | outside its required context | fail | `aria-required-parent` |  |
| `rowheader` | outside its required context | fail | `aria-required-parent`, `empty-table-header` |  |
| `tab` | outside its required context | fail | `aria-required-parent` |  |
| `treeitem` | outside its required context | fail | `aria-required-parent` |  |
| `doc-biblioentry` | outside its required context | missed |  | DPUB-ARIA 1.1 |
| `doc-endnote` | outside its required context | missed |  | DPUB-ARIA 1.1 |
