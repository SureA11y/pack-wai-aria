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
 *   its case or a common short name (Ctrl, Cmd, Option, Win), would be one,
 *   or one that is not the shortcut's last key, has three letters or more,
 *   and is one or two edits (letters added, removed or replaced, in any
 *   case) from a modifier's name: Contol, Shft and Atl are misspelt
 *   Control, Shift and Alt, while A in A+S, and any last key, is not.
 * @reason-codes
 *   - `KEYSHORTCUTS_MODIFIER_NAME` (fail): a shortcut names a modifier
 *     key another way than UI Events does: by another case, a short name,
 *     or a near-miss of its name (Contol+S), which the message names with
 *     the modifier it nearly is.
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
  // Edits (insert, delete or replace a letter) from a to b.
  const editDistance = (a, b) => {
    let prev = [];
    for (let j = 0; j <= b.length; j++) prev.push(j);
    for (let i = 1; i <= a.length; i++) {
      const row = [i];
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        row.push(Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost));
      }
      prev = row;
    }
    return prev[b.length];
  };
  // The modifier a key that is not a shortcut's last nearly names: one or
  // two edits from it, in any case, for a key of three letters or more.
  const nearModifier = (key) => {
    if (key.length < 3) return "";
    const lower = key.toLowerCase();
    let best = "";
    let bestDistance = 3;
    for (const m of MODIFIERS) {
      const d = editDistance(lower, m.toLowerCase());
      if (d < bestDistance) {
        best = m;
        bestDistance = d;
      }
    }
    return best;
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
      // Each misnamed modifier key: by another case or a short name
      // anywhere, or by a near-miss of its name where it is not the last key.
      const nameOf = new Map();
      const nearKeys = [];
      keys.forEach((k, i) => {
        if (MODIFIERS.includes(k) || nameOf.has(k)) return;
        if (Object.prototype.hasOwnProperty.call(ALIASES, k.toLowerCase())) {
          nameOf.set(k, ALIASES[k.toLowerCase()]);
        } else if (i < keys.length - 1) {
          const near = nearModifier(k);
          if (near) {
            nameOf.set(k, near);
            nearKeys.push(k);
          }
        }
      });
      const misnamedKeys = [...nameOf.keys()];
      if (misnamedKeys.length) {
        const misnamed = misnamedKeys[0];
        const modifier = nameOf.get(misnamed);
        const near = nearKeys.length > 0;
        // The shortcut as UI Events writes it: each modifier by its name,
        // and the modifiers first.
        const renamed = keys.map((k) => (nameOf.has(k) ? nameOf.get(k) : k));
        const corrected = [
          ...renamed.filter((k) => MODIFIERS.includes(k)),
          ...renamed.filter((k) => !MODIFIERS.includes(k)),
        ].join("+");
        const many = misnamedKeys.length > 1;
        const keyList = misnamedKeys.map((k) => `"${k}"`).join(", ");
        const modifierList = misnamedKeys.map((k) => `"${nameOf.get(k)}"`).join(", ");
        let summary;
        if (near) {
          summary = many
            ? `The shortcut ${shortcut} names modifier keys ${keyList}, which UI Events does not name (did you mean ${modifierList}?).`
            : `The shortcut ${shortcut} names a modifier key "${misnamed}", which UI Events does not name (did you mean "${modifier}"?).`;
        } else {
          summary = many
            ? `The shortcut ${shortcut} names modifier keys ${keyList}, which UI Events calls ${modifierList}.`
            : `The shortcut ${shortcut} names a modifier key "${misnamed}", which UI Events calls "${modifier}".`;
        }
        occurrences.push(
          helpers.reportOccurrence(el, {
            summary,
            hint: `Write it ${corrected}: UI Events names modifier keys Alt, AltGraph, Control, Meta, Shift.`,
            i18n: {
              summaryKey: `waiAriaKeyshortcuts_summary_fail_${many ? "names" : "name"}${near ? "Near" : ""}`,
              hintKey: "waiAriaKeyshortcuts_hint_fail_name",
              params: many
                ? { shortcut, keys: keyList, modifiers: modifierList, corrected }
                : { shortcut, key: misnamed, modifier, corrected },
            },
            data: {
              details: {
                reasonCode: "KEYSHORTCUTS_MODIFIER_NAME",
                shortcut,
                key: misnamed,
                modifier,
                corrected,
                ...(many ? { keys: misnamedKeys } : {}),
                ...(near ? { nearMiss: nearKeys } : {}),
              },
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
