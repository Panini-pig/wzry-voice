import { chromium } from 'playwright';

const BASE = process.env.BASE || 'https://wzry.panini-pigs.cn/';
const OUT = process.env.OUT || '.';

const b = await chromium.launch();
const c = await b.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
const p = await c.newPage();
const errors = [];
const fails = [];
p.on('pageerror', (e) => errors.push(String(e)));
p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
p.on('requestfailed', (r) => fails.push(`${r.url().slice(-60)} :: ${r.failure()?.errorText}`));

const t0 = Date.now();
await p.goto(BASE, { waitUntil: 'networkidle' });
const loadMs = Date.now() - t0;
const cards = await p.locator('.hero-card').count();
await p.screenshot({ path: `${OUT}/final_home.png` });

await p.goto(`${BASE}#/hero/238`, { waitUntil: 'networkidle' });
await p.waitForSelector('.voice');
const voices = await p.locator('.voice').count();
await p.locator('.voice').first().click();
await p.waitForTimeout(2200);
const audio = await p.evaluate(() => {
  const a = document.getElementById('wzry-audio');
  return a ? { paused: a.paused, ct: +a.currentTime.toFixed(2), dur: +a.duration.toFixed(2) } : null;
});
await p.screenshot({ path: `${OUT}/final_hero.png` });

await p.goto(BASE, { waitUntil: 'networkidle' });
await p.locator('.searchbar').click();
await p.fill('.overlay__input', '月光');
await p.waitForTimeout(2500);
const results = await p.locator('.result').count();
await p.screenshot({ path: `${OUT}/final_search.png` });

console.log(JSON.stringify({ base: BASE, loadMs, cards, voices, audio, results, errors: errors.slice(0, 4), fails: fails.slice(0, 4) }, null, 2));
await b.close();
