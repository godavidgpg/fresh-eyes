#!/usr/bin/env node
// fresh-eyes / capture.mjs
// Fallback when Playwright MCP is not available. Captures what a person would see
// (first screen, full page, squint, grayscale) at each viewport and runs the
// measurement scripts. Look at the PNGs first; open measurements.json after.
//
// Usage:
//   node capture.mjs <url-or-file> [outDir] [--viewports=390x844,1440x900] [--dark] [--wait=1500]
// Needs: npm i -D playwright && npx playwright install chromium

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const [target, outArg] = args.filter(a => !a.startsWith('--'));

if (!target || flags.help) {
  console.log('Usage: node capture.mjs <url-or-file> [outDir] [--viewports=390x844,1440x900] [--dark] [--wait=1500]');
  process.exit(target ? 0 : 1);
}

async function loadPlaywright() {
  // Prefer the project's playwright (cwd), then one next to this script.
  for (const base of [join(process.cwd(), 'package.json'), join(here, 'package.json')]) {
    try { return createRequire(base)('playwright'); } catch {}
  }
  try { return await import('playwright'); } catch {}
  console.error('Playwright not found. Install it in your project:\n  npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

const url = /^https?:\/\//.test(target) ? target : pathToFileURL(resolve(target)).href;
const outDir = resolve(outArg || 'qa');
const viewports = String(flags.viewports || '390x844,1440x900').split(',').map(v => v.split('x').map(Number));
const waitMs = Number(flags.wait || 1500);
const slug = (() => {
  try { const u = new URL(url); return (u.pathname.replace(/\/+$/, '').split('/').pop() || u.hostname || 'page').replace(/\.[a-z]+$/i, '').replace(/[^\w-]+/g, '-').slice(0, 40) || 'page'; }
  catch { return 'page'; }
})();

const perceiveSrc = await readFile(join(here, 'perceive.js'), 'utf8');
const tokensSrc = await readFile(join(here, 'tokens.js'), 'utf8');
const { chromium } = await loadPlaywright();

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const result = { url, capturedAt: new Date().toISOString(), colorScheme: flags.dark ? 'dark' : 'light', viewports: [] };

try {
  for (const [w, h] of viewports) {
    const mobile = w < 768;
    const context = await browser.newContext({
      viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile,
      colorScheme: flags.dark ? 'dark' : 'light', locale: 'ko-KR'
    });
    const page = await context.newPage();
    const consoleErrors = []; const failedRequests = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
    page.on('pageerror', e => consoleErrors.push(String(e).slice(0, 200)));
    page.on('response', r => { if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.url().slice(0, 120)}`); });

    const t0 = Date.now();
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    const loadMs = Date.now() - t0;
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    // scroll through so lazy content renders, then return to the top
    await page.evaluate(async () => {
      const step = innerHeight * 0.8;
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
      scrollTo(0, 0);
    });
    await page.waitForTimeout(waitMs);

    const base = join(outDir, `${slug}-${w}`);
    const shots = {
      fold: `${base}-default.png`, full: `${base}-full.png`, squint: `${base}-squint.png`, gray: `${base}-gray.png`
    };
    await page.screenshot({ path: shots.fold });
    await page.screenshot({ path: shots.full, fullPage: true });
    await page.evaluate(() => { document.documentElement.style.filter = 'blur(6px)'; });
    await page.screenshot({ path: shots.squint });
    await page.evaluate(() => { document.documentElement.style.filter = 'grayscale(1)'; });
    await page.screenshot({ path: shots.gray });
    await page.evaluate(() => { document.documentElement.style.filter = ''; });

    const perceive = await page.evaluate(`(${perceiveSrc.trim()})()`);
    const tokens = await page.evaluate(`(${tokensSrc.trim()})()`);
    result.viewports.push({ viewport: [w, h], loadMs, screenshots: shots, consoleErrors: consoleErrors.slice(0, 20), failedRequests: failedRequests.slice(0, 20), perceive, tokens });
    await context.close();
    console.log(`captured ${w}x${h}: ${Object.values(shots).map(p => p.split(/[\\/]/).pop()).join(', ')}`);
  }
} finally {
  await browser.close();
}

const jsonPath = join(outDir, `${slug}-measurements.json`);
await writeFile(jsonPath, JSON.stringify(result, null, 2));
console.log(`measurements: ${jsonPath}`);
console.log('Blind-first: judge the PNGs before opening the JSON.');
