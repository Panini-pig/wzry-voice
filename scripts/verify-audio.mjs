import { chromium } from 'playwright';

const BASE = process.env.BASE || 'https://wzry-voice.pages.dev/';
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await c.newPage();
const mp3 = [];
p.on('response', (r) => {
  if (r.url().includes('.mp3')) mp3.push([r.status(), r.headers()['content-type'], r.url().slice(-48)]);
});
await p.goto(BASE + '#/hero/223', { waitUntil: 'networkidle' });
await p.waitForSelector('.voice');
await p.locator('.voice').first().click();
await p.waitForTimeout(3000);
const btn = await p.locator('.voice').first().locator('.voice__play').innerText();
const playerText = await p.locator('.player__line').innerText();
const time = await p.locator('.player__time').innerText();
await p.screenshot({ path: (process.env.OUT || '.') + '/live_playing.png' });
console.log(JSON.stringify({ btn, playerText, time, mp3: mp3.slice(0, 3) }, null, 2));
await b.close();
