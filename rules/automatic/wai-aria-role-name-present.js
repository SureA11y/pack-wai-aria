"use strict";

/**
 * Core's aria-role-name-present for every name-from-author role WAI-ARIA 1.2
 * requires a name for: grid, meter, progressbar, radiogroup and tree, as
 * core checks them, and application, marquee, table, tabpanel and treegrid,
 * which no WCAG rule owns (its setting roles: 'all'). A variant: core's
 * code, so a fix to it reaches this one. It replaces core's rule in this
 * standard's rule map, so a grid is reported once.
 */

module.exports = {
  id: "wai-aria-role-name-present",
  from: "aria-role-name-present",
  config: { roles: "all" },
  meta: {
    title: "Roles that require an accessible name have one",
    description:
      "Checks that every element whose role WAI-ARIA requires an accessible name for, and names from the author only, has one.",
    i18n: {
      titleKey: "waiAriaRoleNamePresent_title",
      descriptionKey: "waiAriaRoleNamePresent_description",
    },
    tags: ["wai-aria", "aria", "name", "atomic", "automatic"],
    wcagSc: [],
  },
};
