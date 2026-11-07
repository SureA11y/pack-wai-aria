"use strict";

// Old libraries (Prototype, MooTools) replace Array.from with one that
// drops Sets, Map iterators and the mapping function. On such a page core
// stops the scan when a rule that runs uses Array.from, so the pack's rules
// make their arrays with spread.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rulesDir = path.join(__dirname, "..", "rules");

function ruleFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const file = path.join(dir, e.name);
    if (e.isDirectory()) return ruleFiles(file);
    return e.name.endsWith(".js") ? [file] : [];
  });
}

test("no rule uses Array.from", () => {
  const files = ruleFiles(rulesDir);
  assert.ok(files.length > 0);
  const using = files
    .filter((f) => fs.readFileSync(f, "utf8").includes("Array.from"))
    .map((f) => path.relative(rulesDir, f));
  assert.deepEqual(using, []);
});
