# Changelog

All notable changes to this package are documented here. This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Rules of the pack's own for what no core rule checks: a scrollbar's `aria-controls` (`wai-aria-scrollbar-controls`) and a feed's articles (`wai-aria-feed-articles`), which fail; a caption outside a figure or table (`wai-aria-caption-context`) and a state on a `none` or `presentation` element (`wai-aria-presentational-attributes`), which are questions, as WAI-ARIA only recommends against them.
- Every name-from-author role WAI-ARIA requires a name for is checked: `wai-aria-role-name-present`, a variant of core's `aria-role-name-present` with its setting `roles: 'all'` (core 1.15), adds application, marquee, table, tabpanel and treegrid, and takes core's rule's place in the rule map. An empty heading (`empty-heading`) fails `name-required`, and an empty column or row header (`empty-table-header`) is a question there.
- A heading with no `aria-level`, or a combobox with no `aria-expanded`, is a question under required states, where it counted for nothing: WAI-ARIA's role tables give neither a default.
- `docs/COVERAGE.md`: of the 265 WAI-ARIA 1.2 cases, 241 fail, 23 are questions and none is missed.
- WAI-ARIA 1.2 as a standard: the profile `wai-aria-1.2` runs core's ARIA rules and reports one result per author requirement (names required, roles, required states, supported and prohibited attributes, values, owned elements, context roles). Each rule's findings are read by WAI-ARIA's own wording, by reason code: a MUST or MUST NOT fails the requirement, though WCAG may only ask about it (an unnamed `role="grid"`); a SHOULD is a question. A requirement no rule fails is a question, never a pass, since the rules check what the markup states and not all the requirement covers. How a person checks each one by hand is in `proceduresFor`. Needs core 1.15, for `outcome: 'fail'` in a rule map.
