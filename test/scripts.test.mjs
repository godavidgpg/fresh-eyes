// Runs perceive.js and tokens.js against examples/sloppy-dashboard.html and checks
// that the deliberate problems are detected. Run: npm test
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const scripts = join(root, 'skills', 'fresh-eyes', 'scripts');
const perceiveSrc = await readFile(join(scripts, 'perceive.js'), 'utf8');
const tokensSrc = await readFile(join(scripts, 'tokens.js'), 'utf8');
const url = pathToFileURL(join(root, 'examples', 'sloppy-dashboard.html')).href;

const browser = await chromium.launch();
let failed = 0;
const check = (name, fn) => { try { fn(); console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}\n     ${e.message}`); } };

try {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(url);
    const p = await page.evaluate(`(${perceiveSrc.trim()})()`);
    const t = await page.evaluate(`(${tokensSrc.trim()})()`);
    console.log(`\n# ${w}x${h}  scan order: ${p.predictedScanOrder.map(s => s.label).join(' > ')}`);

    check('scan order returns ranked items', () => assert.ok(p.predictedScanOrder.length >= 3));
    check('icon-only controls found', () => assert.ok(p.controlsSummary.iconOnly >= 2, JSON.stringify(p.controlsSummary)));
    check('accessible name of icon button exposed', () => assert.ok(p.controls.some(c => c.iconOnly && /Export to CSV/.test(c.name))));
    check('fake div button detected', () => assert.ok(p.controlsSummary.fakeButtons >= 1));
    check('small targets under 24px', () => assert.ok(p.smallTargets.some(s => s.belowWcag24)));
    check('false affordance (underlined non-link)', () => assert.ok(p.falseAffordances.some(f => /View all payouts/.test(f.text))));
    check('vague link label', () => assert.ok(p.vagueLinks.includes('더보기')));
    check('dead link', () => assert.ok(p.deadLinks.length >= 1));
    check('placeholder-only input', () => assert.ok(p.placeholderOnly.length >= 1));
    check('low contrast text', () => assert.ok(p.lowContrast.length >= 1));
    if (w === 1440) {
      check('gradient text', () => assert.ok(t.slopSignals.gradientText.length >= 1));
      check('gradient surfaces', () => assert.ok(t.slopSignals.gradientSurfaces.length >= 1));
      check('glow shadows', () => assert.ok(t.slopSignals.glowShadows.length >= 1));
      check('uppercase tracked labels', () => assert.ok(t.slopSignals.upperTracked.length >= 1));
    }
    check('emoji in UI', () => assert.ok(t.slopSignals.emojiInUI.length >= 1));
    check('infinite animation', () => assert.ok(t.slopSignals.infiniteAnimations.length >= 1));
    check('transition: all', () => assert.ok(t.slopSignals.transitionAll.length >= 1));
    check('exclamations', () => assert.ok(t.slopSignals.exclamations.length >= 1));
    check('heavy weights', () => assert.ok(t.slopSignals.heavyWeights.length >= 1));
    check('off-grid spacing', () => assert.ok(t.offGrid4pxShare > 0.2, String(t.offGrid4pxShare)));
    await page.close();
  }
  // a clean page should not light up slop signals
  const page = await browser.newPage();
  await page.setContent('<main style="font:16px system-ui;padding:24px"><h1 style="font-weight:500">October 2026</h1><p>Revenue $48,210, +12% vs last month</p><button style="padding:8px 16px">Export CSV</button></main>');
  const t = await page.evaluate(`(${tokensSrc.trim()})()`);
  check('clean page has no slop signals', () => assert.equal(t.slopSignalKinds, 0, JSON.stringify(t.slopSignals)));
} finally {
  await browser.close();
}

console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
