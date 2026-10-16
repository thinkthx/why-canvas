import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WhyCanvas } from './load.mjs';

const plain = (value) => JSON.parse(JSON.stringify(value));
const read = (hash) => plain(WhyCanvas.readSettings(hash));

test('a participant link reads back exactly, odd characters included', () => {
  const hash = WhyCanvas.settingsHash({ view: 'participant', type: 'community', group: 'Café & Co #1 <b>', host: 'Sam' });
  assert.deepEqual(read(hash), { view: 'participant', type: 'community', group: 'Café & Co #1 <b>', host: 'Sam', incomplete: null });
});

test('a Group view link starts with #group-view and reads back', () => {
  const hash = WhyCanvas.settingsHash({ view: 'facilitator', type: 'community', group: 'Northside', host: '' });
  assert.match(hash, /^#group-view&type=community&group=Northside$/);
  assert.equal(read(hash).view, 'facilitator');
});

test('empty names are left out of the link', () => {
  assert.equal(WhyCanvas.settingsHash({ view: 'participant', type: 'community', group: ' ', host: '' }), '#type=community');
});

test('spaces read back whether written as + or %20', () => {
  assert.equal(read('#type=community&group=North%20side+Coders').group, 'North side Coders');
});

test('names are cleaned and capped in code points', () => {
  const s = read(`#type=community&group=${encodeURIComponent('  a\nb\t\u0007c  ')}&host=${encodeURIComponent('😀'.repeat(40))}`);
  assert.equal(s.group, 'a b c');
  assert.equal([...s.host].length, 30);
  assert.doesNotMatch(s.host, /[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
  assert.equal(read(`#type=community&group=${'x'.repeat(100)}`).group.length, 60);
});

test('a link without a known type goes to the start screen, saying which link was incomplete', () => {
  assert.deepEqual(read('#type=club&group=A'), { view: 'start', type: null, group: 'A', host: '', incomplete: 'participant' });
  assert.equal(read('#group-view').incomplete, 'facilitator');
  assert.equal(read('#facilitator').incomplete, 'facilitator');
  assert.equal(read('').incomplete, null);
  assert.equal(read('#').view, 'start');
});

test('the demo reads its type, falling back to community', () => {
  assert.deepEqual(read('#demo=community'), { view: 'demo', type: 'community', group: '', host: '', incomplete: null });
  assert.equal(read('#demo=nope').type, 'community');
  assert.equal(WhyCanvas.settingsHash({ view: 'demo', type: 'community', group: 'Ignored' }), '#demo=community');
});

test('storage is scoped by type and group, ignoring case and spacing', () => {
  const key = (group, type = 'community') => WhyCanvas.storageKey({ type, group }, 'draft');
  assert.equal(key('Northside Coders'), key('  northside   CODERS '));
  assert.notEqual(key('Northside Coders'), key('Southside Coders'));
  assert.notEqual(key('A', 'community'), key('A', 'team'));
  assert.equal(key(''), 'whycanvas:community:_:draft');
});

test('old #facilitator links still open Group view', () => {
  assert.equal(read('#facilitator&type=team&group=A').view, 'facilitator');
});

test('the demo covers the group types only', () => {
  assert.deepEqual(plain(WhyCanvas.DEMO_TYPES), ['team', 'product', 'community']);
  assert.equal(read('#demo=personal').type, 'community');
});

test('an example link reads its type, any type, falling back to community', () => {
  assert.deepEqual(read('#example=personal'), { view: 'example', type: 'personal', group: '', host: '', incomplete: null });
  assert.equal(read('#example=nope').type, 'community');
  assert.equal(WhyCanvas.settingsHash({ view: 'example', type: 'team', group: 'Ignored' }), '#example=team');
});
