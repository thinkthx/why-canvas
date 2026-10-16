// The synthesis skill: one plain file any agent can follow.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const raw = readFileSync(new URL('../skills/why-canvas-synthesis/SKILL.md', import.meta.url), 'utf8');
const [, front = '', body = ''] = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
const field = (name) => front.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1].trim() ?? '';

test('the skill has a name and a description', () => {
  assert.equal(field('name'), 'why-canvas-synthesis');
  assert.ok(field('description').length > 0);
  assert.ok(front.length <= 1024, `frontmatter is ${front.length} characters`);
  assert.match(field('description'), /^Use when/);
});

test("the skill names the pack's five headings, in order", () => {
  let at = -1;
  for (const heading of ['## At a glance', '## Section by section', '## Why statements', '## Running the session', '## Gaps']) {
    const i = body.indexOf(heading, at + 1);
    assert.ok(i > at, `${heading} missing or out of order`);
    at = i;
  }
});

test('the skill states the hard rules', () => {
  for (const rule of [/at least two replies/i, /one voice/i, /never call a statement (recommended|best)/i, /no names/i,
    /section 7[^.]*never quote/i, /no em-dashes/i, /don't repeat (it|the name)/i, /don't invent/i]) {
    assert.match(body, rule);
  }
});

test('the skill covers every input it may meet', () => {
  for (const text of ['# Why Canvas:', '# Our Why canvas:', 'Updated:', 'Group:', 'Type:', 'Person 1', '_(starred']) {
    assert.ok(body.includes(text), text);
  }
});

test('the skill works pasted into any chatbot', () => {
  assert.doesNotMatch(body, /[—–]/);
  assert.doesNotMatch(body, /\b(Bash|Read tool|Write tool|Claude Code|file system|subagent)\b/i);
});

test('the page carries the skill exactly', async () => {
  const { SKILL_EMBED } = await import('./load.mjs');
  assert.equal(SKILL_EMBED.trim(), body.trim());
});

test('the skill reads exports from the older tool as a group, not a person', () => {
  assert.ok(body.includes('# Our Why canvas: all replies'));
  assert.match(body, /`From:` line lists names; never use them/);
});

test('a combined export is one session whatever its type', () => {
  assert.match(body, /combined export[^.]*is one session[^.]*whatever its type/i);
});

test('small groups keep the outline but lose what points at people', () => {
  assert.match(body, /With 2 to 4 people, keep the outline/);
  assert.match(body, /Drop the One voice and Quote lines/);
});

test('an aligned room may say where it landed, and that is not a winner', () => {
  assert.match(body, /"Where you landed" is allowed: it reports the room's own words, not your judgement/);
});

test('the pack comes back as plain Markdown', () => {
  assert.match(body, /Write the pack as plain Markdown, not inside a code block/);
});
