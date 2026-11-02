# Changelog

All notable changes to this package are documented here. This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- WAI-ARIA 1.2 as a standard: the profile `wai-aria-1.2` runs core's ARIA rules and reports one result per author requirement (names required, roles, required states, supported and prohibited attributes, values, owned elements, context roles). Each rule's findings are read by WAI-ARIA's own wording, by reason code: a MUST or MUST NOT fails the requirement, though WCAG may only ask about it (an unnamed `role="grid"`); a SHOULD is a question. A requirement no rule fails is a question, never a pass, since the rules check what the markup states and not all the requirement covers. How a person checks each one by hand is in `proceduresFor`. Needs core 1.15, for `outcome: 'fail'` in a rule map.
