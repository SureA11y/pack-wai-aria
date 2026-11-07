'use strict';

// What npm installs, not the checkout: a file left out of package.json's
// files passes every other test here and fails on require once published.

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const pack = require('..');

const root = path.join(__dirname, '..');

test('the packed package loads with every rule the checkout has', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-wai-aria-'));
  try {
    execFileSync('npm', ['pack', '--pack-destination', dir], { cwd: root, stdio: 'ignore' });
    const [tarball] = fs.readdirSync(dir);
    execFileSync('tar', ['xzf', path.join(dir, tarball), '-C', dir]);
    const unpacked = path.join(dir, 'package');
    fs.symlinkSync(path.join(root, 'node_modules'), path.join(unpacked, 'node_modules'));

    const rules = execFileSync(process.execPath, ['-p', "require('./index.js').rules.length"], {
      cwd: unpacked,
      encoding: 'utf8'
    });
    assert.equal(Number(rules), pack.rules.length);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// Core reads the pack's range, npm reads the peer dependency. Nothing else
// keeps them together: tests run only on the installed core, which fits both.
test('the pack supports the core versions package.json asks for', () => {
  const { peerDependencies } = require('../package.json');
  assert.equal(pack.core, peerDependencies['@surea11y/core']);
});
