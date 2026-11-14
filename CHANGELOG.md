# Changelog

All notable changes to this package are documented here. This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-11-14

Works with `@surea11y/core` 1.15 and later, as 1.0 does; tested with core 1.17.0, with which `docs/COVERAGE.md` is unchanged.

### Changed

- The pack's rules say what causes a finding where they know it, and the near-right value where one is close:
  - `wai-aria-combobox-popup` names the element `aria-controls` points at and why it is no popup: a `role` that is not an ARIA role (`role="lisbox"`: did you mean `"listbox"`?), a tag's own role (a `<ul>` is a list), no role at all, or a listbox inside it, which `aria-controls` should name (`aria-controls="lb"`). It no longer calls an element with no role, or a misspelt one, "of role none".
  - `wai-aria-scrollbar-controls` says when `aria-controls` is empty, or misspelt (`aria-control`).
  - `wai-aria-toolbar-names` says why a toolbar's `aria-labelledby` or `aria-label` gives no name: an id no element has (and the id it nearly is), an element with no text, an empty `aria-label`, or a misspelt attribute (`aria-labeledby`). An `aria-labelledby` that names both empty elements and missing ids names both. Where the markup shows no cause, it says what the page's other toolbars are called (`the others are called "Formatting", "Insert"`), or that none has a name.
  - `wai-aria-feed-articles` says why a feed owns no article: an article something hides (the `hidden` attribute, `aria-hidden="true"`, `display: none`, on it or around it), articles inside an element the feed owns instead (a `<ul>`), or a misspelt `role="article"`. The element a feed owns is named with its role (`A feed owns this <h2>, of role heading`). It also says when another element's `aria-owns` claims the article, when a role replaces an `<article>`'s own (`<article role="button">`), and when the articles are a `<video>`'s or `<object>`'s fallback content, which is never shown with it.
  - `wai-aria-caption-context` names the caption's parent in the accessibility tree by its tag (`the <p> element`, not `an element of role p`), and the figure or table above it where an element comes between them. Where the parent is an element that claims the caption with `aria-owns`, it says so, as the markup's nesting doesn't show it.
  - `wai-aria-presentational-attributes` names the role (`role="none"`) and the roles that take the attribute (`aria-checked`: checkbox, menuitemcheckbox, option, radio, switch).
  - `wai-aria-spinbutton-owned` names the owned element's tag, says when the spinbutton owns it through `aria-owns`, and names the text boxes and buttons past the first text box and two buttons.
  - `wai-aria-setsize` names the set (`the elements of role listitem in <ul id="l">`), the size an item gives and the sizes the others give, and the size most of the set gives where one is close (`Set it to 3, as most items of its set do`).
  - `wai-aria-table-indexes` names the earlier cell an `aria-colindex` doesn't exceed, by its text (`the cell before it in its row, <td> "Name"`), and the index that would follow it; the earlier row an `aria-rowindex` doesn't exceed; and, for an `aria-colcount` below the page's columns, the row that spans them and the cell whose `colspan` widens it.
  - `wai-aria-keyshortcuts` names every misnamed modifier of a shortcut, not only the first, and gives the shortcut as UI Events writes it (`Write it Control+Shift+s`).

  Outcomes and reason codes are unchanged by these texts; the new texts are in `i18n/en.json`.

### Fixed

- `wai-aria-combobox-popup` reads the role a popup's tag gives it, not only its `role` attribute: a combobox whose `aria-controls` names a `<dialog>` (role dialog) now passes, where it failed. A `<ul>` (role list) or a `<table>` (role table, not grid) still fails, and the message names the role its tag gives it (`whose tag gives it role list`). The message that said the rule "does not read" an element as a popup is gone, with its key.
- `wai-aria-setsize` counts an item's role by its tag too, where that role takes `aria-setsize` (`<li>` listitem, `<option>` option, `<article>` article, `<tr>` row): `<ul><li aria-setsize="5">a</li><li aria-setsize="3">b</li></ul>` now fails as inconsistent, where it was not applicable. Items with a `role` attribute are checked as before; this only adds findings.
- `wai-aria-keyshortcuts` reads a near-miss of a modifier's name as a misspelt modifier: a key that is not a shortcut's last, of three letters or more, and one or two edits from Alt, AltGraph, Control, Meta or Shift, in any case, fails with `KEYSHORTCUTS_MODIFIER_NAME`, and the message asks whether it means that modifier (`Contol+S`: did you mean "Control"?). `Contol+S`, `Shft+S` and `Atl+S` now fail, where they passed; `A+S` and `S` still pass.

## [1.0.2] - 2026-11-08

### Fixed

- `wai-aria-setsize` and `wai-aria-presentational-attributes` no longer use `Array.from`, which old libraries (Prototype, MooTools) replace. With core 1.16.0, which scans such pages, a page that replaces it is scanned with the pack too; before, the scan stopped with `PAGE_BUILTINS_BROKEN`.

## [1.0.1] - 2026-11-07

### Fixed

- The pack gave core the range `^1.14.2`, and it needs 1.15.0, as `package.json` says. On core 1.14 it fails on load; it now gives `^1.15.0`.

## [1.0.0] - 2026-11-05

The same pack as 0.1.0, as a first stable version, in line with the other SureA11y packages. Needs `@surea11y/core` 1.15.0.

## [0.1.0] - 2026-11-05

First release. Needs `@surea11y/core` 1.15.0.

### Added

- WAI-ARIA 1.2 as a standard: the profile `wai-aria-1.2` runs core's ARIA rules and reports one result per author requirement (names required, roles, required states, supported and prohibited attributes, values, owned elements, context roles). Each finding is read by WAI-ARIA's own wording: a MUST or MUST NOT fails the requirement, though WCAG may only ask about it (an unnamed `role="grid"`); a SHOULD is a question. A requirement no rule fails is a question, never a pass.
- Rules of the pack's own for what core doesn't check: a scrollbar's `aria-controls`, a feed's articles, a toolbar's name where there are several, a combobox's popup, a spinbutton's owned elements, table indexes and counts, `aria-setsize` and `aria-keyshortcuts`, which fail; a caption outside a figure or table and a state on a presentational element, which are questions. `wai-aria-role-name-present` checks every role WAI-ARIA requires a name for. `docs/COVERAGE.md`: 280 WAI-ARIA 1.2 cases, 257 fail, 22 are questions, none is missed.
- How a person checks each requirement by hand, in `proceduresFor`, with what is valid from the Recommendation's role tables; and the steps for each question name the case found, in WAI-ARIA's words, under `wai-aria-1.2`.
