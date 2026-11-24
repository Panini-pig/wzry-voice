import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://127.0.0.1:4173/';
const OUT = process.env.OUT || '.';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await p.goto(BASE, { waitUntil: 'networkidle' });
await p.waitForTimeout(600);
await p.screenshot({ path: `${OUT}/x_home.png` });

await p.goto(`${BASE}#/hero/223`, { waitUntil: 'networkidle' });
await p.waitForTimeout(700);
await p.screenshot({ path: `${OUT}/x_hero.png` });

await p.locator('.d-vrow').first().click();
await p.waitForTimeout(1800);
await p.screenshot({ path: `${OUT}/x_play.png` });

// 队列 tab
await p.locator('.d-side .d-tab', { hasText: '队列' }).click();
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}/x_queue.png` });

// 搜索
await p.locator('.d-search__input').click();
await p.fill('.d-search__input', '月光');
await p.waitForTimeout(2200);
await p.screenshot({ path: `${OUT}/x_search.png` });

console.log(JSON.stringify({ errors: errors.slice(0, 5) }));
await b.close();
