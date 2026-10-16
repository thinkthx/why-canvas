import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CANVAS, WhyCanvas } from './load.mjs';

const plain = (value) => JSON.parse(JSON.stringify(value));
const strings = (value) => (typeof value === 'string' ? [value]
  : Array.isArray(value) ? value.flatMap(strings)
  : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : []);
const purposeIds = () => WhyCanvas.purposeSection.fields.map((f) => f.id).sort();
const blanksIn = (template) => [...template.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);

test('every type sheet overrides only things the canvas has', () => {
  const sectionIds = CANVAS.sections.map((s) => s.id);
  for (const type of WhyCanvas.TYPES) {
    const sheet = CANVAS.types[type];
    for (const id of Object.keys(sheet.fields ?? {})) assert.ok(WhyCanvas.fieldById[id], `${type}: no field ${id}`);
    for (const id of Object.keys(sheet.help ?? {})) assert.ok(sectionIds.includes(id), `${type}: no section ${id}`);
    for (const key of Object.keys({ ...sheet.copy, ...sheet.groupCopy })) assert.ok(key in CANVAS.copy || key in CANVAS.groupCopy, `${type}: no copy key ${key}`);
    for (const key of ['label', 'description', 'fallback']) assert.equal(typeof sheet[key], 'string', `${type}: ${key}`);
  }
});

test('every type template uses each purpose blank exactly once', () => {
  for (const type of WhyCanvas.TYPES) {
    const blanks = blanksIn(WhyCanvas.templateFor(type, 'G'));
    assert.deepEqual(plain([...blanks].sort()), plain(purposeIds()), type);
  }
});

test('resolved copy has no tokens left, with or without names', () => {
  for (const type of WhyCanvas.TYPES) {
    for (const settings of [{}, { group: 'Northside Coders', host: 'Sam' }]) {
      const { text, sections } = WhyCanvas.copyFor(type, settings);
      for (const line of strings({ text, sections: sections.map((s) => ({ help: s.help, fields: s.fields.map((f) => [f.prompt, f.example]) })) })) {
        assert.doesNotMatch(line, /\{[^}]*\}/, `${type}: ${line}`);
      }
    }
  }
});

test('names fill the tokens', () => {
  const { text } = WhyCanvas.copyFor('community', { group: 'Northside Coders', host: 'Sam' });
  assert.equal(text.question, 'Why does Northside Coders exist?');
  assert.equal(text.sendHeading, 'Share it with Sam');
});

test('a fallback that opens a sentence gets a capital, and only then', () => {
  assert.equal(WhyCanvas.fill('{host} reads it. Ask {host}.', {}, 'community'), 'Your facilitator reads it. Ask your facilitator.');
  assert.equal(WhyCanvas.fill('{group} grew', {}, 'community'), 'This community grew');
  assert.equal(WhyCanvas.fill('{host} reads it', { host: 'sam' }, 'community'), 'sam reads it');
});

test('no resolved line starts with a lower-case fallback', () => {
  const fallbacks = [CANVAS.hostFallback, ...WhyCanvas.TYPES.map((t) => CANVAS.types[t].fallback)];
  for (const type of WhyCanvas.TYPES) {
    const { text, sections } = WhyCanvas.copyFor(type, {});
    for (const line of strings({ text, help: sections.map((s) => s.help) })) {
      for (const fallback of fallbacks) {
        assert.ok(!new RegExp(`(^|[.!?]\\s+)${fallback}`).test(line), `${type}: "${line}"`);
      }
    }
  }
});

test('an unknown type falls back to community', () => {
  assert.equal(WhyCanvas.knownType('club'), null);
  assert.equal(WhyCanvas.copyFor('club', {}).type, 'community');
});

test('setup offers community, team and product, in that order', () => {
  assert.deepEqual(plain(WhyCanvas.TYPES), ['community', 'team', 'product', 'personal']);
});

test('the product sentence opens with its name, or a capitalised fallback', () => {
  assert.match(WhyCanvas.purposeSentence({}, { type: 'product', group: 'Penny Jar' }), /^Penny Jar helps \[hero\]/);
  assert.match(WhyCanvas.purposeSentence({}, { type: 'product' }), /^This product helps \[hero\]/);
});

test('each type changes the wording where it should', () => {
  const prompt = (type, id) => WhyCanvas.copyFor(type, {}).sections.flatMap((s) => s.fields).find((f) => f.id === id).prompt;
  assert.notEqual(prompt('team', 'personal.why'), prompt('community', 'personal.why'));
  assert.notEqual(prompt('product', 'hero.primary'), prompt('community', 'hero.primary'));
  assert.equal(prompt('team', 'villain.name'), prompt('community', 'villain.name'));
});

test('a group name with braces stays text and never breaks the purpose sentence', () => {
  for (const group of ['Acme {beta}', '{x}', 'Acme {purpose.hero}']) {
    assert.ok(WhyCanvas.purposeSentence({}, { type: 'product', group }).startsWith(`${group} helps [hero]`), group);
    const parts = plain(WhyCanvas.purposeParts('product', group));
    assert.deepEqual(parts[0], { text: `${group} helps ` }, group);
    assert.doesNotThrow(() => WhyCanvas.toMarkdown({ name: 'Tess', type: 'product', group, updated: 'x', answers: { 'purpose.hero': 'savers' } }));
  }
});

test('a personal canvas speaks in the first person', () => {
  const words = WhyCanvas.copyFor('personal', {});
  assert.equal(words.sections.find((s) => s.id === 'guide').title, 'Why me (the guide)');
  assert.equal(words.text.question, "What's my why?");
  assert.match(WhyCanvas.purposeSentence({}, { type: 'personal' }), /^I want to help \[hero\]/);
});

test('section title overrides name real sections', () => {
  const ids = CANVAS.sections.map((s) => s.id);
  for (const type of WhyCanvas.TYPES) {
    for (const id of Object.keys(CANVAS.types[type].sectionTitles ?? {})) assert.ok(ids.includes(id), `${type}: no section ${id}`);
  }
});

test('without a host the copy is for working alone; with one it names them', () => {
  for (const type of WhyCanvas.TYPES) {
    assert.equal(WhyCanvas.copyFor(type, {}).text.sendHeading, 'Save or send', type);
    assert.doesNotMatch(JSON.stringify(WhyCanvas.copyFor(type, { group: 'X' }).text), /facilitator/i, type);
    assert.equal(WhyCanvas.copyFor(type, { host: 'Sam' }).text.sendHeading, 'Share it with Sam', type);
  }
});
