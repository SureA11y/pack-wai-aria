# Changelog

All notable changes to this package are documented here. This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-05

The same pack as 0.1.0, as a first stable version, in line with the other SureA11y packages. Needs `@surea11y/core` 1.15.0.

## [0.1.0] - 2026-11-05

First release. Needs `@surea11y/core` 1.15.0.

### Added

- WAI-ARIA 1.2 as a standard: the profile `wai-aria-1.2` runs core's ARIA rules and reports one result per author requirement (names required, roles, required states, supported and prohibited attributes, values, owned elements, context roles). Each finding is read by WAI-ARIA's own wording: a MUST or MUST NOT fails the requirement, though WCAG may only ask about it (an unnamed `role="grid"`); a SHOULD is a question. A requirement no rule fails is a question, never a pass.
- Rules of the pack's own for what core doesn't check: a scrollbar's `aria-controls`, a feed's articles, a toolbar's name where there are several, a combobox's popup, a spinbutton's owned elements, table indexes and counts, `aria-setsize` and `aria-keyshortcuts`, which fail; a caption outside a figure or table and a state on a presentational element, which are questions. `wai-aria-role-name-present` checks every role WAI-ARIA requires a name for. `docs/COVERAGE.md`: 280 WAI-ARIA 1.2 cases, 257 fail, 22 are questions, none is missed.
- How a person checks each requirement by hand, in `proceduresFor`, with what is valid from the Recommendation's role tables; and the steps for each question name the case found, in WAI-ARIA's words, under `wai-aria-1.2`.
