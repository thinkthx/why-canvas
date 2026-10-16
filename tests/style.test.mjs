import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HTML } from './load.mjs';

const css = HTML.match(/<style>([\s\S]*?)<\/style>/)[1];
const root = css.match(/:root\s*\{([\s\S]*?)\}/)[1];
const rest = css.replace(/:root\s*\{[\s\S]*?\}/, '');
const token = (name) => root.match(new RegExp(`--${name}:\\s*([^;]+);`))[1].trim();

const luminance = (hex) => {
  const [r, g, b] = hex.match(/[0-9a-f]{2}/gi).map((x) => parseInt(x, 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test('colours, fonts, type sizes and radii live only in the token block', () => {
  assert.doesNotMatch(rest, /#[0-9a-f]{3,8}\b/i, 'hex colour outside :root');
  assert.doesNotMatch(rest, /\brgba?\(/, 'rgb colour outside :root');
  assert.doesNotMatch(rest, /font-family:(?!\s*var\()/, 'font-family outside :root');
  assert.doesNotMatch(rest, /font-size:(?!\s*var\()/, 'font size outside :root');
  assert.doesNotMatch(rest, /\bfont:[^;}]*\d+px/, 'font shorthand with a size outside :root');
  assert.doesNotMatch(rest, /border-radius:(?!\s*(?:var\(|0\b|50%))/, 'radius outside :root');
});

test('no web font is embedded', () => {
  assert.doesNotMatch(css, /@font-face/);
  assert.doesNotMatch(token('font'), /Inter/);
});

test('text and the accent meet WCAG AA on their backgrounds', () => {
  for (const [fg, bg] of [['fg1', 'bg'], ['fg2', 'bg'], ['fg3', 'bg'], ['fg3', 'bg-subtle'], ['on-accent', 'accent'], ['on-accent', 'accent-hover'], ['invert-fg', 'invert-bg']]) {
    assert.ok(contrast(token(fg), token(bg)) >= 4.5, `${fg} on ${bg}: ${contrast(token(fg), token(bg)).toFixed(2)}`);
  }
});
