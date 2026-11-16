import { chromium } from 'playwright';

const BASE = process.env.BASE || 'https://wzry-voice.pages.dev/';
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
const errors = [];
const failed = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('requestfailed', (r) => failed.push(`${r.url()} :: ${r.failure()?.errorText}`));

const t0 = Date.now();
await page.goto(BASE, { waitUntil: 'networkidle' });
const loadMs = Date.now() - t0;
const cards = await page.locator('.hero-card').count();

await page.goto(`${BASE}#/hero/223`, { waitUntil: 'networkidle' });
await page.waitForSelector('.voice', { timeout: 15000 });
const voices = await page.locator('.voice').count();
await page.locator('.voice').first().click();
await page.waitForTimeout(2500);

const audio = await page.evaluate(() => {
  const a = document.querySelector('audio');
  return a ? { src: a.src.slice(0, 80), paused: a.paused, t: Number(a.currentTime.toFixed(2)), dur: Number(a.duration.toFixed(1)) } : null;
});

await page.screenshot({ path: (process.env.OUT || '.') + '/live_hero.png' });

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.locator('.searchbar').click();
await page.fill('.overlay__input', '王者');
await page.waitForTimeout(1200);
const results = await page.locator('.result').count();
await page.screenshot({ path: (process.env.OUT || '.') + '/live_search.png' });

console.log(JSON.stringify({ base: BASE, loadMs, cards, voices, audio, results, errors: errors.slice(0, 5), failed: failed.slice(0, 5) }, null, 2));
await browser.close();
