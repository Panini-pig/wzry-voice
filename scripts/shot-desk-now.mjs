import { chromium } from 'playwright';

const BASE = 'https://wzry.panini-pigs.cn/';
const OUT = process.env.OUT || '.';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

await p.goto(BASE, { waitUntil: 'networkidle' });
await p.waitForTimeout(600);
await p.screenshot({ path: `${OUT}/d1_home.png` });

await p.goto(`${BASE}#/hero/223`, { waitUntil: 'networkidle' });
await p.waitForTimeout(600);
await p.screenshot({ path: `${OUT}/d1_hero.png` });

await p.locator('.voice').first().locator('.voice__play').click();
await p.waitForTimeout(1200);
await p.screenshot({ path: `${OUT}/d1_hero_playing.png` });

await p.goto(BASE, { waitUntil: 'networkidle' });
await p.locator('.searchbar').click();
await p.fill('.overlay__input', '月光');
await p.waitForTimeout(2500);
await p.screenshot({ path: `${OUT}/d1_search.png` });

console.log('done');
await b.close();
