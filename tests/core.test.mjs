import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CANVAS, WhyCanvas, HTML } from './load.mjs';

const priya = () => ({
  name: 'Priya',
  updated: '2026-10-13T03:02:00.000Z',
  answers: {
    'hero.primary': 'Indie developers shipping on-device AI',
    'villain.name': 'The cloud-by-default habit',
    'personal.why': 'I want peers to learn with.',
    'purpose.hero': 'indie developers',
    'purpose.villain': 'the cloud-by-default habit',
  },
});

// Values copied out of the sandbox realm compare cleanly with deepEqual.
const plain = (value) => JSON.parse(JSON.stringify(value));
const parseOne = (text) => {
  const { replies, errors } = WhyCanvas.parseReplies(text);
  assert.deepEqual(plain(errors), []);
  assert.equal(replies.length, 1);
  const { warnings, ...reply } = replies[0];
  return plain(reply);
};

test('the Markdown opens with the name and the metadata', () => {
  const md = WhyCanvas.toMarkdown(priya());
  assert.match(md, /^# Why Canvas: Priya\n/);
  assert.match(md, /\nUpdated: 2026-10-13T03:02:00.000Z\n/);
  assert.doesNotMatch(md, /Name shown/);
});

test('sections and fields become headings, and empty ones are left out', () => {
  const md = WhyCanvas.toMarkdown(priya());
  assert.match(md, /\n## 1\. Who it's for \(the hero\)\n\n### Primary audience\n\nIndie developers shipping on-device AI\n/);
  assert.doesNotMatch(md, /Secondary audience/);
  assert.doesNotMatch(md, /## 2\./);
});

test('a canvas survives the round trip', () => {
  assert.deepEqual(parseOne(WhyCanvas.toMarkdown(priya())), priya());
});

test('multi-paragraph answers and lines starting with # survive the round trip', () => {
  const reply = priya();
  reply.answers['offer.steps'] = '1. Join\n\n# not a heading\n\\# already escaped\n## nor this';
  assert.deepEqual(parseOne(WhyCanvas.toMarkdown(reply)), reply);
});

test('the why statement is written as a sentence, which is not read back as an answer', () => {
  const md = WhyCanvas.toMarkdown(priya());
  assert.match(md, /## 8\. Why statement\n\nWe exist to help indie developers who struggle with \[problem\] because of the cloud-by-default habit/);
  assert.deepEqual(parseOne(md).answers, priya().answers);
});

test('a copy made before the name toggle went still reads', () => {
  const md = WhyCanvas.toMarkdown(priya()).replace('Updated:', 'Name shown with section 7: No\nUpdated:');
  assert.deepEqual(parseOne(md), priya());
});

test('several replies pasted together are read separately', () => {
  const sam = { ...priya(), name: 'Sam', answers: { 'villain.name': 'Gatekeeping' } };
  const { replies } = WhyCanvas.parseReplies(`${WhyCanvas.toMarkdown(priya())}\n\n${WhyCanvas.toMarkdown(sam)}`);
  assert.deepEqual(plain(replies.map((r) => r.name)), ['Priya', 'Sam']);
  assert.equal(replies[1].answers['villain.name'], 'Gatekeeping');
});

test('text mangled by Slack or Windows still reads', () => {
  const md = WhyCanvas.toMarkdown(priya())
    .replace('Updated:', '• Updated:')
    .replace(/\n\n/g, '\n')
    .replace(/\n/g, '\r\n');
  assert.deepEqual(parseOne(md), priya());
});

test('text that is not a canvas gives an error', () => {
  const { replies, errors } = WhyCanvas.parseReplies('hello, here are my thoughts');
  assert.equal(replies.length, 0);
  assert.equal(errors.length, 1);
});

test('a field title the canvas no longer has is reported, not dropped silently', () => {
  const md = WhyCanvas.toMarkdown(priya()).replace('### Primary audience', '### Main audience');
  const [reply] = WhyCanvas.parseReplies(md).replies;
  assert.equal(reply.warnings.length, 1);
  assert.match(reply.warnings[0], /Main audience/);
});

test('progress counts sections with any answer', () => {
  const p = WhyCanvas.progress(priya());
  assert.equal(p.started, 4);
  assert.equal(p.total, 8);
  assert.equal(p.sections.villain, true);
  assert.equal(p.sections.stakes, false);
});

test('no section is marked as a minimum', () => {
  assert.equal(CANVAS.sections.some((s) => 'minimum' in s), false);
  assert.equal('minimumStarted' in WhyCanvas.progress(priya()), false);
});

test('the purpose sentence shows placeholders for empty blanks', () => {
  assert.equal(
    WhyCanvas.purposeSentence({}),
    'We exist to help [hero] who struggle with [problem] because of [villain], so that [bigger change]. We do it by [what we do].',
  );
});

test('earlier answers fill only the empty purpose blanks', () => {
  const answers = { 'hero.primary': 'Builders', 'facing.surface': 'Too much noise', 'purpose.villain': 'Mine' , 'villain.name': 'Hype' };
  const filled = plain(WhyCanvas.prefillPurpose(answers));
  assert.equal(filled['purpose.hero'], 'Builders');
  assert.equal(filled['purpose.problem'], 'Too much noise');
  assert.equal(filled['purpose.villain'], 'Mine');
  assert.equal(filled['purpose.change'], undefined);
});

test('a newer copy replaces an older one, and an older copy is skipped', () => {
  const older = priya();
  const newer = { ...priya(), name: 'priya ', updated: '2026-10-14T00:00:00.000Z' };
  let result = WhyCanvas.mergeReplies({}, [older]);
  result = WhyCanvas.mergeReplies(result.replies, [newer]);
  assert.equal(Object.keys(result.replies).length, 1);
  assert.equal(result.replaced.length, 1);
  result = WhyCanvas.mergeReplies(result.replies, [older]);
  assert.equal(result.skipped.length, 1);
  assert.equal(Object.values(result.replies)[0].updated, '2026-10-14T00:00:00.000Z');
});

test('shuffling is a stable permutation that differs between sections', () => {
  const names = ['Alex', 'Sam', 'Priya', 'Jordan', 'Mei', 'Tom'];
  const a = WhyCanvas.shuffled(names, 'hero', 42);
  assert.deepEqual(plain(a), plain(WhyCanvas.shuffled(names, 'hero', 42)));
  assert.deepEqual(plain([...a].sort()), [...names].sort());
  const orders = new Set(CANVAS.sections.map((s) => WhyCanvas.shuffled(names, s.id, 42).join()));
  assert.ok(orders.size > 1);
});

test('the combined export names everyone, section 7 included', () => {
  const sam = { ...priya(), name: 'Sam', answers: { 'personal.why': 'To meet builders.' } };
  const md = WhyCanvas.combinedMarkdown([priya(), sam], { anonymise: false, seed: 1 });
  assert.match(md, /- \*\*Priya:\*\* The cloud-by-default habit/);
  assert.match(md, /- \*\*Sam:\*\* To meet builders\./);
  assert.match(md, /- \*\*Priya:\*\* I want peers to learn with\./);
});

test('without anonymise, every section lists people in name order', () => {
  const sam = { ...priya(), name: 'Sam' };
  const alex = { ...priya(), name: 'Alex' };
  const personal = CANVAS.sections.find((s) => s.id === 'personal');
  const order = WhyCanvas.arrange([sam, priya(), alex], personal, { anonymise: false, seed: 1 }).map((e) => e.label);
  assert.deepEqual(plain(order), ['Alex', 'Priya', 'Sam']);
});

test('the anonymised combined export has no names at all', () => {
  const md = WhyCanvas.combinedMarkdown([priya()], { anonymise: true, seed: 1 });
  assert.doesNotMatch(md, /Priya/);
  assert.match(md, /\n- The cloud-by-default habit/);
});

test('highlights appear in the combined export', () => {
  const md = WhyCanvas.combinedMarkdown([priya()], {
    anonymise: false, seed: 1,
    highlights: { [WhyCanvas.highlightKey('Priya', 'villain.name')]: { star: true, tag: 'diverge' } },
  });
  assert.match(md, /The cloud-by-default habit _\(starred, diverge\)_/);
});

test('the purpose template splits into text and blanks, in order', () => {
  const parts = plain(WhyCanvas.purposeParts('community'));
  assert.deepEqual(parts.slice(0, 3), [
    { text: 'We exist to help ' },
    { field: 'purpose.hero' },
    { text: ' who struggle with ' },
  ]);
  assert.deepEqual(parts.filter((p) => p.field).map((p) => p.field), plain(WhyCanvas.purposeSection.fields.map((f) => f.id)));
  assert.deepEqual(parts.at(-1), { text: '.' });
});

const tagged = () => ({ ...priya(), type: 'community', group: 'Riverbend Coders' });

test('the Markdown carries the type and group', () => {
  const md = WhyCanvas.toMarkdown(tagged());
  assert.match(md, /\nCanvas: why-canvas \(v1\)\nType: community\nGroup: Riverbend Coders\nUpdated: /);
  assert.deepEqual(parseOne(md), tagged());
});

test('without a type or group, those lines are left out', () => {
  assert.doesNotMatch(WhyCanvas.toMarkdown(priya()), /^(Type|Group):/m);
});

test('a copy in the older Our Why format still reads, with no warnings', () => {
  const md = WhyCanvas.toMarkdown(priya()).replace('# Why Canvas: Priya', '# Our Why canvas: Priya').replace('why-canvas (v1)', 'our-why-2026-10 (v1)');
  const [reply] = WhyCanvas.parseReplies(md).replies;
  assert.equal(reply.name, 'Priya');
  assert.deepEqual(plain(reply.warnings), []);
  assert.deepEqual(plain(WhyCanvas.mismatch(reply, { type: 'community', group: 'Riverbend Coders' })), []);
});

test('a reply from a different group is flagged; the same group in other case is not', () => {
  const here = { type: 'community', group: 'riverbend  coders' };
  assert.deepEqual(plain(WhyCanvas.mismatch(tagged(), here)), []);
  assert.deepEqual(plain(WhyCanvas.mismatch(tagged(), { type: 'community', group: 'Acme' })), ['From a different group: Riverbend Coders.']);
  assert.deepEqual(plain(WhyCanvas.mismatch(tagged(), { type: 'community', group: '' })), ['From a different group: Riverbend Coders.']);
});

test('the combined export names the type and group', () => {
  const md = WhyCanvas.combinedMarkdown([tagged()], { type: 'community', group: 'Riverbend Coders' });
  assert.match(md, /^# Why Canvas: all replies\n\nCanvas: why-canvas \(v1\)\nType: community\nGroup: Riverbend Coders\n/);
});

test('a reply written for another type is flagged', () => {
  const reply = { ...priya(), type: 'team', group: 'the Payments team' };
  assert.deepEqual(plain(WhyCanvas.mismatch(reply, { type: 'product', group: 'the Payments team' })), ['Written for a team canvas, not a product canvas.']);
});

test('the combined export writes each reply’s own purpose sentence', () => {
  const reply = { ...priya(), type: 'product', group: 'Penny Jar' };
  assert.match(WhyCanvas.combinedMarkdown([reply], { type: 'product', group: 'Penny Jar' }), /Penny Jar helps indie developers/);
});

const mine = () => ({ name: 'Tess', type: 'personal', updated: '2026-10-16T01:00:00.000Z', answers: { 'guide.empathy': 'I was one of them.', 'offer.what': 'Mentor new leads', 'purpose.what': 'mentoring' } });

test('a personal canvas writes its own titles, and reads back', () => {
  const md = WhyCanvas.toMarkdown(mine());
  assert.match(md, /\n## 4\. Why me \(the guide\)\n/);
  assert.match(md, /\n### What I do for them\n/);
  assert.match(md, /I do it by mentoring\./);
  assert.deepEqual(parseOne(md), mine());
});

test('a field title from any type reads back, even without a Type line', () => {
  const md = WhyCanvas.toMarkdown(mine()).replace('Type: personal\n', '');
  assert.equal(parseOne(md).answers['offer.what'], 'Mentor new leads');
});

test('a placeholder keeps the capital in a title like "What I do"', () => {
  assert.match(WhyCanvas.purposeSentence({}, { type: 'personal' }), /I do it by \[what I do\]\.$/);
});

test('a copy titled Purpose statement still reads, with no warnings', () => {
  const md = WhyCanvas.toMarkdown(priya()).replace('## 8. Why statement', '## 8. Purpose statement');
  const [reply] = WhyCanvas.parseReplies(md).replies;
  assert.deepEqual(plain(reply.answers), priya().answers);
  assert.deepEqual(plain(reply.warnings), []);
});

test('no copy says purpose statement', () => {
  assert.doesNotMatch(HTML, /purpose statement/i);
});

const people = () => [priya(), { ...priya(), name: 'Sam', answers: { 'villain.name': 'Gatekeeping', 'personal.why': 'To meet builders.' } }];

test('the prompt export names nobody', () => {
  const md = WhyCanvas.promptMarkdown(people(), { type: 'community', group: 'Riverbend', seed: 1 });
  assert.match(md, /Person 1/);
  assert.match(md, /Person 2/);
  assert.doesNotMatch(md, /Priya|Sam/);
  assert.doesNotMatch(md, /^From:/m);
});

test('each person keeps one label in every section', () => {
  const md = WhyCanvas.promptMarkdown(people(), { seed: 1 });
  const label = (text) => md.match(new RegExp(`\\*\\*(Person \\d+):\\*\\* ${text}`))[1];
  assert.equal(label('The cloud-by-default habit'), label('I want peers to learn with\\.'));
});

test("labels don't follow alphabetical order", () => {
  const names = ['Alex', 'Ben', 'Cai', 'Dee', 'Eli', 'Fay'];
  const labels = plain(WhyCanvas.personLabels(names.map((name) => ({ ...priya(), name })), 1));
  assert.notDeepEqual(names.map((n) => labels[n.toLowerCase()]), names.map((_, i) => `Person ${i + 1}`));
  assert.deepEqual(Object.values(labels).sort(), names.map((_, i) => `Person ${i + 1}`).sort());
});

test('highlights travel with the prompt', () => {
  const md = WhyCanvas.promptMarkdown([priya()], { seed: 1, highlights: { [WhyCanvas.highlightKey('Priya', 'villain.name')]: { star: true, tag: 'diverge' } } });
  assert.match(md, /The cloud-by-default habit _\(starred, diverge\)_/);
});

test('a reply from another group says so', () => {
  const replies = [{ ...priya(), type: 'community', group: 'Riverbend' }, { ...priya(), name: 'Sam', type: 'community', group: 'Acme' }];
  const md = WhyCanvas.promptMarkdown(replies, { type: 'community', group: 'Riverbend', seed: 1 });
  assert.match(md, /^People:\n- Person \d: community, Acme$/m);
});

test('the agent prompt is the skill, then the replies', () => {
  assert.ok(WhyCanvas.agentPrompt('SKILL', people(), { seed: 1 }).startsWith('SKILL\n\n---\n\n# Why Canvas: all replies'));
});

test('the Copy prompt note does not overpromise', () => {
  assert.match(CANVAS.agent.note, /What people wrote goes as written/);
});

test('the People list runs Person 1, 2 … 10, not 1, 10, 2', () => {
  const replies = Array.from({ length: 11 }, (_, i) => ({ ...priya(), name: `P${String.fromCharCode(97 + i)}`, type: 'community', group: 'Acme' }));
  const md = WhyCanvas.promptMarkdown(replies, { type: 'community', group: 'Riverbend', seed: 1 });
  const order = [...md.matchAll(/^- (Person \d+): community, Acme$/gm)].map((m) => m[1]);
  assert.deepEqual(order, Array.from({ length: 11 }, (_, i) => `Person ${i + 1}`));
});

test('Group view explains what the prompt is for', () => {
  assert.equal(CANVAS.agent.heading, 'Make sense of the replies');
  assert.match(CANVAS.agent.lead, /prep pack/);
  assert.match(CANVAS.agent.lead, /never picks a winner/);
});
