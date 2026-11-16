import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const out = process.env.OUT || '.';
await p.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
await p.waitForTimeout(500);
await p.screenshot({ path: `${out}/d_home.png` });
await p.goto('http://127.0.0.1:4173/#/hero/238', { waitUntil: 'networkidle' });
await p.waitForTimeout(600);
await p.screenshot({ path: `${out}/d_hero.png` });
await b.close();
console.log('done');
