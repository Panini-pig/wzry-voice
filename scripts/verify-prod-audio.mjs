import { chromium } from 'playwright';

const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p = await c.newPage();
await p.goto('https://wzry-voice.pages.dev/#/hero/223', { waitUntil: 'networkidle' });
await p.waitForSelector('.voice');
await p.locator('.voice').first().click();
await p.waitForTimeout(2200);
const st = await p.evaluate(() => {
  const a = document.getElementById('wzry-audio');
  return a ? { paused: a.paused, ct: +a.currentTime.toFixed(2), dur: +a.duration.toFixed(2) } : 'no-el';
});
console.log('prod', JSON.stringify(st));
await p.screenshot({ path: (process.env.OUT || '.') + '/live_playing.png' });
await b.close();
