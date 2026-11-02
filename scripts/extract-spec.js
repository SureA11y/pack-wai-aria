/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Reads WAI-ARIA 1.2's role tables from the Recommendation and writes them to
 * scripts/data/wai-aria-1.2.json, which the inventory builds its cases from.
 * The specification's own tables, not a package's copy of them: where
 * aria-query differs (treeitem's required states, option's context), the
 * Recommendation is what the requirements say.
 *
 *   curl -sS -o /tmp/wai-aria-1.2.html https://www.w3.org/TR/wai-aria-1.2/
 *   node scripts/extract-spec.js /tmp/wai-aria-1.2.html
 */

const fs = require('node:fs');
const path = require('node:path');

const source = process.argv[2];
if (!source) {
  process.stderr.write('Usage: node scripts/extract-spec.js <wai-aria-1.2.html>\n');
  process.exit(2);
}
const html = fs.readFileSync(source, 'utf8');

const text = (s) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const codes = (s) => [...s.matchAll(/<code>([a-z-]+)<\/code>/g)].map((m) => m[1]);

const starts = [...html.matchAll(/<section class="role[^"]*" id="([a-z]+)">/g)];
const roles = {};
starts.forEach((m, i) => {
  const body = html.slice(m.index, i + 1 < starts.length ? starts[i + 1].index : html.length);
  const cell = (cls) => {
    const r = new RegExp(`<th class="role-${cls}-head"[^>]*>[\\s\\S]*?</th>\\s*<td[^>]*>([\\s\\S]*?)</td>`).exec(body);
    return r ? r[1] : null;
  };
  const implicit = /Implicit Value for Role:<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/.exec(body);
  const defaults = {};
  if (implicit) {
    for (const d of text(implicit[1]).matchAll(/Default for (aria-[a-z]+) is ([^ .]+)/g)) defaults[d[1]] = d[2];
  }
  const owned = cell('mustcontain');
  roles[m[1]] = {
    abstract: /True/.test(text(cell('abstract') || '')),
    superclass: codes(cell('parent') || ''),
    requiredContext: codes(cell('scope') || ''),
    // Each entry a path from the container down: "rowgroup → row" is
    // ['rowgroup', 'row'].
    requiredOwned: owned
      ? owned
          .split(/<\/li>/)
          .map((li) => codes(li))
          .filter((p) => p.length)
      : [],
    requiredProps: codes(cell('required-properties') || ''),
    supportedProps: codes(cell('properties') || ''),
    inheritedProps: codes(cell('inherited') || ''),
    prohibitedProps: codes(cell('disallowed') || ''),
    nameFrom: text(cell('namefrom') || '')
      .split(/\s+/)
      .filter((w) => ['author', 'contents', 'prohibited'].includes(w)),
    nameRequired: /True/.test(text(cell('namerequired') || '')),
    childrenPresentational: /True/.test(text(cell('childpresentational') || '')),
    implicitDefaults: defaults,
    deprecated: /\[Deprecated in ARIA 1\.2\]/.test(text(body.slice(0, 1500))),
    // The states and properties 1.2 deprecates on this role: authors SHOULD
    // NOT use them there.
    deprecatedProps: [
      ...new Set(
        [...body.matchAll(/<code>(aria-[a-z]+)<\/code><\/a>[^<]*<strong>\(deprecated on this role in ARIA 1\.2\)<\/strong>/g)].map(
          (d) => d[1]
        )
      )
    ]
  };
});

const out = path.join(__dirname, 'data', 'wai-aria-1.2.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(
  out,
  JSON.stringify(
    {
      $comment:
        'WAI-ARIA 1.2 (W3C Recommendation, 6 June 2023), its role tables, read from https://www.w3.org/TR/wai-aria-1.2/ by scripts/extract-spec.js.',
      roles
    },
    null,
    2
  ) + '\n'
);
process.stdout.write(`${Object.keys(roles).length} roles -> ${path.relative(process.cwd(), out)}\n`);
