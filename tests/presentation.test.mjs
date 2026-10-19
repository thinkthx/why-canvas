import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WhyCanvas} from './load.mjs';
const plain = value => JSON.parse(JSON.stringify(value));
const slide = (entries, template = false) => ({key:'hero.primary', section:{template}, entries:entries.map(text=>({text}))});

test('a long outlier does not reduce the density of later response pages', () => {
  assert.equal(typeof WhyCanvas.presentationPages, 'function', 'presentation pagination is available');
  const pages = WhyCanvas.presentationPages([slide(['long', 'a','b','c','d','e','f'])], {
    fits: page => page.entries.length === 1 || page.entries.every(entry => entry.text !== 'long'),
  });
  assert.deepEqual(plain(pages.map(p=>p.entries.map(e=>e.text))), [['long'],['a','b','c','d','e','f']]);
  assert.deepEqual(plain(pages.map(p=>[p.start,p.part,p.count])), [[0,0,2],[1,1,2]]);
});
test('statements and narrow screens preserve all answers in source order', () => {
  assert.equal(typeof WhyCanvas.presentationPages, 'function');
  const entries = ['a','b','c','d','e','f','g'];
  const statements = WhyCanvas.presentationPages([slide(entries,true)]);
  assert.deepEqual(plain(statements.map(p=>p.entries.map(e=>e.text))), [['a','b','c','d'],['e','f','g']]);
  const narrow = WhyCanvas.presentationPages([slide(entries)],{narrow:true});
  assert.deepEqual(plain(narrow.map(p=>p.entries.map(e=>e.text))), [['a','b'],['c','d'],['e','f'],['g']]);
  assert.equal(WhyCanvas.presentationPages([slide([])]).length,0);
});
test('resize anchors to the response rather than the old page number', () => {
  assert.equal(typeof WhyCanvas.presentationAnchor, 'function');
  const pages = WhyCanvas.presentationPages([slide(['a','b','c','d','e','f','g'])],{narrow:true});
  assert.equal(WhyCanvas.presentationAnchor(pages,{slide:{key:'hero.primary'},start:6}),3);
  assert.equal(WhyCanvas.presentationAnchor(pages,{slide:{key:'missing'},start:0}),0);
});
