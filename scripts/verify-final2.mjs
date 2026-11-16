import { chromium } from 'playwright';

const BASE = 'https://wzry.panini-pigs.cn/';
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
p.on('pageerror', (e) => errors.push(String(e)));
p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await p.goto(BASE, { waitUntil: 'networkidle' });
const cards = await p.locator('.hero-card').count();

// 搜索（等索引加载完）
await p.locator('.searchbar').click();
await p.fill('.overlay__input', '月光');
await p.waitForFunction(() => document.querySelectorAll('.result').length > 5, { timeout: 30000 });
const results = await p.locator('.result').count();
await p.screenshot({ path: `${OUT}/f_search.png` });
await p.locator('.overlay__cancel').click();

// 播放
await p.goto(`${BASE}#/hero/238`, { waitUntil: 'networkidle' });
await p.waitForSelector('.voice');
const voices = await p.locator('.voice').count();
await p.locator('.voice').nth(1).click();
await p.waitForTimeout(2500);
const audio = await p.evaluate(() => {
  const a = document.getElementById('wzry-audio');
  return a ? { paused: a.paused, ct: +a.currentTime.toFixed(2), dur: +a.duration.toFixed(2) } : null;
});
await p.screenshot({ path: `${OUT}/f_hero2.png` });

// 海报
await p.locator('button:has-text("看海报")').click();
await p.waitForTimeout(2500);
await p.screenshot({ path: `${OUT}/f_poster.png` });

console.log(JSON.stringify({ cards, results, voices, audio, errors: errors.slice(0, 4) }, null, 2));
await b.close();
