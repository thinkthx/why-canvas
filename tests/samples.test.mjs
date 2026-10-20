import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WhyCanvas, SAMPLES } from './load.mjs';

const { replies, errors } = WhyCanvas.parseReplies(SAMPLES);

test('every sample reads cleanly', () => {
  assert.deepEqual([...errors], []);
  for (const reply of replies) assert.deepEqual([...reply.warnings], [], reply.name);
});

test('each type has six samples, all from one group', () => {
  for (const type of WhyCanvas.DEMO_TYPES) {
    const mine = replies.filter((r) => r.type === type);
    assert.equal(mine.length, 6, type);
    assert.equal(new Set(mine.map((r) => r.group)).size, 1, type);
    assert.equal(new Set(mine.map((r) => r.name)).size, 6, type);
  }
});

test('each type has a full reply, a sparse one, and a real split on the villain', () => {
  for (const type of WhyCanvas.DEMO_TYPES) {
    const mine = replies.filter((r) => r.type === type);
    const started = mine.map((r) => WhyCanvas.progress(r).started);
    assert.ok(started.includes(8), `${type}: no full reply`);
    assert.ok(started.some((n) => n <= 3), `${type}: no sparse reply`);
    assert.ok(new Set(mine.map((r) => r.answers['villain.name']).filter(Boolean)).size >= 3, `${type}: villains agree too much`);
  }
});

test('demo replies are one type only, keyed for the board', () => {
  const demo = WhyCanvas.demoReplies(SAMPLES, 'team');
  assert.equal(Object.keys(demo).length, 6);
  assert.ok(Object.values(demo).every((r) => r.type === 'team'));
});

test('a demo session takes its group from the samples, so no reply is flagged', () => {
  for (const type of WhyCanvas.DEMO_TYPES) {
    const { settings, replies: demo } = WhyCanvas.demoSession(SAMPLES, type);
    assert.equal(settings.type, type);
    assert.ok(settings.group, type);
    for (const reply of Object.values(demo)) assert.deepEqual([...WhyCanvas.mismatch(reply, settings)], [], `${type}: ${reply.name}`);
  }
});

test('every type has a full example canvas', () => {
  for (const type of WhyCanvas.TYPES) {
    const reply = WhyCanvas.exampleReply(SAMPLES, type);
    assert.equal(reply.type, type);
    assert.equal(WhyCanvas.progress(reply).started, 8, type);
  }
});

test('no sample mentions a chat product or channel', () => {
  assert.doesNotMatch(SAMPLES, /\b(Slack|chat)\b/i);
});
