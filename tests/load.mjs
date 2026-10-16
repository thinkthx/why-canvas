// Loads the canvas config and the pure logic out of why-canvas.html so the
// tests run against exactly what ships.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('../why-canvas.html', import.meta.url), 'utf8');

function script(id) {
  const match = html.match(new RegExp(`<script id="${id}"[^>]*>([\\s\\S]*?)</script>`));
  if (!match) throw new Error(`no <script id="${id}"> in why-canvas.html`);
  return match[1];
}

export const HTML = html;
// A fresh context has only the ECMAScript built-ins, so web APIs the core
// uses are passed in.
export const { CANVAS, WhyCanvas } = runInNewContext(
  `${script('canvas-config')}\n${script('core')}\n;({ CANVAS, WhyCanvas })`,
  { URLSearchParams },
);
export const SAMPLES = script('samples');
