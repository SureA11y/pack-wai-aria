"use strict";

/**
 * @check wai-aria-keyshortcuts
 * @summary aria-keyshortcuts names its modifier keys exactly, first
 * @applicability
 *   Elements in the accessibility tree with a non-empty aria-keyshortcuts.
 * @expectation
 *   Each shortcut, a list of keys joined by "+", names its modifier keys as
 *   UI Events does (Alt, AltGraph, Control, Meta, Shift) and puts them
 *   before its other keys: "Authors MUST specify modifier keys exactly
 *   according to the UI Events KeyboardEvent key Values spec", "MUST ensure
 *   modifier keys come first", and "MUST ensure that required non-modifier
 *   keys come last". A key read as a misspelt modifier is one that, but for
 *   its case or a common short name (Ctrl, Cmd, Option, Win), would be one.
 * @reason-codes
 *   - `KEYSHORTCUTS_MODIFIER_NAME` (fail): a shortcut names a modifier
 *     key another way than UI Events does.
 *   - `KEYSHORTCUTS_MODIFIER_ORDER` (fail): a shortcut puts a modifier key
 *     after a key that is not one.
 *     Basis for both: WAI-ARIA 1.2 aria-keyshortcuts (MUST).
 */

const id = "wai-aria-keyshortcuts";

const meta = {
  title: "aria-keyshortcuts names its modifier keys exactly, first",
  description:
    "Checks that each shortcut in aria-keyshortcuts names its modifier keys as UI Events does (Alt, AltGraph, Control, Meta, Shift), before its other keys.",
  i18n: {
    titleKey: "waiAriaKeyshortcuts_title",
    descriptionKey: "waiAriaKeyshortcuts_description",
  },
  tags: ["wai-aria", "aria", "atomic", "automatic"],
  wcagSc: [],
  defaultSeverity: "minor",
  type: "automatic",
  defaultConfidence: "high",
  reasonCodes: ["KEYSHORTCUTS_MODIFIER_NAME", "KEYSHORTCUTS_MODIFIER_ORDER"],
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;
  const MODIFIERS = ["Alt", "AltGraph", "Control", "Meta", "Shift"];
  // Other names authors give the modifiers, lower case: the name UI Events
  // gives each.
  const ALIASES = {
    alt: "Alt",
    option: "Alt",
    opt: "Alt",
    altgraph: "AltGraph",
    altgr: "AltGraph",
    control: "Control",
    ctrl: "Control",
    ctl: "Control",
    meta: "Meta",
    cmd: "Meta",
    command: "Meta",
    win: "Meta",
    windows: "Meta",
    super: "Meta",
    shift: "Shift",
  };
  // A shortcut's keys: "+" joins them, and "+" is a key of its own where it
  // stands last ("Shift++").
  const keysOf = (shortcut) => {
    const parts = shortcut.split("+");
    const keys = [];
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === "" && i === parts.length - 1 && keys.length) keys.push("+");
      else if (parts[i] !== "") keys.push(parts[i]);
    }
    return keys;
  };
  const nodes = helpers
    .queryAllSmart("[aria-keyshortcuts]")
    .filter((el) => String(helpers.dom.getAttribute(el, "aria-keyshortcuts") || "").trim())
    .filter((el) => helpers.isIncludedInAccessibilityTree(el, ctx));
  if (!nodes.length) {
    return {
      ruleId: rule.ruleId,
      outcome: "notApplicable",
      severity: "minor",
      occurrences: [],
    };
  }
  const occurrences = [];
  for (const el of nodes) {
    const value = String(helpers.dom.getAttribute(el, "aria-keyshortcuts")).trim();
    for (const shortcut of value.split(/\s+/)) {
      const keys = keysOf(shortcut);
      const misnamed = keys.find(
        (k) => !MODIFIERS.includes(k) && Object.prototype.hasOwnProperty.call(ALIASES, k.toLowerCase()),
      );
      if (misnamed) {
        const modifier = ALIASES[misnamed.toLowerCase()];
        occurrences.push(
          helpers.reportOccurrence(el, {
            summary: `The shortcut ${shortcut} names a modifier key "${misnamed}", which UI Events calls "${modifier}".`,
            hint: "Name modifier keys exactly as UI Events does: Alt, AltGraph, Control, Meta, Shift.",
            i18n: {
              summaryKey: "waiAriaKeyshortcuts_summary_fail_name",
              hintKey: "waiAriaKeyshortcuts_hint_fail_name",
              params: { shortcut, key: misnamed, modifier },
            },
            data: {
              details: { reasonCode: "KEYSHORTCUTS_MODIFIER_NAME", shortcut, key: misnamed, modifier },
            },
          }),
        );
        continue;
      }
      const isModifier = (k) => MODIFIERS.includes(k);
      const firstOther = keys.findIndex((k) => !isModifier(k));
      const late = firstOther === -1 ? null : keys.slice(firstOther).find(isModifier);
      if (late) {
        const ordered = [...keys.filter(isModifier), ...keys.filter((k) => !isModifier(k))].join("+");
        occurrences.push(
          helpers.reportOccurrence(el, {
            summary: `The shortcut ${shortcut} puts the modifier key ${late} after another key.`,
            hint: `Put modifier keys first and the other keys last: ${ordered}.`,
            i18n: {
              summaryKey: "waiAriaKeyshortcuts_summary_fail_order",
              hintKey: "waiAriaKeyshortcuts_hint_fail_order",
              params: { shortcut, key: late, ordered },
            },
            data: {
              details: { reasonCode: "KEYSHORTCUTS_MODIFIER_ORDER", shortcut, key: late, ordered },
            },
          }),
        );
      }
    }
  }
  return {
    ruleId: rule.ruleId,
    outcome: occurrences.length ? "fail" : "pass",
    severity: occurrences.length ? rule.defaultSeverity : "minor",
    occurrences,
  };
}

module.exports = { id, meta, runInPage };
