import { chromium } from 'playwright';

const BASE = process.env.BASE || 'https://wzry.panini-pigs.cn/';
const blockSW = process.env.NOSW === '1';

const b = await chromium.launch();
const c = await b.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  serviceWorkers: blockSW ? 'block' : 'allow',
});
const p = await c.newPage();
const net = [];
p.on('response', (r) => {
  if (r.url().includes('.mp3')) net.push(['resp', r.status(), r.headers()['content-type'], r.url().slice(-40)]);
});
p.on('requestfailed', (r) => {
  if (r.url().includes('.mp3')) net.push(['fail', r.failure()?.errorText, r.url().slice(-40)]);
});

await p.goto(`${BASE}#/hero/238`, { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.voice', { timeout: 30000 });
await p.locator('.voice').first().click();
await p.waitForTimeout(4500);
const st = await p.evaluate(() => {
  const a = document.getElementById('wzry-audio');
  return a
    ? { paused: a.paused, ct: +a.currentTime.toFixed(2), dur: a.duration, ready: a.readyState, err: a.error?.code ?? null }
    : null;
});
const sw = await p.evaluate(() => navigator.serviceWorker?.controller?.scriptURL ?? null);
console.log(JSON.stringify({ blockSW, audio: st, sw, net }, null, 2));
await b.close();
