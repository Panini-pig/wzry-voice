import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://127.0.0.1:4173/';
const OUT = process.env.OUT || process.env.TEMP || '.';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/m_home.png` });

await page.goto(`${BASE}#/hero/223`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/m_hero.png` });

// 点第一条台词，出现播放器
await page.locator('.voice').first().click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/m_hero_playing.png` });

// 海报
await page.locator('button:has-text("看海报")').click();
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/m_poster.png` });
await page.locator('.poster__close').click();

// 搜索
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.locator('.searchbar').click();
await page.waitForTimeout(400);
await page.fill('.overlay__input', '月光');
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/m_search.png` });

console.log(JSON.stringify({ errors: errors.slice(0, 6) }, null, 2));
await browser.close();
