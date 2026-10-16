// Why Canvas is the plain, unbranded version anyone can take and make their
// own. No file names a community or company, the page carries no logo, and
// the author appears only in the optional credit and the licence.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { CANVAS } from './load.mjs';

const ROOT = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, ROOT), 'utf8');
const THIS_FILE = 'tests/clean-room.test.mjs';

// Every text file in the repo, apart from git's own and this test, which
// has to spell out what it looks for.
function textFiles(dir = '') {
  return readdirSync(new URL(dir || '.', ROOT), { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}${entry.name}`;
    if (entry.name.startsWith('.git') || entry.name === 'node_modules') return [];
    if (entry.isDirectory()) return textFiles(`${path}/`);
    return /\.(html|md|mjs|js|json|txt)$|^LICENSE$/.test(entry.name) && path !== THIS_FILE ? [path] : [];
  });
}

// Case-sensitive, so the -apple-system font name passes.
const BRANDS = [/\bAI on Apple\b/i, /ai-on-apple/i, /\bVersent\b/i, /\bApple\b/];
// The credit and the source address are single lines in the CANVAS block;
// the licence names its holder.
const CREDIT_LINE = /^ {2}credit: \{[^\n]*\},\n/m;
const SOURCE_LINE = /^ {2}source: '[^'\n]*',\n/m;
const AUTHOR = /\bRod\b|rodsampera|thinkthx/i;

test('no file names a community or company', () => {
  for (const path of textFiles()) {
    const text = read(path);
    for (const pattern of BRANDS) assert.doesNotMatch(text, pattern, `${path} matches ${pattern}`);
  }
});

test('the author appears only in the credit and the licence', () => {
  for (const path of textFiles().filter((p) => p !== 'LICENSE')) {
    assert.doesNotMatch(read(path).replace(CREDIT_LINE, '').replace(SOURCE_LINE, ''), AUTHOR, path);
  }
});

test('the credit is optional and says where the code lives', () => {
  assert.equal(CANVAS.credit.name, 'Rod Sampera');
  assert.equal(CANVAS.credit.url, 'https://rodsampera.com');
  assert.equal(CANVAS.source, 'https://github.com/thinkthx/why-canvas');
  assert.match(read('why-canvas.html'), /if \(CANVAS\.credit\)/);
});

test('the code is MIT licensed', () => {
  assert.match(read('LICENSE'), /^MIT License/);
});

test('the page embeds no images', () => {
  const html = read('why-canvas.html');
  assert.doesNotMatch(html, /data:image\//);
  assert.doesNotMatch(html, /<img\b|h\('img'/);
});
